import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, UserCheck, Mail, Shield, Search, MoreHorizontal, Eye, Edit, Building2, UserX, UserPlus, Trash2, ShieldCheck, ShieldAlert, UserCog, X, Check, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { ManageRolesDialog } from "@/components/admin/ManageRolesDialog";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { DirectAssignDialog } from "@/components/admin/DirectAssignDialog";
import { ChangeCompanyDialog } from "@/components/admin/ChangeCompanyDialog";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];
type TeamRole = Database["public"]["Enums"]["team_role"];

// Combined view of team members and pending invitations
type UserListItem = {
  id: string;
  type: "member" | "invitation";
  display_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  role: TeamRole | null;
  business_id: string | null;
  profile_id: string | null;
  is_active: boolean;
  created_at: string | null;
  joined_at: string | null;
  business_name: string | null;
  is_primary: boolean;
  // Invitation-specific
  invitation_status?: string;
  expires_at?: string | null;
};

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; user_id: string; role: AppRole; email?: string } | null>(null);
  const [roleToRevoke, setRoleToRevoke] = useState<{ id: string; email: string; role: string } | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [directAssignOpen, setDirectAssignOpen] = useState(false);
  const [changeCompanyOpen, setChangeCompanyOpen] = useState(false);
  const [userToChangeCompany, setUserToChangeCompany] = useState<UserListItem | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const pageSize = 25;

  // Fetch stats from team_memberships and invitations
  const { data: stats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const [members, pendingInvites, owners, admins] = await Promise.all([
        supabase.from("team_memberships").select("id", { count: "exact", head: true }),
        supabase.from("invitations").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("team_memberships").select("id", { count: "exact", head: true }).eq("role", "owner"),
        supabase.from("team_memberships").select("id", { count: "exact", head: true }).eq("role", "admin"),
      ]);
      return {
        total: (members.count || 0) + (pendingInvites.count || 0),
        active: members.count || 0,
        pending: pendingInvites.count || 0,
        owners: owners.count || 0,
        admins: admins.count || 0,
      };
    },
  });

  // Fetch users from team_memberships with profiles, and pending invitations
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search, statusFilter, roleFilter, page],
    queryFn: async () => {
      const items: UserListItem[] = [];

      // Fetch team memberships with profiles and businesses
      if (statusFilter === "all" || statusFilter === "active") {
        let memberQuery = supabase
          .from("team_memberships")
          .select(`
            id,
            role,
            business_id,
            profile_id,
            created_at,
            joined_at,
            is_primary,
            profiles!team_memberships_profile_id_fkey (
              id,
              display_name,
              email,
              phone,
              title,
              avatar_url
            ),
            businesses (
              id,
              name
            )
          `)
          .order("created_at", { ascending: false });

        // Note: filtering on joined tables with .or() on nullable joins can be tricky
        // For now, we'll filter client-side for search if profiles is null

        if (roleFilter !== "all") {
          memberQuery = memberQuery.eq("role", roleFilter as TeamRole);
        }

        const { data: memberships, error } = await memberQuery;
        if (error) throw error;

        memberships?.forEach((m: any) => {
          items.push({
            id: m.id,
            type: "member",
            display_name: m.profiles?.display_name || "Unknown",
            email: m.profiles?.email || "",
            phone: m.profiles?.phone || null,
            title: m.profiles?.title || null,
            role: m.role,
            business_id: m.business_id,
            profile_id: m.profile_id,
            is_active: true,
            created_at: m.created_at,
            joined_at: m.joined_at || m.created_at,
            business_name: m.businesses?.name || null,
            is_primary: m.is_primary || false,
          });
        });
      }

      // Fetch pending invitations
      if (statusFilter === "all" || statusFilter === "invited") {
        let inviteQuery = supabase
          .from("invitations")
          .select(`
            id,
            email,
            role,
            business_id,
            status,
            expires_at,
            created_at,
            businesses (
              name
            )
          `)
          .eq("status", "pending")
          .order("created_at", { ascending: false });

        if (search) {
          inviteQuery = inviteQuery.ilike("email", `%${search}%`);
        }

        if (roleFilter !== "all") {
          inviteQuery = inviteQuery.eq("role", roleFilter as TeamRole);
        }

        const { data: invitations, error } = await inviteQuery;
        if (error) throw error;

        invitations?.forEach((inv: any) => {
          items.push({
            id: inv.id,
            type: "invitation",
            display_name: inv.display_name || inv.email.split("@")[0],
            email: inv.email,
            phone: null,
            title: null,
            role: inv.role,
            business_id: inv.business_id,
            profile_id: null,
            is_active: false,
            created_at: inv.created_at,
            joined_at: null,
            business_name: inv.businesses?.name || null,
            is_primary: false,
            invitation_status: inv.status,
            expires_at: inv.expires_at,
          });
        });
      }

      // Client-side search filter (since we removed the inner join filter)
      let filteredItems = items;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredItems = items.filter(item => 
          item.display_name?.toLowerCase().includes(searchLower) ||
          item.email?.toLowerCase().includes(searchLower)
        );
      }

      // Sort by created_at descending
      filteredItems.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      // Paginate
      const start = page * pageSize;
      const paginated = filteredItems.slice(start, start + pageSize);

      return { users: paginated, count: filteredItems.length };
    },
  });

  // Fetch admin roles from user_roles table
  const { data: adminRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Get email info for each role from profiles
      const rolesWithEmail = await Promise.all(
        data.map(async (role) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, display_name")
            .eq("id", role.user_id)
            .maybeSingle();
          
          if (profile) {
            return { ...role, email: profile.email, display_name: profile.display_name };
          }

          return { ...role, email: "Unknown", display_name: "Unknown User" };
        })
      );

      return rolesWithEmail;
    },
  });

  // Revoke role mutation
  const revokeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("id", roleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      toast.success("Role revoked successfully");
      setRoleToRevoke(null);
    },
    onError: (error) => {
      toast.error("Failed to revoke role: " + error.message);
    },
  });

  // Delete user completely (including auth.users)
  const deleteMembershipMutation = useMutation({
    mutationFn: async ({ id, type, profileId }: { id: string; type: "member" | "invitation"; profileId?: string | null }) => {
      if (type === "member") {
        // Call edge function to delete completely from system
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              teamMembershipId: id,
              profileId: profileId,
              deleteAuthUser: true,
            }),
          }
        );

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Failed to delete user");
        }
        return result;
      } else {
        // Revoke invitation
        const { error } = await supabase
          .from("invitations")
          .update({ status: "revoked", revoked_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("User deleted successfully");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to delete user: " + error.message);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: TeamRole }) => {
      const { error } = await supabase
        .from("team_memberships")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated successfully");
      setEditingCell(null);
    },
    onError: (error) => {
      toast.error("Failed to update role: " + error.message);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async (items: { id: string; type: "member" | "invitation" }[]) => {
      const results = await Promise.allSettled(
        items.map(async ({ id, type }) => {
          if (type === "member") {
            const { error } = await supabase.from("team_memberships").delete().eq("id", id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", id);
            if (error) throw error;
          }
        })
      );
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} of ${items.length} users`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success(`Deleted ${selectedIds.size} users`);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.error("Failed to delete users: " + error.message);
    },
  });

  const totalPages = Math.ceil((usersData?.count || 0) / pageSize);

  // Selection helpers
  const toggleSelectAll = () => {
    if (!usersData?.users) return;
    if (selectedIds.size === usersData.users.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(usersData.users.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const startInlineEdit = (id: string, field: string, currentValue: string) => {
    setEditingCell({ id, field });
    setEditValue(currentValue);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const getStatusBadge = (user: UserListItem) => {
    if (user.type === "invitation") {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Invited</Badge>;
    }
    if (!user.business_id) {
      return <Badge variant="outline" className="border-blue-500 text-blue-600">No Company</Badge>;
    }
    return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role: TeamRole | null) => {
    if (!role) return null;
    const roleStyles: Record<TeamRole, string> = {
      owner: "bg-amber-500/20 text-amber-600 border-amber-500/30",
      admin: "bg-blue-500/20 text-blue-600 border-blue-500/30",
      member: "bg-slate-500/20 text-slate-600 border-slate-500/30",
    };
    return (
      <Badge variant="outline" className={roleStyles[role]}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <AdminLayout breadcrumbs={[{ label: "Users" }]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="h-6 w-6" />
              Users
            </h1>
            <p className="text-muted-foreground">Manage platform users and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDirectAssignOpen(true)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Direct Assign
            </Button>
            <Button onClick={() => setAddUserOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
              <Mail className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Admins</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats?.owners || 0) + (stats?.admins || 0)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                  className="pl-10"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="invited">Invited</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <Card className="border-primary">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    checked={selectedIds.size === usersData?.users.length}
                    onCheckedChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} users? This cannot be undone.`)) {
                        const items = usersData?.users
                          .filter(u => selectedIds.has(u.id))
                          .map(u => ({ id: u.id, type: u.type })) || [];
                        bulkDeleteMutation.mutate(items);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Selected
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={usersData?.users && usersData.users.length > 0 && selectedIds.size === usersData.users.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : usersData?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  usersData?.users.map((user) => (
                    <TableRow key={user.id} className={selectedIds.has(user.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleSelect(user.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {editingCell?.id === user.id && editingCell?.field === "display_name" ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7 w-[150px] text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") cancelInlineEdit();
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={cancelInlineEdit}>
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <p 
                                className="font-medium cursor-pointer hover:underline" 
                                onClick={() => startInlineEdit(user.id, "display_name", user.display_name)}
                                title="Click to edit"
                              >
                                {user.display_name}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.business_id ? (
                          <Link
                            to={`/admin/companies/${user.business_id}`}
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            <Building2 className="h-3 w-3" />
                            {user.business_name || "Unknown"}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">No Company</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.type === "member" ? (
                          <Select
                            value={user.role || "member"}
                            onValueChange={(value) => updateRoleMutation.mutate({ 
                              id: user.id, 
                              role: value as TeamRole 
                            })}
                          >
                            <SelectTrigger className="w-[120px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="owner">Owner</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getRoleBadge(user.role)
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setDetailOpen(true); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {user.business_id && (
                              <DropdownMenuItem asChild>
                                <Link to={`/admin/companies/${user.business_id}`}>
                                  <Building2 className="h-4 w-4 mr-2" />
                                  View Company
                                </Link>
                              </DropdownMenuItem>
                            )}
                            {user.type === "member" && (
                              <DropdownMenuItem onClick={() => { setUserToChangeCompany(user); setChangeCompanyOpen(true); }}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Change Company
                              </DropdownMenuItem>
                            )}
                            {user.type === "invitation" && (
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2" />
                                Resend Invitation
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setUserToDelete(user); setDeleteConfirmOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {user.type === "invitation" ? "Revoke Invitation" : "Remove User"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, usersData?.count || 0)} of {usersData?.count || 0}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Roles Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Admin Roles
            </CardTitle>
            <Button onClick={() => { setEditingRole(null); setRolesDialogOpen(true); }}>
              <UserPlus className="h-4 w-4 mr-2" />
              Assign Role
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rolesLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : adminRoles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No admin roles assigned
                    </TableCell>
                  </TableRow>
                ) : (
                  adminRoles?.map((roleEntry) => (
                    <TableRow key={roleEntry.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{roleEntry.display_name}</p>
                          <p className="text-sm text-muted-foreground">{roleEntry.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={roleEntry.role === "super_admin" ? "default" : "secondary"}
                          className={
                            roleEntry.role === "super_admin" 
                              ? "bg-red-500 hover:bg-red-600" 
                              : roleEntry.role === "admin" 
                                ? "bg-blue-500 hover:bg-blue-600" 
                                : ""
                          }
                        >
                          {roleEntry.role === "super_admin" && <ShieldAlert className="h-3 w-3 mr-1" />}
                          {roleEntry.role === "admin" && <Shield className="h-3 w-3 mr-1" />}
                          {roleEntry.role === "moderator" && <UserCog className="h-3 w-3 mr-1" />}
                          {roleEntry.role.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {roleEntry.created_at ? format(new Date(roleEntry.created_at), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { 
                              setEditingRole({ 
                                id: roleEntry.id, 
                                user_id: roleEntry.user_id, 
                                role: roleEntry.role as AppRole,
                                email: roleEntry.email 
                              }); 
                              setRolesDialogOpen(true); 
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setRoleToRevoke({ id: roleEntry.id, email: roleEntry.email, role: roleEntry.role })}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Revoke Role
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <UserDetailDialog 
        user={selectedUser && selectedUser.type === "member" && selectedUser.profile_id ? {
          id: selectedUser.id,
          profile_id: selectedUser.profile_id,
          business_id: selectedUser.business_id!,
          role: selectedUser.role || "member",
          is_primary: selectedUser.is_primary,
          joined_at: selectedUser.joined_at || selectedUser.created_at || "",
          created_at: selectedUser.created_at || "",
          profiles: {
            id: selectedUser.profile_id,
            display_name: selectedUser.display_name,
            email: selectedUser.email,
            phone: selectedUser.phone,
            title: selectedUser.title,
            avatar_url: null,
          },
          businesses: selectedUser.business_id ? {
            id: selectedUser.business_id,
            name: selectedUser.business_name || "Unknown",
          } : null,
        } : null}
        open={detailOpen} 
        onOpenChange={setDetailOpen} 
      />
      <ManageRolesDialog 
        open={rolesDialogOpen} 
        onOpenChange={setRolesDialogOpen}
        existingRole={editingRole}
      />
      <AddUserDialog open={addUserOpen} onOpenChange={setAddUserOpen} />

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToDelete?.type === "invitation" ? "Revoke Invitation" : "Delete User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete?.type === "invitation" 
                ? `Are you sure you want to revoke the invitation for ${userToDelete?.email}?`
                : `Are you sure you want to permanently delete ${userToDelete?.display_name}? This will remove them from all teams, delete their profile, and remove their login account. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToDelete && deleteMembershipMutation.mutate({ 
                id: userToDelete.id, 
                type: userToDelete.type,
                profileId: userToDelete.profile_id 
              })}
            >
              {userToDelete?.type === "invitation" ? "Revoke" : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Role Confirmation */}
      <AlertDialog open={!!roleToRevoke} onOpenChange={(open) => !open && setRoleToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Admin Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the <strong>{roleToRevoke?.role.replace("_", " ")}</strong> role from <strong>{roleToRevoke?.email}</strong>? They will lose all associated admin privileges.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => roleToRevoke && revokeRoleMutation.mutate(roleToRevoke.id)}
            >
              Revoke Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Company Dialog */}
      <ChangeCompanyDialog
        user={userToChangeCompany as any}
        open={changeCompanyOpen}
        onOpenChange={setChangeCompanyOpen}
      />

      {/* Direct Assign Dialog */}
      <DirectAssignDialog
        open={directAssignOpen}
        onOpenChange={setDirectAssignOpen}
      />
    </AdminLayout>
  );
}
