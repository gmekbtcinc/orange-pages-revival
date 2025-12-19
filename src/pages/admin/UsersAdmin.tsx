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
import { Users, UserCheck, Mail, Shield, Search, MoreHorizontal, Eye, Edit, Building2, UserX, UserPlus, Trash2, Ticket, Calendar, Mic, Utensils, BookOpen, ShieldCheck, ShieldAlert, UserCog, Link2, X, Check, ArrowRightLeft } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { EditUserPermissionsDialog } from "@/components/admin/EditUserPermissionsDialog";
import { ManageRolesDialog } from "@/components/admin/ManageRolesDialog";
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { LinkAccountDialog } from "@/components/admin/LinkAccountDialog";
import { ChangeCompanyDialog } from "@/components/admin/ChangeCompanyDialog";
import { BulkEditUsersDialog } from "@/components/admin/BulkEditUsersDialog";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

type UserWithBusiness = {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  role: string;
  business_id: string | null;
  user_id: string | null;
  is_active: boolean | null;
  can_claim_tickets: boolean | null;
  can_register_events: boolean | null;
  can_apply_speaking: boolean | null;
  can_edit_profile: boolean | null;
  can_manage_users: boolean | null;
  can_rsvp_dinners: boolean | null;
  can_request_resources: boolean | null;
  invited_at: string | null;
  accepted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  businesses: { name: string } | null;
};

