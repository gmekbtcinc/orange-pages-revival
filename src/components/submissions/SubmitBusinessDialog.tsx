import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, User } from "lucide-react";

interface SubmitBusinessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Record<string, unknown> | null;
}

const relationshipOptions = [
  { value: "owner", label: "Owner / Founder" },
  { value: "executive", label: "Executive / C-Suite" },
  { value: "employee", label: "Employee" },
  { value: "authorized_representative", label: "Authorized Representative" },
];

export function SubmitBusinessDialog({ isOpen, onClose, initialData }: SubmitBusinessDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [wantsToClaim, setWantsToClaim] = useState(false);
  const [claimTitle, setClaimTitle] = useState("");
  const [claimRelationship, setClaimRelationship] = useState("");
  const [submitterName, setSubmitterName] = useState("");

  // Check auth status
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log("[SubmitBusinessDialog] Auth check - user:", user?.id, user?.email);
      setUserId(user?.id || null);
      setUserEmail(user?.email || "");
    });
  }, [isOpen]);

  // Populate form with initial data if provided
  useEffect(() => {
    if (initialData && isOpen) {
      console.log("[SubmitBusinessDialog] Populating form with initial data:", initialData);
      setName((initialData.name as string) || "");
      setDescription((initialData.description as string) || "");
      setWebsite((initialData.website as string) || "");
      setCity((initialData.city as string) || "");
      setState((initialData.state as string) || "");
      setCountry((initialData.country as string) || "");
      setCategoryId((initialData.categoryId as string) || "");
      setWantsToClaim((initialData.wantsToClaim as boolean) || false);
      setClaimTitle((initialData.claimTitle as string) || "");
      setClaimRelationship((initialData.claimRelationship as string) || "");
      setSubmitterName((initialData.submitterName as string) || "");
    }
  }, [initialData, isOpen]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Normalize website URL
  const normalizeWebsite = (url: string): string | null => {
    if (!url.trim()) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      console.log("[SubmitBusinessDialog] Starting submission...");
      console.log("[SubmitBusinessDialog] User ID:", userId);
      console.log("[SubmitBusinessDialog] User Email:", userEmail);
      
      if (!userId) {
        console.error("[SubmitBusinessDialog] No user ID found");
        throw new Error("You must be logged in to submit a business");
      }

      const payload = {
        submitter_user_id: userId,
        submitter_email: userEmail,
        submitter_name: submitterName,
        name,
        description,
        website: normalizeWebsite(website),
        city: city || null,
        state: state || null,
        country: country || null,
        category_id: categoryId || null,
        wants_to_claim: wantsToClaim,
        claim_title: wantsToClaim ? claimTitle : null,
        claim_relationship: wantsToClaim ? claimRelationship : null,
      };
      
      console.log("[SubmitBusinessDialog] Submitting payload:", payload);

      const { data, error } = await supabase.from("business_submissions").insert(payload).select();

      if (error) {
        console.error("[SubmitBusinessDialog] Supabase error:", error);
        throw error;
      }
      
      console.log("[SubmitBusinessDialog] Submission successful:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("[SubmitBusinessDialog] onSuccess - data:", data);
      queryClient.invalidateQueries({ queryKey: ["business-submissions"] });
      toast({
        title: "Submission received!",
        description: wantsToClaim 
          ? "We'll review your business and claim request shortly."
          : "We'll review your business submission shortly.",
      });
      // Clear pending submission from storage
      sessionStorage.removeItem("pendingBusinessSubmission");
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      console.error("[SubmitBusinessDialog] onError:", error);
      toast({
        variant: "destructive",
        title: "Error submitting business",
        description: error.message,
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setWebsite("");
    setCity("");
    setState("");
    setCountry("");
    setCategoryId("");
    setWantsToClaim(false);
    setClaimTitle("");
    setClaimRelationship("");
    setSubmitterName("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[SubmitBusinessDialog] handleSubmit called");
    console.log("[SubmitBusinessDialog] Current userId:", userId);
    
    if (!userId) {
      console.log("[SubmitBusinessDialog] User not logged in, storing data and redirecting");
      // Store form data and redirect to login
      const pendingData = {
        name, description, website, city, state, country, categoryId,
        wantsToClaim, claimTitle, claimRelationship, submitterName,
      };
      console.log("[SubmitBusinessDialog] Storing pending data:", pendingData);
      sessionStorage.setItem("pendingBusinessSubmission", JSON.stringify(pendingData));
      onClose();
      navigate("/login?returnTo=/dashboard&openSubmit=true");
      toast({
        title: "Sign in required",
        description: "Please sign in to submit a business.",
      });
      return;
    }

    submitMutation.mutate();
  };

  const isValid = name.trim() && description.trim() && submitterName.trim() &&
    (!wantsToClaim || (claimTitle.trim() && claimRelationship));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Submit a Business
          </DialogTitle>
          <DialogDescription>
            Add a Bitcoin business to the Orange Pages directory. All submissions are reviewed before publishing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Submitter Name */}
          <div className="space-y-2">
            <Label htmlFor="submitter_name">Your Name *</Label>
            <Input
              id="submitter_name"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          {/* Business Name */}
          <div className="space-y-2">
            <Label htmlFor="business_name">Business Name *</Label>
            <Input
              id="business_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Company name"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the business..."
              rows={3}
              required
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="example.com or https://example.com"
            />
            <p className="text-xs text-muted-foreground">Optional. We'll add https:// if needed.</p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="State"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Country"
              />
            </div>
          </div>

          {/* Claim Checkbox */}
          <div className="flex items-start space-x-3 pt-4 border-t border-border">
            <Checkbox
              id="wants_to_claim"
              checked={wantsToClaim}
              onCheckedChange={(checked) => setWantsToClaim(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="wants_to_claim" className="cursor-pointer font-medium">
                I want to claim this business
              </Label>
              <p className="text-sm text-muted-foreground">
                Request to manage this business listing and access the dashboard
              </p>
            </div>
          </div>

          {/* Claim Fields */}
          {wantsToClaim && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4 text-primary" />
                Claim Information
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="claim_title">Your Title at Company *</Label>
                <Input
                  id="claim_title"
                  value={claimTitle}
                  onChange={(e) => setClaimTitle(e.target.value)}
                  placeholder="e.g., CEO, Marketing Director"
                  required={wantsToClaim}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim_relationship">Relationship to Business *</Label>
                <Select value={claimRelationship} onValueChange={setClaimRelationship}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || submitMutation.isPending}>
              {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit for Review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
