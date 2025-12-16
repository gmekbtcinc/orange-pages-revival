import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ChangeTierDialog } from "@/components/admin/ChangeTierDialog";
import { EditBillingDialog } from "@/components/admin/EditBillingDialog";
import {
  Crown,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Building2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Calendar,
  Users,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { format, isBefore, addDays } from "date-fns";

interface MembershipWithBusiness {
  id: string;
  business_id: string;
  tier: string;
  member_since: string;
  renewal_date: string | null;
  next_payment_due: string | null;
  payment_amount_cents: number | null;
  is_active: boolean | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  billing_email: string | null;
  billing_contact_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  notes: string | null;
  businesses: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

const ITEMS_PER_PAGE = 20;

const tierColors: Record<string, string> = {
  silver: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  platinum: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  chairman: "bg-orange-500/10 text-orange-500 border-orange-500/30",
  executive: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

const tierLabels: Record<string, string> = {
  silver: "Silver",
  gold: "Gold",
  platinum: "Platinum",
  chairman: "Chairman's Circle",
  executive: "Executive",
};

export default function MembershipsAdmin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "cancelled">("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const [selectedMembership, setSelectedMembership] = useState<MembershipWithBusiness | null>(null);
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  // If business_id is in URL, auto-filter
  const businessIdFilter = searchParams.get("business_id");

  // Fetch memberships
  const { data, isLoading } = useQuery({
    queryKey: ["admin-memberships", searchQuery, statusFilter, tierFilter, page, businessIdFilter],
    queryFn: async () => {
      let query = supabase
        .from("memberships")
        .select(`
          *,
          businesses (id, name, logo_url)
        `, { count: "exact" })
        .order("member_since", { ascending: false });

      if (businessIdFilter) {
        query = query.eq("business_id", businessIdFilter);
      }

      const { data: memberships, error } = await query;
      if (error) throw error;

      let filtered = memberships as MembershipWithBusiness[];

      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter((m) =>
          m.businesses?.name?.toLowerCase().includes(q)
        );
      }

      // Status filter
      if (statusFilter === "active") {
        filtered = filtered.filter((m) => m.is_active);
      } else if (statusFilter === "cancelled") {
        filtered = filtered.filter((m) => !m.is_active);
      }

      // Tier filter
      if (tierFilter !== "all") {
        filtered = filtered.filter((m) => m.tier === tierFilter);
      }

      // Paginate
      const total = filtered.length;
      const start = (page - 1) * ITEMS_PER_PAGE;
      const paginated = filtered.slice(start, start + ITEMS_PER_PAGE);

      return {
        memberships: paginated,
        total,
        totalPages: Math.ceil(total / ITEMS_PER_PAGE),
      };
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-membership-stats"],
    queryFn: async () => {
      const { data: memberships } = await supabase
        .from("memberships")
        .select("tier, is_active, payment_amount_cents, renewal_date");

      if (!memberships) return null;

      const active = memberships.filter((m) => m.is_active);
      const tierCounts = active.reduce((acc, m) => {
        acc[m.tier] = (acc[m.tier] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalRevenue = active.reduce((sum, m) => sum + (m.payment_amount_cents || 0), 0);

      const thirtyDaysFromNow = addDays(new Date(), 30);
      const upcomingRenewals = active.filter(
        (m) => m.renewal_date && isBefore(new Date(m.renewal_date), thirtyDaysFromNow)
      ).length;

      return {
        totalActive: active.length,
        tierCounts,
        totalRevenue,
        upcomingRenewals,
      };
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMembership) return;
      const { error } = await supabase
        .from("memberships")
        .update({
          is_active: false,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason,
        })
        .eq("id", selectedMembership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["admin-membership-stats"] });
      setCancelDialogOpen(false);
      setCancellationReason("");
      setSelectedMembership(null);
      toast({ title: "Membership cancelled", description: "The membership has been cancelled." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Reactivate mutation
  const reactivateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMembership) return;
      const { error } = await supabase
        .from("memberships")
        .update({
          is_active: true,
          cancelled_at: null,
          cancellation_reason: null,
        })
        .eq("id", selectedMembership.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
      queryClient.invalidateQueries({ queryKey: ["admin-membership-stats"] });
      setReactivateDialogOpen(false);
      setSelectedMembership(null);
      toast({ title: "Membership reactivated", description: "The membership is now active." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const memberships = data?.memberships || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total || 0;

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "—";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const isRenewalPastDue = (date: string | null) => {
    if (!date) return false;
    return isBefore(new Date(date), new Date());
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6" />
            Memberships
          </h1>
          <p className="text-muted-foreground">
            Manage BFC memberships ({total} total)
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="h-4 w-4" />
                  Active Members
                </div>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Crown className="h-4 w-4" />
                  By Tier
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(stats.tierCounts).map(([tier, count]) => (
                    <Badge key={tier} variant="outline" className={tierColors[tier] || ""}>
                      {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <DollarSign className="h-4 w-4" />
                  Monthly Revenue
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Calendar className="h-4 w-4" />
                  Renewals (30 days)
                </div>
                <p className="text-2xl font-bold">{stats.upcomingRenewals}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>

            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="chairman">Chairman's Circle</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : memberships.length === 0 ? (
              <div className="py-12 text-center">
                <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No memberships found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "No memberships match the current filters"}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Member Since</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.map((membership) => (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div
                          className="flex items-center gap-3 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/admin/companies/${membership.business_id}`)}
                        >
                          {membership.businesses?.logo_url ? (
                            <img
                              src={membership.businesses.logo_url}
                              alt={membership.businesses.name}
                              className="h-8 w-8 rounded-lg object-contain bg-white"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{membership.businesses?.name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tierColors[membership.tier] || ""}>
                          <Crown className="h-3 w-3 mr-1" />
                          {tierLabels[membership.tier] || membership.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(membership.member_since), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {membership.renewal_date ? (
                          <span className={isRenewalPastDue(membership.renewal_date) ? "text-red-500 flex items-center gap-1" : ""}>
                            {isRenewalPastDue(membership.renewal_date) && <AlertTriangle className="h-3 w-3" />}
                            {format(new Date(membership.renewal_date), "MMM d, yyyy")}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(membership.payment_amount_cents)}</TableCell>
                      <TableCell>
                        {membership.is_active ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                            Cancelled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/companies/${membership.business_id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Company
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedMembership(membership);
                              setTierDialogOpen(true);
                            }}>
                              <Crown className="h-4 w-4 mr-2" />
                              Change Tier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedMembership(membership);
                              setBillingDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Billing
                            </DropdownMenuItem>
                            {membership.is_active ? (
                              <DropdownMenuItem
                                className="text-red-500"
                                onClick={() => {
                                  setSelectedMembership(membership);
                                  setCancelDialogOpen(true);
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Membership
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => {
                                setSelectedMembership(membership);
                                setReactivateDialogOpen(true);
                              }}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Change Tier Dialog */}
      {selectedMembership && (
        <ChangeTierDialog
          open={tierDialogOpen}
          onOpenChange={setTierDialogOpen}
          membership={selectedMembership}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
            queryClient.invalidateQueries({ queryKey: ["admin-membership-stats"] });
            setSelectedMembership(null);
          }}
        />
      )}

      {/* Edit Billing Dialog */}
      {selectedMembership && (
        <EditBillingDialog
          open={billingDialogOpen}
          onOpenChange={setBillingDialogOpen}
          membership={selectedMembership}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-memberships"] });
            setSelectedMembership(null);
          }}
        />
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel the membership for {selectedMembership?.businesses?.name}?
              This action can be reversed later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason for cancellation</Label>
            <Textarea
              placeholder="e.g., Non-payment, Customer request..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Active
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancel Membership
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reactivate Confirmation Dialog */}
      <Dialog open={reactivateDialogOpen} onOpenChange={setReactivateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reactivate Membership</DialogTitle>
            <DialogDescription>
              Are you sure you want to reactivate the membership for {selectedMembership?.businesses?.name}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReactivateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => reactivateMutation.mutate()}
              disabled={reactivateMutation.isPending}
            >
              {reactivateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Reactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
