import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type SpeakerApplication = Tables<"speaker_applications">;

interface SpeakerApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  profileId: string;
  existingApplication?: SpeakerApplication;
}

const formatOptions = [
  { value: "keynote", label: "Keynote (30-45 min)" },
  { value: "panel", label: "Panel Discussion" },
  { value: "fireside", label: "Fireside Chat" },
  { value: "workshop", label: "Workshop (60-90 min)" },
  { value: "presentation", label: "Presentation (20-30 min)" },
];

export function SpeakerApplicationModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  profileId,
  existingApplication,
}: SpeakerApplicationModalProps) {
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [speakerName, setSpeakerName] = useState("");
  const [speakerEmail, setSpeakerEmail] = useState("");
  const [speakerTitle, setSpeakerTitle] = useState("");
  const [speakerCompany, setSpeakerCompany] = useState("");
  const [speakerBio, setSpeakerBio] = useState("");
  const [format, setFormat] = useState("");
  const [proposedTopic, setProposedTopic] = useState("");
  const [sessionDescription, setSessionDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [previousSpeaking, setPreviousSpeaking] = useState("");

  useEffect(() => {
    if (existingApplication) {
      setSpeakerName(existingApplication.speaker_name);
      setSpeakerEmail(existingApplication.speaker_email);
      setSpeakerTitle(existingApplication.speaker_title || "");
      setSpeakerCompany(existingApplication.speaker_company || "");
      setSpeakerBio(existingApplication.speaker_bio || "");
      setFormat(existingApplication.format);
      setProposedTopic(existingApplication.proposed_topic);
      setSessionDescription(existingApplication.session_description || "");
      setTargetAudience(existingApplication.target_audience || "");
      setPreviousSpeaking(existingApplication.previous_speaking || "");
    } else {
      // Pre-fill from profile data
      setSpeakerName(profile?.display_name || "");
      setSpeakerEmail(profile?.email || "");
      setSpeakerTitle(profile?.title || "");
      setSpeakerCompany("");
    }
  }, [existingApplication, profile, isOpen]);

  const applicationMutation = useMutation({
    mutationFn: async () => {
      const data = {
        event_id: eventId,
        profile_id: profileId,
        speaker_name: speakerName,
        speaker_email: speakerEmail,
        speaker_title: speakerTitle || null,
        speaker_company: speakerCompany || null,
        speaker_bio: speakerBio || null,
        format,
        proposed_topic: proposedTopic,
        session_description: sessionDescription || null,
        target_audience: targetAudience || null,
        previous_speaking: previousSpeaking || null,
        status: "submitted" as const,
        submitted_at: new Date().toISOString(),
      };

      if (existingApplication) {
        const { error } = await supabase
          .from("speaker_applications")
          .update(data)
          .eq("id", existingApplication.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("speaker_applications").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["speaker_applications", profileId, eventId],
      });
      toast({
        title: existingApplication ? "Application updated!" : "Application submitted!",
        description: `Your speaking application for ${eventName} has been ${existingApplication ? "updated" : "submitted"}.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applicationMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingApplication ? "Edit Speaking Application" : "Apply to Speak"}
          </DialogTitle>
          <DialogDescription>
            Submit your speaking application for {eventName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Speaker Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Speaker Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="speakerName">Full Name *</Label>
                <Input
                  id="speakerName"
                  value={speakerName}
                  onChange={(e) => setSpeakerName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerEmail">Email *</Label>
                <Input
                  id="speakerEmail"
                  type="email"
                  value={speakerEmail}
                  onChange={(e) => setSpeakerEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerTitle">Job Title</Label>
                <Input
                  id="speakerTitle"
                  value={speakerTitle}
                  onChange={(e) => setSpeakerTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speakerCompany">Company</Label>
                <Input
                  id="speakerCompany"
                  value={speakerCompany}
                  onChange={(e) => setSpeakerCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="speakerBio">Speaker Bio</Label>
              <Textarea
                id="speakerBio"
                value={speakerBio}
                onChange={(e) => setSpeakerBio(e.target.value)}
                placeholder="Brief biography (2-3 sentences)"
                rows={3}
              />
            </div>
          </div>

          {/* Session Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Session Details</h3>
            <div className="space-y-2">
              <Label htmlFor="format">Session Format *</Label>
              <Select value={format} onValueChange={setFormat} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  {formatOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="topic">Proposed Topic *</Label>
              <Input
                id="topic"
                value={proposedTopic}
                onChange={(e) => setProposedTopic(e.target.value)}
                placeholder="Title of your presentation"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Session Description</Label>
              <Textarea
                id="description"
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="Describe what you'll cover and key takeaways"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="CFOs, Treasury Teams, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="previous">Previous Speaking Experience</Label>
              <Textarea
                id="previous"
                value={previousSpeaking}
                onChange={(e) => setPreviousSpeaking(e.target.value)}
                placeholder="List relevant speaking experience"
                rows={2}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={applicationMutation.isPending}
            >
              {applicationMutation.isPending
                ? "Submitting..."
                : existingApplication
                  ? "Update Application"
                  : "Submit Application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
