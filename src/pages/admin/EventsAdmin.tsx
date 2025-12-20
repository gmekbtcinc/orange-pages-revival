import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, MapPin, Users, Ticket, FileText, Mic, MoreHorizontal, Eye, Edit, Settings, Power } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { EditEventDialog } from "@/components/admin/EditEventDialog";
import { AllocationsDialog } from "@/components/admin/AllocationsDialog";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

export default function EventsAdmin() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [allocationsOpen, setAllocationsOpen] = useState(false);
  const pageSize = 10;

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["admin-events-stats"],
    queryFn: async () => {
      const [total, active, ticketClaims, registrations] = await Promise.all([
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("ticket_claims").select("id", { count: "exact", head: true }),
        supabase.from("symposium_registrations").select("id", { count: "exact", head: true }),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        ticketClaims: ticketClaims.count || 0,
        registrations: registrations.count || 0,
      };
    },
  });

  // Fetch events with counts
  const { data: eventsData, isLoading } = useQuery({
    queryKey: ["admin-events", filter, page],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*", { count: "exact" })
        .order("start_date", { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      const now = new Date().toISOString().split("T")[0];

      if (filter === "active") {
        query = query.eq("is_active", true);
      } else if (filter === "upcoming") {
        query = query.gte("start_date", now);
      } else if (filter === "past") {
        query = query.lt("end_date", now);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      // Fetch counts for each event
      const eventIds = data.map((e) => e.id);
      const [ticketCounts, symposiumCounts, speakerCounts] = await Promise.all([
        supabase.from("ticket_claims").select("event_id").in("event_id", eventIds),
        supabase.from("symposium_registrations").select("event_id").in("event_id", eventIds),
        supabase.from("speaker_applications").select("event_id").in("event_id", eventIds),
      ]);

      const countMap = {
        tickets: {} as Record<string, number>,
        symposium: {} as Record<string, number>,
        speakers: {} as Record<string, number>,
      };

      ticketCounts.data?.forEach((t) => {
        countMap.tickets[t.event_id] = (countMap.tickets[t.event_id] || 0) + 1;
      });
      symposiumCounts.data?.forEach((s) => {
        countMap.symposium[s.event_id] = (countMap.symposium[s.event_id] || 0) + 1;
      });
      speakerCounts.data?.forEach((s) => {
        countMap.speakers[s.event_id] = (countMap.speakers[s.event_id] || 0) + 1;
      });

      return {
        events: data.map((e) => ({
          ...e,
          ticketCount: countMap.tickets[e.id] || 0,
          symposiumCount: countMap.symposium[e.id] || 0,
          speakerCount: countMap.speakers[e.id] || 0,
        })),
        count: count || 0,
      };
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ eventId, isActive }: { eventId: string; isActive: boolean }) => {
      const { error } = await supabase.from("events").update({ is_active: isActive }).eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["admin-events-stats"] });
      toast.success("Event status updated");
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });

  const totalPages = Math.ceil((eventsData?.count || 0) / pageSize);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "flagship":
        return <Badge className="bg-orange-500 hover:bg-orange-600">Flagship</Badge>;
      case "regional":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Regional</Badge>;
      case "partner":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Partner</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start) return "TBD";
    const startDate = format(parseISO(start), "MMM d");
    if (!end || start === end) return startDate + ", " + format(parseISO(start), "yyyy");
    const endDate = format(parseISO(end), "d, yyyy");
    return `${startDate}-${endDate}`;
  };

  return (
    <AdminLayout breadcrumbs={[{ label: "Events" }]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Events
          </h1>
          <p className="text-muted-foreground">Manage events, allocations, and registrations</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Events</CardTitle>
              <Power className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.active || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Claims</CardTitle>
              <Ticket className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.ticketClaims || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.registrations || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <Tabs value={filter} onValueChange={(v) => { setFilter(v); setPage(0); }}>
              <TabsList>
                <TabsTrigger value="all">All Events</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stats</TableHead>
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
                ) : eventsData?.events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  eventsData?.events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <Link to={`/admin/events/${event.id}`} className="font-medium hover:text-primary">
                            {event.name}
                          </Link>
                          {event.subtitle && <p className="text-sm text-muted-foreground">{event.subtitle}</p>}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(event.event_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDateRange(event.start_date, event.end_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {event.location_city && (
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {event.location_city}
                            {event.location_country && `, ${event.location_country}`}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {event.is_active ? (
                          <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Ticket className="h-3 w-3" />
                            {event.ticketCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.symposiumCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mic className="h-3 w-3" />
                            {event.speakerCount}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/events/${event.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedEvent(event); setEditOpen(true); }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setSelectedEvent(event); setAllocationsOpen(true); }}>
                              <Settings className="h-4 w-4 mr-2" />
                              Manage Allocations
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => toggleActiveMutation.mutate({ eventId: event.id, isActive: !event.is_active })}>
                              <Power className="h-4 w-4 mr-2" />
                              {event.is_active ? "Deactivate" : "Activate"}
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
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, eventsData?.count || 0)} of {eventsData?.count || 0}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <EditEventDialog event={selectedEvent} open={editOpen} onOpenChange={setEditOpen} />
      <AllocationsDialog eventId={selectedEvent?.id || null} eventName={selectedEvent?.name || ""} open={allocationsOpen} onOpenChange={setAllocationsOpen} />
    </AdminLayout>
  );
}
