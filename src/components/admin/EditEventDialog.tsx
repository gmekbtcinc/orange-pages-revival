import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageUploader } from "@/components/company-profile/ImageUploader";
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];

interface EditEventDialogProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditEventDialog({ event, open, onOpenChange }: EditEventDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    logo_url: "" as string | null,
    event_type: "regional" as "flagship" | "regional" | "partner",
    start_date: null as Date | null,
    end_date: null as Date | null,
    location_city: "",
    location_country: "",
    location_name: "",
    description: "",
    external_url: "",
    is_active: true,
    has_symposium: false,
    symposium_date: null as Date | null,
    symposium_venue: "",
    has_vip_dinner: false,
    vip_dinner_date: null as Date | null,
    vip_dinner_venue: "",
    vip_dinner_time: "",
    speaking_applications_open: false,
    speaking_deadline: null as Date | null,
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || "",
        slug: event.slug || "",
        logo_url: event.logo_url || null,
        event_type: event.event_type || "regional",
        start_date: event.start_date ? new Date(event.start_date) : null,
        end_date: event.end_date ? new Date(event.end_date) : null,
        location_city: event.location_city || "",
        location_country: event.location_country || "",
        location_name: event.location_name || "",
        description: event.description || "",
        external_url: event.external_url || "",
        is_active: event.is_active ?? true,
        has_symposium: event.has_symposium ?? false,
        symposium_date: event.symposium_date ? new Date(event.symposium_date) : null,
        symposium_venue: event.symposium_venue || "",
        has_vip_dinner: event.has_vip_dinner ?? false,
        vip_dinner_date: event.vip_dinner_date ? new Date(event.vip_dinner_date) : null,
        vip_dinner_venue: event.vip_dinner_venue || "",
        vip_dinner_time: event.vip_dinner_time || "",
        speaking_applications_open: event.speaking_applications_open ?? false,
        speaking_deadline: event.speaking_deadline ? new Date(event.speaking_deadline) : null,
      });
    }
  }, [event]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("No event selected");

      const { error } = await supabase
        .from("events")
        .update({
          name: formData.name,
          slug: formData.slug,
          logo_url: formData.logo_url || null,
          event_type: formData.event_type,
          start_date: formData.start_date?.toISOString().split("T")[0] || null,
          end_date: formData.end_date?.toISOString().split("T")[0] || null,
          location_city: formData.location_city || null,
          location_country: formData.location_country || null,
          location_name: formData.location_name || null,
          description: formData.description || null,
          external_url: formData.external_url || null,
          is_active: formData.is_active,
          has_symposium: formData.has_symposium,
          symposium_date: formData.symposium_date?.toISOString().split("T")[0] || null,
          symposium_venue: formData.symposium_venue || null,
          has_vip_dinner: formData.has_vip_dinner,
          vip_dinner_date: formData.vip_dinner_date?.toISOString().split("T")[0] || null,
          vip_dinner_venue: formData.vip_dinner_venue || null,
          vip_dinner_time: formData.vip_dinner_time || null,
          speaking_applications_open: formData.speaking_applications_open,
          speaking_deadline: formData.speaking_deadline?.toISOString().split("T")[0] || null,
        })
        .eq("id", event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-detail"] });
      toast.success("Event updated successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to update event: " + error.message);
    },
  });

  const DatePickerField = ({ label, value, onChange }: { label: string; value: Date | null; onChange: (date: Date | undefined) => void }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value || undefined} onSelect={onChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>
    </div>
  );

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Logo */}
          <ImageUploader
            currentUrl={formData.logo_url}
            onUpload={(url) => setFormData((f) => ({ ...f, logo_url: url }))}
            onRemove={() => setFormData((f) => ({ ...f, logo_url: null }))}
            folder="event-logos"
            label="Event Logo"
            aspectRatio="square"
          />

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={formData.slug} onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Event Type</Label>
              <Select value={formData.event_type} onValueChange={(v) => setFormData((f) => ({ ...f, event_type: v as "flagship" | "regional" | "partner" }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flagship">Flagship</SelectItem>
                  <SelectItem value="regional">Regional</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Active</Label>
              <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData((f) => ({ ...f, is_active: c }))} />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <DatePickerField label="Start Date" value={formData.start_date} onChange={(d) => setFormData((f) => ({ ...f, start_date: d || null }))} />
            <DatePickerField label="End Date" value={formData.end_date} onChange={(d) => setFormData((f) => ({ ...f, end_date: d || null }))} />
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Venue Name</Label>
              <Input value={formData.location_name} onChange={(e) => setFormData((f) => ({ ...f, location_name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={formData.location_city} onChange={(e) => setFormData((f) => ({ ...f, location_city: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={formData.location_country} onChange={(e) => setFormData((f) => ({ ...f, location_country: e.target.value }))} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label>External URL</Label>
            <Input value={formData.external_url} onChange={(e) => setFormData((f) => ({ ...f, external_url: e.target.value }))} placeholder="https://..." />
          </div>

          {/* Symposium */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Has Symposium</Label>
              <Switch checked={formData.has_symposium} onCheckedChange={(c) => setFormData((f) => ({ ...f, has_symposium: c }))} />
            </div>
            {formData.has_symposium && (
              <div className="grid grid-cols-2 gap-4">
                <DatePickerField label="Symposium Date" value={formData.symposium_date} onChange={(d) => setFormData((f) => ({ ...f, symposium_date: d || null }))} />
                <div className="space-y-2">
                  <Label>Symposium Venue</Label>
                  <Input value={formData.symposium_venue} onChange={(e) => setFormData((f) => ({ ...f, symposium_venue: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          {/* VIP Dinner */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Has VIP Dinner</Label>
              <Switch checked={formData.has_vip_dinner} onCheckedChange={(c) => setFormData((f) => ({ ...f, has_vip_dinner: c }))} />
            </div>
            {formData.has_vip_dinner && (
              <div className="grid grid-cols-3 gap-4">
                <DatePickerField label="Dinner Date" value={formData.vip_dinner_date} onChange={(d) => setFormData((f) => ({ ...f, vip_dinner_date: d || null }))} />
                <div className="space-y-2">
                  <Label>Dinner Venue</Label>
                  <Input value={formData.vip_dinner_venue} onChange={(e) => setFormData((f) => ({ ...f, vip_dinner_venue: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Dinner Time</Label>
                  <Input value={formData.vip_dinner_time} onChange={(e) => setFormData((f) => ({ ...f, vip_dinner_time: e.target.value }))} placeholder="7:00 PM" />
                </div>
              </div>
            )}
          </div>

          {/* Speaking Applications */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Speaking Applications Open</Label>
              <Switch checked={formData.speaking_applications_open} onCheckedChange={(c) => setFormData((f) => ({ ...f, speaking_applications_open: c }))} />
            </div>
            {formData.speaking_applications_open && (
              <DatePickerField label="Speaking Deadline" value={formData.speaking_deadline} onChange={(d) => setFormData((f) => ({ ...f, speaking_deadline: d || null }))} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
