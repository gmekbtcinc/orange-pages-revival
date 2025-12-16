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
import { Users, UserCheck, Mail, Shield, Search, MoreHorizontal, Eye, Edit, Building2, UserX, UserPlus, Trash2, Ticket, Calendar, Mic, Utensils, BookOpen } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { UserDetailDialog } from "@/components/admin/UserDetailDialog";
import { EditUserPermissionsDialog } from "@/components/admin/EditUserPermissionsDialog";

type UserWithBusiness = {
  id: string;
  display_name: string;
  email: string;
  phone: string | null;
  title: string | null;
  role: string;
  business_id: string;
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
  const pageSize = 25;

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-users-stats"],
    queryFn: async () => {
      const [total, active, pending, admins] = await Promise.all([
        supabase.from("company_users").select("id", { count: "exact", head: true }),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("is_active", true).not("user_id", "is", null),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("is_active", true).is("user_id", null),
        supabase.from("company_users").select("id", { count: "exact", head: true }).eq("role", "company_admin"),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        pending: pending.count || 0,
        admins: admins.count || 0,
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
        query = query.eq("is_active", true).not("user_id", "is", null);
      } else if (statusFilter === "invited") {
        query = query.is("user_id", null).eq("is_active", true);
      } else if (statusFilter === "inactive") {
        query = query.eq("is_active", false);
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter as "company_admin" | "company_user");
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { users: data as UserWithBusiness[], count: count || 0 };
    },
  });

  // Fetch super admins
  const { data: superAdmins } = useQuery({
    queryKey: ["super-admins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("company_users")
        .delete()
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-stats"] });
      toast.success("User removed");
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error) => {
      toast.error("Failed to remove user: " + error.message);
    },
  });

  const totalPages = Math.ceil((usersData?.count || 0) / pageSize);

  const getStatusBadge = (user: UserWithBusiness) => {
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
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6" />
            Users
          </h1>
          <p className="text-muted-foreground">Manage platform users and permissions</p>
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

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/admin/companies/${user.business_id}`}
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <Building2 className="h-3 w-3" />
                          {user.businesses?.name || "Unknown"}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "company_admin" ? "default" : "secondary"}>
                          {user.role === "company_admin" ? "Company Admin" : "Company User"}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(user)}</TableCell>
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

        {/* Super Admins Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Super Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {superAdmins?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                      No super admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  superAdmins?.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.display_name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {admin.can_manage_memberships && <Badge variant="outline" className="text-xs">Memberships</Badge>}
                          {admin.can_manage_events && <Badge variant="outline" className="text-xs">Events</Badge>}
                          {admin.can_manage_content && <Badge variant="outline" className="text-xs">Content</Badge>}
                          {admin.can_manage_admins && <Badge variant="outline" className="text-xs">Admins</Badge>}
                          {admin.can_impersonate && <Badge variant="outline" className="text-xs">Impersonate</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.is_active ? (
                          <Badge className="bg-green-500">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
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

      {/* Delete Confirmation */}
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
    </AdminLayout>
  );
}
