import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, Globe, Edit, Settings, ArrowLeft, Ticket, Users, Mic, Utensils, Building2, Check, X, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { EditEventDialog } from "@/components/admin/EditEventDialog";
import { AllocationsDialog } from "@/components/admin/AllocationsDialog";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [allocationsOpen, setAllocationsOpen] = useState(false);

  // Fetch event
  const { data: event, isLoading } = useQuery({
    queryKey: ["event-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch allocations
  const { data: allocations } = useQuery({
    queryKey: ["event-allocations", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_allocations").select("*").eq("event_id", id);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch membership counts by tier for fulfillment projections
  const { data: membershipCounts } = useQuery({
    queryKey: ["membership-counts-by-tier"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select("tier")
        .eq("is_active", true);
      if (error) throw error;
      
      // Count memberships per tier
      const counts: Record<string, number> = {};
      data?.forEach((m) => {
        counts[m.tier] = (counts[m.tier] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch ticket claims
  const { data: ticketClaims } = useQuery({
    queryKey: ["event-ticket-claims", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_claims")
        .select("*, members(display_name, email, businesses(name))")
        .eq("event_id", id)
        .order("claimed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch symposium registrations
  const { data: symposiumRegs } = useQuery({
    queryKey: ["event-symposium-regs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("symposium_registrations")
        .select("*, members(display_name, businesses(name))")
        .eq("event_id", id)
        .order("registered_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch speaker applications
  const { data: speakerApps } = useQuery({
    queryKey: ["event-speaker-apps", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("speaker_applications")
        .select("*, members(display_name, businesses(name))")
        .eq("event_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch VIP dinner RSVPs
  const { data: dinnerRsvps } = useQuery({
    queryKey: ["event-dinner-rsvps", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vip_dinner_rsvps")
        .select("*, members(display_name, businesses(name))")
        .eq("event_id", id)
        .order("rsvp_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Update speaker status mutation
  const updateSpeakerMutation = useMutation({
    mutationFn: async ({ appId, status }: { appId: string; status: string }) => {
      const { error } = await supabase
        .from("speaker_applications")
        .update({ status: status as "approved" | "rejected" })
        .eq("id", appId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-speaker-apps"] });
      toast.success("Speaker application updated");
    },
  });

  // Update dinner RSVP status mutation
  const updateDinnerMutation = useMutation({
    mutationFn: async ({ rsvpId, status }: { rsvpId: string; status: string }) => {
      const { error } = await supabase
        .from("vip_dinner_rsvps")
        .update({ status: status as "confirmed" | "declined", confirmed_at: status === "confirmed" ? new Date().toISOString() : null })
        .eq("id", rsvpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-dinner-rsvps"] });
      toast.success("RSVP status updated");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!event) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">Event not found</h2>
          <Link to="/admin/events" className="text-primary hover:underline">
            Back to events
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "flagship":
        return <Badge className="bg-orange-500">Flagship</Badge>;
      case "regional":
        return <Badge className="bg-blue-500">Regional</Badge>;
      default:
        return <Badge variant="secondary">Secondary</Badge>;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "declined":
        return <Badge variant="destructive">Declined</Badge>;
      case "submitted":
        return <Badge className="bg-blue-500">Submitted</Badge>;
      case "under_review":
        return <Badge className="bg-purple-500">Under Review</Badge>;
      default:
        return <Badge variant="secondary">{status || "Unknown"}</Badge>;
    }
  };

  const getTierLabel = (tier: string) => {
    const labels: Record<string, string> = {
      industry: "Industry",
      premier: "Premier",
      executive: "Executive",
      sponsor: "Sponsor",
      chairman: "Chairman's Circle",
    };
    return labels[tier] || tier;
  };

  return (
    <AdminLayout
      breadcrumbs={[
        { label: "Events", href: "/admin/events" },
        { label: event.name },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/events")} className="gap-1 mb-2 text-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{event.name}</h1>
              {getTypeBadge(event.event_type)}
              {event.is_active ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge variant="secondary">Inactive</Badge>
              )}
            </div>
            {event.subtitle && <p className="text-muted-foreground mt-1">{event.subtitle}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditOpen(true)} className="text-foreground border-border">
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Button>
            <Button variant="outline" onClick={() => setAllocationsOpen(true)} className="text-foreground border-border">
              <Settings className="h-4 w-4 mr-2" />
              Allocations
            </Button>
          </div>
        </div>

        {/* Event Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.start_date ? format(parseISO(event.start_date), "MMM d") : "TBD"}
                  {event.end_date && event.end_date !== event.start_date && ` - ${format(parseISO(event.end_date), "d, yyyy")}`}
                  {event.start_date && (!event.end_date || event.end_date === event.start_date) && `, ${format(parseISO(event.start_date), "yyyy")}`}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {event.location_name && `${event.location_name}, `}
                  {event.location_city}
                  {event.location_country && `, ${event.location_country}`}
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <span>{ticketClaims?.length || 0} Ticket Claims</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{symposiumRegs?.length || 0} Symposium Registrations</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="allocations">Allocations</TabsTrigger>
            <TabsTrigger value="tickets">Tickets ({ticketClaims?.length || 0})</TabsTrigger>
            <TabsTrigger value="symposium">Symposium ({symposiumRegs?.length || 0})</TabsTrigger>
            <TabsTrigger value="speakers">Speakers ({speakerApps?.length || 0})</TabsTrigger>
            <TabsTrigger value="dinner">VIP Dinner ({dinnerRsvps?.length || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.description && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Description</h4>
                    <p className="text-muted-foreground">{event.description}</p>
                  </div>
                )}
                {event.external_url && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Website</h4>
                    <a href={event.external_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {event.external_url}
                    </a>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Symposium</h4>
                    {event.has_symposium ? (
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Date:</span> {event.symposium_date ? format(parseISO(event.symposium_date), "PPP") : "TBD"}</p>
                        <p><span className="text-muted-foreground">Venue:</span> {event.symposium_venue || "TBD"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No symposium for this event</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">VIP Dinner</h4>
                    {event.has_vip_dinner ? (
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Date:</span> {event.vip_dinner_date ? format(parseISO(event.vip_dinner_date), "PPP") : "TBD"}</p>
                        <p><span className="text-muted-foreground">Time:</span> {event.vip_dinner_time || "TBD"}</p>
                        <p><span className="text-muted-foreground">Venue:</span> {event.vip_dinner_venue || "TBD"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No VIP dinner for this event</p>
                    )}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">Speaking Applications</h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {event.speaking_applications_open ? (
                      <Badge className="bg-green-500">Open</Badge>
                    ) : (
                      <Badge variant="secondary">Closed</Badge>
                    )}
                  </p>
                  {event.speaking_deadline && (
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Deadline:</span> {format(parseISO(event.speaking_deadline), "PPP")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allocations" className="space-y-4">
            {/* Fulfillment Projections Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Fulfillment Projections (100% Claim Rate)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-center">Tickets Required</TableHead>
                      <TableHead className="text-center">Symposium Required</TableHead>
                      <TableHead className="text-center">VIP Dinner Required</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {["industry", "premier", "executive", "sponsor", "chairman"].map((tier) => {
                      const alloc = allocations?.find((a) => a.tier === tier);
                      const memberCount = membershipCounts?.[tier] || 0;
                      const ticketsRequired = memberCount * (alloc?.conference_tickets ?? 0);
                      const symposiumRequired = memberCount * (alloc?.symposium_seats ?? 0);
                      const dinnerRequired = memberCount * (alloc?.vip_dinner_seats ?? 0);
                      return (
                        <TableRow key={tier}>
                          <TableCell className="font-medium">{getTierLabel(tier)}</TableCell>
                          <TableCell className="text-center">{memberCount}</TableCell>
                          <TableCell className="text-center">{ticketsRequired}</TableCell>
                          <TableCell className="text-center">{symposiumRequired}</TableCell>
                          <TableCell className="text-center">{dinnerRequired}</TableCell>
                        </TableRow>
                      );
                    })}
                    {/* Totals Row */}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>TOTAL</TableCell>
                      <TableCell className="text-center">
                        {["industry", "premier", "executive", "sponsor", "chairman"].reduce(
                          (sum, tier) => sum + (membershipCounts?.[tier] || 0), 0
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {["industry", "premier", "executive", "sponsor", "chairman"].reduce((sum, tier) => {
                          const alloc = allocations?.find((a) => a.tier === tier);
                          return sum + (membershipCounts?.[tier] || 0) * (alloc?.conference_tickets ?? 0);
                        }, 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {["industry", "premier", "executive", "sponsor", "chairman"].reduce((sum, tier) => {
                          const alloc = allocations?.find((a) => a.tier === tier);
                          return sum + (membershipCounts?.[tier] || 0) * (alloc?.symposium_seats ?? 0);
                        }, 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {["industry", "premier", "executive", "sponsor", "chairman"].reduce((sum, tier) => {
                          const alloc = allocations?.find((a) => a.tier === tier);
                          return sum + (membershipCounts?.[tier] || 0) * (alloc?.vip_dinner_seats ?? 0);
                        }, 0)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Tier Allocations */}
            <Card>
              <CardHeader>
                <CardTitle>Tier Allocations (Per Member)</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-center">Conference Tickets</TableHead>
                      <TableHead className="text-center">Symposium Seats</TableHead>
                      <TableHead className="text-center">VIP Dinner Seats</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {["industry", "premier", "executive", "sponsor", "chairman"].map((tier) => {
                      const alloc = allocations?.find((a) => a.tier === tier);
                      return (
                        <TableRow key={tier}>
                          <TableCell className="font-medium">{getTierLabel(tier)}</TableCell>
                          <TableCell className="text-center">{alloc?.conference_tickets ?? 0}</TableCell>
                          <TableCell className="text-center">{alloc?.symposium_seats ?? 0}</TableCell>
                          <TableCell className="text-center">{alloc?.vip_dinner_seats ?? 0}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Claimed</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ticketClaims?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No ticket claims yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      ticketClaims?.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{claim.attendee_name}</p>
                              <p className="text-sm text-muted-foreground">{claim.attendee_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{claim.attendee_company || (claim.members as any)?.businesses?.name || "N/A"}</TableCell>
                          <TableCell>
                            {claim.is_external_attendee ? (
                              <Badge variant="outline">External</Badge>
                            ) : (
                              <Badge>Member</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">{format(new Date(claim.claimed_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(claim.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="symposium">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Attendee</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Dietary</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {symposiumRegs?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No symposium registrations yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      symposiumRegs?.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{reg.attendee_name}</p>
                              <p className="text-sm text-muted-foreground">{reg.attendee_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{reg.attendee_company || (reg.members as any)?.businesses?.name || "N/A"}</TableCell>
                          <TableCell className="text-sm">{reg.dietary_requirements || "None"}</TableCell>
                          <TableCell className="text-sm">{format(new Date(reg.registered_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{getStatusBadge(reg.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="speakers">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Speaker</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {speakerApps?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No speaker applications yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      speakerApps?.map((app) => (
                        <TableRow key={app.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{app.speaker_name}</p>
                              <p className="text-sm text-muted-foreground">{app.speaker_company}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">{app.proposed_topic}</TableCell>
                          <TableCell><Badge variant="outline">{app.format}</Badge></TableCell>
                          <TableCell>{getStatusBadge(app.status)}</TableCell>
                          <TableCell>
                            {app.status === "submitted" || app.status === "under_review" ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-500" onClick={() => updateSpeakerMutation.mutate({ appId: app.id, status: "approved" })}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => updateSpeakerMutation.mutate({ appId: app.id, status: "rejected" })}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dinner">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Guest</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Dietary</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dinnerRsvps?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No VIP dinner RSVPs yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      dinnerRsvps?.map((rsvp) => (
                        <TableRow key={rsvp.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rsvp.guest_name}</p>
                              <p className="text-sm text-muted-foreground">{rsvp.guest_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>{rsvp.guest_company || (rsvp.members as any)?.businesses?.name || "N/A"}</TableCell>
                          <TableCell className="text-sm">{rsvp.dietary_requirements || "None"}</TableCell>
                          <TableCell>{getStatusBadge(rsvp.status)}</TableCell>
                          <TableCell>
                            {rsvp.status === "pending" ? (
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-500" onClick={() => updateDinnerMutation.mutate({ rsvpId: rsvp.id, status: "confirmed" })}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => updateDinnerMutation.mutate({ rsvpId: rsvp.id, status: "declined" })}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditEventDialog event={event} open={editOpen} onOpenChange={setEditOpen} />
      <AllocationsDialog eventId={event.id} eventName={event.name} open={allocationsOpen} onOpenChange={setAllocationsOpen} />
    </AdminLayout>
  );
}