export default function UsersAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserWithBusiness | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [permissionsOpen, setPermissionsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithBusiness | null>(null);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: string; user_id: string; role: AppRole; email?: string } | null>(null);
  const [roleToRevoke, setRoleToRevoke] = useState<{ id: string; email: string; role: string } | null>(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [linkAccountOpen, setLinkAccountOpen] = useState(false);
  const [userToLink, setUserToLink] = useState<UserWithBusiness | null>(null);
  const [changeCompanyOpen, setChangeCompanyOpen] = useState(false);
  const [userToChangeCompany, setUserToChangeCompany] = useState<UserWithBusiness | null>(null);
  
  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  
  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ userId: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  const pageSize = 25;

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const [total, active, pending, admins, unlinked] = await Promise.all([
        supabase.from("company_users").select("id", { count: "exact", head: true }),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("is_active", true).not("user_id", "is", null).not("business_id", "is", null),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("is_active", true).is("user_id", null).not("business_id", "is", null),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("role", "company_admin"),
        supabase.from("company_users").select("id", { count: "exact", head: true }).is("business_id", null),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        pending: pending.count || 0,
        admins: admins.count || 0,
        unlinked: unlinked.count || 0,
      };
    },
  });

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", search, statusFilter, roleFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("company_users")
        .select("*, businesses(name)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (search) {
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      if (statusFilter === "active") {
        query = query.eq("is_active", true).not("user_id", "is", null).not("business_id", "is", null);
      } else if (statusFilter === "invited") {
        query = query.is("user_id", null).eq("is_active", true).not("business_id", "is", null);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      } else if (statusFilter === "unlinked") {
        query = query.is("business_id", null);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter as "company_admin" | "company_user");
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { users: data as UserWithBusiness[], count: count || 0 };
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

      // Get email info for each role from company_users
      const rolesWithEmail = await Promise.all(
        data.map(async (role) => {
          const { data: companyUser } = await supabase
            .from("company_users")
            .select("email, display_name")
            .eq("user_id", role.user_id)
            .maybeSingle();
          
          if (companyUser) {
            return { ...role, email: companyUser.email, display_name: companyUser.display_name };
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

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("company_users")
        .update({ is_active: isActive })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("User status updated");
    },
    onError: (error) => {
      toast.error("Failed to update user: " + error.message);
    },
  });

  // Delete user mutation - calls edge function to delete from both company_users and auth.users
  const deleteMutation = useMutation({
    mutationFn: async (companyUserId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("delete-user", {
        body: { companyUserId, deleteAuthUser: true },
        headers: sessionData?.session?.access_token 
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : undefined,
      });
      
      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }
      
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success(data?.warning ? "User removed (with warning)" : "User removed completely");
      if (data?.warning) {
        console.warn("Delete warning:", data.warning, data.authError);
      }
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to remove user: " + error.message);
    },
  });

  const totalPages = Math.ceil((usersData?.count || 0) / pageSize);

  // Inline edit mutation
  const inlineEditMutation = useMutation({
    mutationFn: async ({ userId, field, value }: { userId: string; field: string; value: string | boolean }) => {
      const { error } = await supabase
        .from("company_users")
        .update({ [field]: value })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Updated successfully");
      setEditingCell(null);
    },
    onError: (error) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  // Bulk delete mutation - calls edge function for each user to delete from both company_users and auth.users
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const results = await Promise.allSettled(
        ids.map(async (companyUserId) => {
          const response = await supabase.functions.invoke("delete-user", {
            body: { companyUserId, deleteAuthUser: true },
            headers: sessionData?.session?.access_token 
              ? { Authorization: `Bearer ${sessionData.session.access_token}` }
              : undefined,
          });
          if (response.error) {
            throw new Error(response.error.message || "Failed to delete user");
          }
          if (response.data?.error) {
            throw new Error(response.data.error);
          }
          return response.data;
        })
      );
      
      const failures = results.filter(r => r.status === 'rejected');
      if (failures.length > 0) {
        throw new Error(`Failed to delete ${failures.length} of ${ids.length} users`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success(`Deleted ${selectedIds.size} users completely`);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.error("Failed to delete users: " + error.message);
    },
  });

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

  const startInlineEdit = (userId: string, field: string, currentValue: string) => {
    setEditingCell({ userId, field });
    setEditValue(currentValue);
  };

  const saveInlineEdit = () => {
    if (!editingCell) return;
    inlineEditMutation.mutate({ 
      userId: editingCell.userId, 
      field: editingCell.field, 
      value: editValue 
    });
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const getStatusBadge = (user: UserWithBusiness) => {
    if (!user.business_id) return <Badge variant="outline" className="border-blue-500 text-blue-600">Unlinked</Badge>;
    if (!user.is_active) return <Badge variant="destructive">Inactive</Badge>;
    if (!user.user_id) return <Badge className="bg-yellow-500 hover:bg-yellow-600">Invited</Badge>;
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

  const getPermissionIcons = (user: UserWithBusiness) => {
    const perms = [
      { enabled: user.can_claim_tickets, icon: Ticket, label: "Tickets" },
      { enabled: user.can_register_events, icon: Calendar, label: "Events" },
      { enabled: user.can_apply_speaking, icon: Mic, label: "Speaking" },
      { enabled: user.can_edit_profile, icon: Edit, label: "Edit" },
      { enabled: user.can_manage_users, icon: Users, label: "Users" },
      { enabled: user.can_rsvp_dinners, icon: Utensils, label: "Dinners" },
      { enabled: user.can_request_resources, icon: BookOpen, label: "Resources" },
    ];
    return perms.filter((p) => p.enabled).map((p) => (
      <span key={p.label} title={p.label}>
        <p.icon className="h-3 w-3 text-muted-foreground" />
      </span>
    ));
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
          <Button onClick={() => setAddUserOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
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
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
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
              <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
              <Shield className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.admins || 0}</div>
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
                  <TabsTrigger value="unlinked">Unlinked ({stats?.unlinked || 0})</TabsTrigger>
                  <TabsTrigger value="inactive">Inactive</TabsTrigger>
                </TabsList>
              </Tabs>
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="company_admin">Company Admin</SelectItem>
                  <SelectItem value="company_user">Company User</SelectItem>
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
                  <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Selected
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => {
                      if (confirm(`Delete ${selectedIds.size} users? This cannot be undone.`)) {
                        bulkDeleteMutation.mutate(Array.from(selectedIds));
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
                  <TableHead>Permissions</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : usersData?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                            {editingCell?.userId === user.id && editingCell?.field === "display_name" ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-7 w-[150px] text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveInlineEdit();
                                    if (e.key === "Escape") cancelInlineEdit();
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveInlineEdit}>
                                  <Check className="h-3 w-3" />
                                </Button>
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
                            {user.businesses?.name || "Unknown"}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">No Company</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                setUserToLink(user);
                                setLinkAccountOpen(true);
                              }}
                            >
                              <Link2 className="h-3 w-3 mr-1" />
                              Link
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => inlineEditMutation.mutate({ 
                            userId: user.id, 
                            field: "role", 
                            value 
                          })}
                        >
                          <SelectTrigger className="w-[140px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="company_admin">Company Admin</SelectItem>
                            <SelectItem value="company_user">Company User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            value={user.is_active ? "active" : "inactive"}
                            onValueChange={(value) => toggleActiveMutation.mutate({ userId: user.id, isActive: value === "active" })}
                            disabled={toggleActiveMutation.isPending}
                          >
                            <SelectTrigger className="w-[110px] h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          {!user.user_id && user.is_active && (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">{getPermissionIcons(user)}</div>
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setPermissionsOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/companies/${user.business_id}`}>
                                <Building2 className="h-4 w-4 mr-2" />
                                View Company
                              </Link>
                            </DropdownMenuItem>
                            {user.user_id && (
                              <DropdownMenuItem onClick={() => { setUserToChangeCompany(user); setChangeCompanyOpen(true); }}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Change Company
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {user.is_active ? (
                              <DropdownMenuItem
                                onClick={() => toggleActiveMutation.mutate({ userId: user.id, isActive: false })}
                              >
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => toggleActiveMutation.mutate({ userId: user.id, isActive: true })}
                              >
                                <UserPlus className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            {!user.user_id && (
                              <>
                                <DropdownMenuItem onClick={() => { setUserToLink(user); setLinkAccountOpen(true); }}>
                                  <Link2 className="h-4 w-4 mr-2" />
                                  Link Auth Account
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Resend Invitation
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setUserToDelete(user); setDeleteConfirmOpen(true); }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove User
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
      <UserDetailDialog user={selectedUser} open={detailOpen} onOpenChange={setDetailOpen} />
      <EditUserPermissionsDialog user={selectedUser} open={permissionsOpen} onOpenChange={setPermissionsOpen} />
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
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {userToDelete?.display_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
            >
              Remove
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

      {/* Link Account Dialog */}
      <LinkAccountDialog
        user={userToLink}
        open={linkAccountOpen}
        onOpenChange={setLinkAccountOpen}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditUsersDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedUserIds={Array.from(selectedIds)}
        onComplete={() => setSelectedIds(new Set())}
      />

      {/* Change Company Dialog */}
      <ChangeCompanyDialog
        user={userToChangeCompany}
        open={changeCompanyOpen}
        onOpenChange={setChangeCompanyOpen}
      />
    </AdminLayout>
  );
}
