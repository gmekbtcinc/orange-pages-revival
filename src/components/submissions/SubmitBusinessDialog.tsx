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
}

const relationshipOptions = [
  { value: "owner", label: "Owner / Founder" },
  { value: "executive", label: "Executive / C-Suite" },
  { value: "employee", label: "Employee" },
  { value: "authorized_representative", label: "Authorized Representative" },
];

export function SubmitBusinessDialog({ isOpen, onClose }: SubmitBusinessDialogProps) {
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
      setUserId(user?.id || null);
      setUserEmail(user?.email || "");
    });
  }, [isOpen]);

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

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("You must be logged in to submit a business");

      const { error } = await supabase.from("business_submissions").insert({
        submitter_user_id: userId,
        submitter_email: userEmail,
        submitter_name: submitterName,
        name,
        description,
        website: website || null,
        city: city || null,
        state: state || null,
        country: country || null,
        category_id: categoryId || null,
        wants_to_claim: wantsToClaim,
        claim_title: wantsToClaim ? claimTitle : null,
        claim_relationship: wantsToClaim ? claimRelationship : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-submissions"] });
      toast({
        title: "Submission received!",
        description: wantsToClaim 
          ? "We'll review your business and claim request shortly."
          : "We'll review your business submission shortly.",
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
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
    
    if (!userId) {
      // Store form data and redirect to login
      sessionStorage.setItem("pendingBusinessSubmission", JSON.stringify({
        name, description, website, city, state, country, categoryId,
        wantsToClaim, claimTitle, claimRelationship, submitterName,
      }));
      onClose();
      navigate("/login?returnTo=/");
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
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
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
