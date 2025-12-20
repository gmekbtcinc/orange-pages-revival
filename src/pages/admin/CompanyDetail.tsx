import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EditCompanyDialog } from "@/components/admin/EditCompanyDialog";
import { CompanyOverrideDialog } from "@/components/admin/CompanyOverrideDialog";
import { PASS_TYPE_SHORT_LABELS, computeEffectiveAllocation, type CompanyAllocationOverride, type ExtendedEventAllocation } from "@/types/user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  ArrowLeft,
  Globe,
  MapPin,
  Calendar,
  Users,
  Crown,
  Clock,
  Edit,
  UserPlus,
  Loader2,
  CheckCircle,
  Bitcoin,
  Shield,
  ExternalLink,
  Ticket,
  Mic,
  UtensilsCrossed,
  Search,
} from "lucide-react";
import { format } from "date-fns";

const tierColors: Record<string, string> = {
  silver: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  gold: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  platinum: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  chairman: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  executive: "bg-orange-500/10 text-orange-500 border-orange-500/30",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30",
  approved: "bg-green-500/10 text-green-500 border-green-500/30",
  rejected: "bg-red-500/10 text-red-500 border-red-500/30",
  confirmed: "bg-green-500/10 text-green-500 border-green-500/30",
};

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const defaultTab = location.hash === "#team" ? "team" : location.hash === "#edit" ? "overview" : "overview";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [editDialogOpen, setEditDialogOpen] = useState(location.hash === "#edit");
  const [tierDialogOpen, setTierDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [selectedEventForOverride, setSelectedEventForOverride] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Fetch company data
  const { data: company, isLoading } = useQuery({
    queryKey: ["admin-company", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          *,
          categories (name),
          memberships (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["admin-company-team", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_memberships")
        .select(`
          id,
          role,
          is_primary,
          created_at,
          profiles (id, display_name, email, avatar_url)
        `)
        .eq("business_id", id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch claims
  const { data: claims = [] } = useQuery({
    queryKey: ["admin-company-claims", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_claims")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch active events for allocations tab
  const { data: activeEvents = [] } = useQuery({
    queryKey: ["active-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, name, event_type, start_date")
        .eq("is_active", true)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch all tier allocations for active events
  const { data: tierAllocations = [] } = useQuery({
    queryKey: ["tier-allocations", company?.memberships?.tier],
    queryFn: async () => {
      if (!company?.memberships?.tier) return [];
      const { data, error } = await supabase
        .from("event_allocations")
        .select("*")
        .eq("tier", company.memberships.tier);
      if (error) throw error;
      return data;
    },
    enabled: !!company?.memberships?.tier,
  });

  // Fetch company overrides
  const { data: companyOverrides = [] } = useQuery({
    queryKey: ["company-overrides", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_allocation_overrides")
        .select("*")
        .eq("business_id", id);
      if (error) throw error;
      return data as CompanyAllocationOverride[];
    },
    enabled: !!id,
  });

  // Fetch activity (ticket claims, symposium registrations, speaker applications)
  const { data: activity = [] } = useQuery({
    queryKey: ["admin-company-activity", id],
    queryFn: async () => {
      if (!id) return [];

      const [tickets, symposiums, speakers, dinners] = await Promise.all([
        supabase
          .from("ticket_claims")
          .select("*, events(name), profiles:profile_id(display_name)")
          .eq("business_id", id)
          .order("claimed_at", { ascending: false })
          .limit(10),
        supabase
          .from("symposium_registrations")
          .select("*, events(name), profiles:profile_id(display_name)")
          .eq("event_id", id) // Note: symposium_registrations doesn't have business_id, filter by profile
          .order("registered_at", { ascending: false })
          .limit(10),
        supabase
          .from("speaker_applications")
          .select("*, events(name), profiles:profile_id(display_name)")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("vip_dinner_rsvps")
          .select("*, events(name), profiles:profile_id(display_name)")
          .order("rsvp_at", { ascending: false })
          .limit(10),
      ]);

      // For symposiums and speakers, we need to filter by profiles belonging to this company
      const { data: companyProfiles } = await supabase
        .from("team_memberships")
        .select("profile_id")
        .eq("business_id", id);
      
      const profileIds = companyProfiles?.map(p => p.profile_id) || [];

      const combined = [
        ...(tickets.data || []).map((t: any) => ({ ...t, type: "ticket", date: t.claimed_at })),
        ...(symposiums.data || [])
          .filter((s: any) => profileIds.includes(s.profile_id))
          .map((s: any) => ({ ...s, type: "symposium", date: s.registered_at })),
        ...(speakers.data || [])
          .filter((s: any) => profileIds.includes(s.profile_id))
          .map((s: any) => ({ ...s, type: "speaker", date: s.created_at })),
        ...(dinners.data || [])
          .filter((d: any) => profileIds.includes(d.profile_id))
          .map((d: any) => ({ ...d, type: "dinner", date: d.rsvp_at })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return combined.slice(0, 20);
    },
    enabled: !!id,
  });

  // Edit company mutation
  const editMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("businesses")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company", id] });
      setEditDialogOpen(false);
      toast({ title: "Company updated", description: "Changes have been saved." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Update tier mutation
  const tierMutation = useMutation({
    mutationFn: async (newTier: string) => {
      const tierValue = newTier as "industry" | "premier" | "executive" | "sponsor" | "chairman";
      if (company?.memberships) {
        const { error } = await supabase
          .from("memberships")
          .update({ tier: tierValue })
          .eq("id", company.memberships.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("memberships")
          .insert([{
            business_id: id!,
            tier: tierValue,
            is_active: true,
          }]);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company", id] });
      setTierDialogOpen(false);
      toast({ title: "Membership updated", description: "Tier has been changed." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!company) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Company not found</h2>
          <Button variant="link" onClick={() => navigate("/admin/companies")}>
            Back to Companies
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const membership = company.memberships;
  const pendingClaimsCount = claims.filter((c) => c.status === "pending").length;

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Companies", href: "/admin/companies" },
        { label: company.name },
      ]}
    >
      <div className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/companies")} className="gap-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="h-16 w-16 rounded-lg object-contain bg-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground">{company.name}</h1>
                {company.categories && (
                  <Badge variant="secondary">{company.categories.name}</Badge>
                )}
              </div>
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <Globe className="h-3 w-3" />
                  {company.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={`/business/${id}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Public Profile
              </a>
            </Button>
            <Button variant="secondary" onClick={() => setEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Company
            </Button>
            <Button variant="secondary" onClick={() => setTierDialogOpen(true)}>
              <Crown className="h-4 w-4 mr-2" />
              {membership ? "Change Tier" : "Add Membership"}
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Calendar className="h-4 w-4" />
                Member Since
              </div>
              <p className="text-lg font-semibold">
                {membership?.member_since
                  ? format(new Date(membership.member_since), "MMM yyyy")
                  : "Not a member"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Crown className="h-4 w-4" />
                Tier
              </div>
              <div>
                {membership?.is_active ? (
                  <Badge variant="outline" className={tierColors[membership.tier] || ""}>
                    {membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)}
                  </Badge>
                ) : (
                  <Badge variant="secondary">Non-Member</Badge>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Users className="h-4 w-4" />
                Team Size
              </div>
              <p className="text-lg font-semibold">{teamMembers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <Clock className="h-4 w-4" />
                Pending Claims
              </div>
              <p className="text-lg font-semibold">{pendingClaimsCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="membership">Membership</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
            <TabsTrigger value="claims">Claims ({claims.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="mt-1">{company.description || "No description"}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Location</Label>
                    <p className="mt-1 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {[company.city, company.state, company.country].filter(Boolean).join(", ") || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Founded</Label>
                    <p className="mt-1">{company.founded || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Employees</Label>
                    <p className="mt-1">{company.employees || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Contact</Label>
                    <p className="mt-1">{company.email || "Not specified"}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bitcoin Attributes</Label>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={company.is_verified ? "default" : "secondary"}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {company.is_verified ? "Verified" : "Not Verified"}
                    </Badge>
                    <Badge variant={company.is_bitcoin_only ? "default" : "secondary"}>
                      <Bitcoin className="h-3 w-3 mr-1" />
                      {company.is_bitcoin_only ? "Bitcoin Only" : "Not Bitcoin Only"}
                    </Badge>
                    <Badge variant={company.is_bfc_member ? "default" : "secondary"}>
                      <Shield className="h-3 w-3 mr-1" />
                      {company.is_bfc_member ? "BFC Member" : "Not BFC Member"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="membership" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Membership Details</CardTitle>
              </CardHeader>
              <CardContent>
                {membership ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Status</Label>
                        <p className="mt-1">
                          <Badge variant={membership.is_active ? "default" : "secondary"}>
                            {membership.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Tier</Label>
                        <p className="mt-1">
                          <Badge variant="outline" className={tierColors[membership.tier] || ""}>
                            <Crown className="h-3 w-3 mr-1" />
                            {membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Member Since</Label>
                        <p className="mt-1">{format(new Date(membership.member_since), "MMMM d, yyyy")}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Renewal Date</Label>
                        <p className="mt-1">
                          {membership.renewal_date
                            ? format(new Date(membership.renewal_date), "MMMM d, yyyy")
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Billing Email</Label>
                        <p className="mt-1">{membership.billing_email || "Not set"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Billing Contact</Label>
                        <p className="mt-1">{membership.billing_contact_name || "Not set"}</p>
                      </div>
                    </div>
                    {membership.notes && (
                      <div>
                        <Label className="text-muted-foreground">Notes</Label>
                        <p className="mt-1">{membership.notes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Membership</h3>
                    <p className="text-muted-foreground mb-4">This company is not currently a BFC member.</p>
                    <Button onClick={() => setTierDialogOpen(true)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Create Membership
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Allocations</CardTitle>
                <CardDescription>
                  Ticket and seat allocations for this company across all active events.
                  {membership && ` Based on ${membership.tier.charAt(0).toUpperCase() + membership.tier.slice(1)} tier defaults.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!membership ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Membership</h3>
                    <p className="text-muted-foreground">This company needs an active membership to receive allocations.</p>
                  </div>
                ) : activeEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Events</h3>
                    <p className="text-muted-foreground">There are no active events at this time.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Event</TableHead>
                          <TableHead className="text-center">{PASS_TYPE_SHORT_LABELS.ga}</TableHead>
                          <TableHead className="text-center">{PASS_TYPE_SHORT_LABELS.pro}</TableHead>
                          <TableHead className="text-center">{PASS_TYPE_SHORT_LABELS.whale}</TableHead>
                          <TableHead className="text-center">Custom</TableHead>
                          <TableHead className="text-center">Symposium</TableHead>
                          <TableHead className="text-center">VIP Dinner</TableHead>
                          <TableHead className="text-center">Override</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeEvents.map((event) => {
                          const tierAlloc = tierAllocations.find((a) => a.event_id === event.id);
                          const override = companyOverrides.find((o) => o.event_id === event.id);

                          // Convert to ExtendedEventAllocation format
                          const extendedAlloc: ExtendedEventAllocation = {
                            id: tierAlloc?.id || "",
                            event_id: event.id,
                            tier: membership.tier,
                            conference_tickets: tierAlloc?.conference_tickets ?? null,
                            ga_tickets: tierAlloc?.ga_tickets ?? 0,
                            pro_tickets: tierAlloc?.pro_tickets ?? 0,
                            whale_tickets: tierAlloc?.whale_tickets ?? 0,
                            custom_tickets: tierAlloc?.custom_tickets ?? 0,
                            custom_pass_name: tierAlloc?.custom_pass_name ?? null,
                            symposium_seats: tierAlloc?.symposium_seats ?? 0,
                            vip_dinner_seats: tierAlloc?.vip_dinner_seats ?? 0,
                            created_at: tierAlloc?.created_at ?? null,
                          };

                          const effective = computeEffectiveAllocation(extendedAlloc, override);

                          return (
                            <TableRow key={event.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{event.name}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{event.event_type}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.ga_tickets_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.ga_tickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.pro_tickets_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.pro_tickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.whale_tickets_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.whale_tickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.custom_tickets_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.custom_tickets}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.symposium_seats_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.symposium_seats}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={effective.has_override && override?.vip_dinner_seats_override !== null ? "font-semibold text-primary" : ""}>
                                  {effective.vip_dinner_seats}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {override ? (
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                                    {override.override_mode === "additive" ? "+/-" : "Set"}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedEventForOverride({ id: event.id, name: event.name });
                                    setOverrideDialogOpen(true);
                                  }}
                                >
                                  {override ? "Edit" : "Add"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {teamMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
                    <p className="text-muted-foreground">No users have been added to this company yet.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Primary</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member: any) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">{member.profiles?.display_name || "—"}</TableCell>
                          <TableCell>{member.profiles?.email || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={member.role === "owner" || member.role === "admin" ? "default" : "secondary"} className="capitalize">
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {member.is_primary ? (
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                                Primary
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {member.created_at
                              ? format(new Date(member.created_at), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="claims" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Claims</CardTitle>
                <CardDescription>Claims submitted for this business</CardDescription>
              </CardHeader>
              <CardContent>
                {claims.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Claims</h3>
                    <p className="text-muted-foreground">No ownership claims have been submitted for this company.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Claimant</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-medium">{claim.claimant_name}</TableCell>
                          <TableCell>{claim.claimant_email}</TableCell>
                          <TableCell>{claim.claimant_title || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[claim.status || ""] || ""}>
                              {claim.status?.charAt(0).toUpperCase() + claim.status?.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {claim.created_at
                              ? format(new Date(claim.created_at), "MMM d, yyyy")
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Ticket claims, registrations, and applications</CardDescription>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Activity</h3>
                    <p className="text-muted-foreground">No recent activity for this company.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        {item.type === "ticket" && <Ticket className="h-5 w-5 text-blue-500" />}
                        {item.type === "symposium" && <UtensilsCrossed className="h-5 w-5 text-purple-500" />}
                        {item.type === "speaker" && <Mic className="h-5 w-5 text-orange-500" />}
                        <div className="flex-1">
                          <p className="font-medium">
                            {item.type === "ticket" && `Ticket Claim: ${item.attendee_name}`}
                            {item.type === "symposium" && `Symposium Registration: ${item.attendee_name}`}
                            {item.type === "speaker" && `Speaker Application: ${item.speaker_name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.events?.name} • {format(new Date(item.date), "MMM d, yyyy")}
                          </p>
                        </div>
                        <Badge variant="outline" className={statusColors[item.status] || ""}>
                          {item.status?.charAt(0).toUpperCase() + item.status?.slice(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Company Dialog */}
      <EditCompanyDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        company={company}
        onSave={(data) => editMutation.mutate(data)}
        isPending={editMutation.isPending}
      />

      {/* Change Tier Dialog */}
      <ChangeTierDialog
        open={tierDialogOpen}
        onOpenChange={setTierDialogOpen}
        currentTier={membership?.tier}
        onSave={(tier) => tierMutation.mutate(tier)}
        isPending={tierMutation.isPending}
      />

      {/* Invite Dialog */}
      <AdminInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        businessId={id!}
      />

      {/* Override Dialog */}
      {selectedEventForOverride && membership && (
        <CompanyOverrideDialog
          businessId={id!}
          eventId={selectedEventForOverride.id}
          eventName={selectedEventForOverride.name}
          tierAllocation={tierAllocations.find((a) => a.event_id === selectedEventForOverride.id) ?? null}
          existingOverride={companyOverrides.find((o) => o.event_id === selectedEventForOverride.id) ?? null}
          open={overrideDialogOpen}
          onOpenChange={(open) => {
            setOverrideDialogOpen(open);
            if (!open) setSelectedEventForOverride(null);
          }}
        />
      )}
    </AdminLayout>
  );
}


function ChangeTierDialog({
  open,
  onOpenChange,
  currentTier,
  onSave,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier?: string;
  onSave: (tier: string) => void;
  isPending: boolean;
}) {
  const [tier, setTier] = useState(currentTier || "industry");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{currentTier ? "Change Membership Tier" : "Create Membership"}</DialogTitle>
          <DialogDescription>
            {currentTier ? "Update the membership tier for this company" : "Add a membership for this company"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Tier</Label>
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="industry">Industry</SelectItem>
              <SelectItem value="premier">Premier</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="chairman">Chairman's Circle</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSave(tier)} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentTier ? "Update Tier" : "Create Membership"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminInviteDialog({
  open,
  onOpenChange,
  businessId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "member">("member");
  const [mode, setMode] = useState<"invite" | "assign">("invite");
  
  // For direct assign mode
  const [searchEmail, setSearchEmail] = useState("");
  const [foundProfile, setFoundProfile] = useState<{ id: string; display_name: string; email: string } | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const searchProfile = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    setSearchError(null);
    setFoundProfile(null);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .eq("email", searchEmail.trim().toLowerCase())
      .maybeSingle();
    
    setSearching(false);
    
    if (error) {
      setSearchError("Error searching for user");
      return;
    }
    
    if (data) {
      setFoundProfile(data);
    } else {
      setSearchError("No user found with this email. They need to create an account first, or use Invite mode.");
    }
  };

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Create invitation record
      const inviteToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error: inviteError } = await supabase
        .from("invitations")
        .insert({
          business_id: businessId,
          email: email.toLowerCase().trim(),
          display_name: displayName.trim(),
          role: role,
          status: "pending",
          token: inviteToken,
          expires_at: expiresAt.toISOString(),
        });

      if (inviteError) throw inviteError;

      // Try to send email
      try {
        await supabase.functions.invoke("send-team-invitation", {
          body: {
            email: email.toLowerCase().trim(),
            displayName: displayName.trim(),
            inviterName: "BFC Admin",
            companyName: "the company",
            role: role === "admin" ? "Admin" : role === "owner" ? "Owner" : "Member",
            inviteToken,
            origin: window.location.origin,
          },
        });
      } catch (e) {
        console.error("Email failed:", e);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-team", businessId] });
      toast({ title: "Invitation sent", description: "Team member has been invited." });
      handleClose();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!foundProfile) throw new Error("No user selected");

      // Check if already a member
      const { data: existing } = await supabase
        .from("team_memberships")
        .select("id")
        .eq("profile_id", foundProfile.id)
        .eq("business_id", businessId)
        .maybeSingle();

      if (existing) throw new Error("User is already a team member");

      // Check if first membership
      const { count } = await supabase
        .from("team_memberships")
        .select("*", { count: "exact", head: true })
        .eq("profile_id", foundProfile.id);

      const { error } = await supabase.from("team_memberships").insert({
        profile_id: foundProfile.id,
        business_id: businessId,
        role: role,
        is_primary: (count || 0) === 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-company-team", businessId] });
      toast({ title: "User assigned", description: `${foundProfile?.display_name} has been added to the team.` });
      handleClose();
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleClose = () => {
    setEmail("");
    setDisplayName("");
    setRole("member");
    setSearchEmail("");
    setFoundProfile(null);
    setSearchError(null);
    setMode("invite");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>Add a new user to this company's team.</DialogDescription>
        </DialogHeader>
        
        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as "invite" | "assign")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invite">Send Invitation</TabsTrigger>
            <TabsTrigger value="assign">Direct Assign</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {mode === "invite" ? (
            <>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Find existing user by email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchProfile()}
                  />
                  <Button variant="secondary" onClick={searchProfile} disabled={searching}>
                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                  </Button>
                </div>
              </div>
              {searchError && (
                <p className="text-sm text-destructive">{searchError}</p>
              )}
              {foundProfile && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="font-medium">{foundProfile.display_name}</p>
                  <p className="text-sm text-muted-foreground">{foundProfile.email}</p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {mode === "invite" ? (
            <Button onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !email || !displayName}>
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Invitation
            </Button>
          ) : (
            <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending || !foundProfile}>
              {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Assign to Team
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
