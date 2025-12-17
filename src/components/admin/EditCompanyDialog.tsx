import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/company-profile/ImageUploader";
import { Loader2 } from "lucide-react";

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: any;
  onSave: (data: any) => void;
  isPending: boolean;
}

export function EditCompanyDialog({
  open,
  onOpenChange,
  company,
  onSave,
  isPending,
}: EditCompanyDialogProps) {
  const [formData, setFormData] = useState({
    // Core Info
    name: "",
    description: "",
    long_description: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    founded: "",
    employees: "",
    markets: "",
    company_type: "private" as "public" | "private" | "subsidiary",
    category_id: "",
    logo_url: "",
    // Leadership
    ceo_name: "",
    ceo_title: "",
    ceo_headshot_url: "",
    // Attributes
    is_active: true,
    featured: false,
    is_verified: false,
    is_bitcoin_only: false,
    accepts_crypto: false,
    is_bfc_member: false,
    is_conference_sponsor: false,
    // Additional
    btc_holdings_source: "",
    referral_url: "",
    status: "approved" as "pending" | "approved" | "rejected",
  });

  // Reset form when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || "",
        description: company.description || "",
        long_description: company.long_description || "",
        website: company.website || "",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        country: company.country || "",
        founded: company.founded || "",
        employees: company.employees || "",
        markets: company.markets || "",
        company_type: company.company_type || "private",
        category_id: company.category_id || "",
        logo_url: company.logo_url || "",
        ceo_name: company.ceo_name || "",
        ceo_title: company.ceo_title || "",
        ceo_headshot_url: company.ceo_headshot_url || "",
        is_active: company.is_active ?? true,
        featured: company.featured ?? false,
        is_verified: company.is_verified ?? false,
        is_bitcoin_only: company.is_bitcoin_only ?? false,
        accepts_crypto: company.accepts_crypto ?? false,
        is_bfc_member: company.is_bfc_member ?? false,
        is_conference_sponsor: company.is_conference_sponsor ?? false,
        btc_holdings_source: company.btc_holdings_source || "",
        referral_url: company.referral_url || "",
        status: company.status || "approved",
      });
    }
  }, [company]);

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

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Clean up empty strings to nulls for optional fields
    const cleanedData = {
      ...formData,
      category_id: formData.category_id || null,
      logo_url: formData.logo_url || null,
      ceo_headshot_url: formData.ceo_headshot_url || null,
      long_description: formData.long_description || null,
      website: formData.website || null,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country || null,
      founded: formData.founded || null,
      employees: formData.employees || null,
      markets: formData.markets || null,
      ceo_name: formData.ceo_name || null,
      ceo_title: formData.ceo_title || null,
      btc_holdings_source: formData.btc_holdings_source || null,
      referral_url: formData.referral_url || null,
    };
    onSave(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
          <DialogDescription>
            Update all company information, profile, and attributes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="core" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="core">Core Info</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="attributes">Attributes</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto pr-2 mt-4">
            <TabsContent value="core" className="space-y-4 mt-0">
              {/* Logo Upload */}
              <ImageUploader
                currentUrl={formData.logo_url}
                onUpload={(url) => handleChange("logo_url", url)}
                onRemove={() => handleChange("logo_url", "")}
                folder="logos"
                label="Company Logo"
              />

              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Short Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={2}
                  placeholder="Brief company description"
                />
              </div>

              <div className="space-y-2">
                <Label>Long Description</Label>
                <Textarea
                  value={formData.long_description}
                  onChange={(e) => handleChange("long_description", e.target.value)}
                  rows={4}
                  placeholder="Detailed company information"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(v) => handleChange("category_id", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
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
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={formData.country}
                    onChange={(e) => handleChange("country", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Founded</Label>
                  <Input
                    value={formData.founded}
                    onChange={(e) => handleChange("founded", e.target.value)}
                    placeholder="e.g. 2015"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Employees</Label>
                  <Input
                    value={formData.employees}
                    onChange={(e) => handleChange("employees", e.target.value)}
                    placeholder="e.g. 50-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Type</Label>
                  <Select
                    value={formData.company_type}
                    onValueChange={(v) => handleChange("company_type", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="subsidiary">Subsidiary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Markets</Label>
                <Input
                  value={formData.markets}
                  onChange={(e) => handleChange("markets", e.target.value)}
                  placeholder="e.g. North America, Europe"
                />
              </div>
            </TabsContent>

            <TabsContent value="leadership" className="space-y-4 mt-0">
              <ImageUploader
                currentUrl={formData.ceo_headshot_url}
                onUpload={(url) => handleChange("ceo_headshot_url", url)}
                onRemove={() => handleChange("ceo_headshot_url", "")}
                folder="headshots"
                label="CEO Headshot"
              />

              <div className="space-y-2">
                <Label>CEO / Leader Name</Label>
                <Input
                  value={formData.ceo_name}
                  onChange={(e) => handleChange("ceo_name", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>CEO / Leader Title</Label>
                <Input
                  value={formData.ceo_title}
                  onChange={(e) => handleChange("ceo_title", e.target.value)}
                  placeholder="e.g. Chief Executive Officer"
                />
              </div>
            </TabsContent>

            <TabsContent value="attributes" className="space-y-4 mt-0">
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground">Listing Status</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Active Listing</Label>
                    <p className="text-xs text-muted-foreground">Company appears in directory</p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => handleChange("is_active", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Featured</Label>
                    <p className="text-xs text-muted-foreground">Show on homepage</p>
                  </div>
                  <Switch
                    checked={formData.featured}
                    onCheckedChange={(v) => handleChange("featured", v)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Approval Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => handleChange("status", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground">Verification Badges</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Verified Company</Label>
                    <p className="text-xs text-muted-foreground">Identity has been verified</p>
                  </div>
                  <Switch
                    checked={formData.is_verified}
                    onCheckedChange={(v) => handleChange("is_verified", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">BFC Member</Label>
                    <p className="text-xs text-muted-foreground">Bitcoin for Corporations member</p>
                  </div>
                  <Switch
                    checked={formData.is_bfc_member}
                    onCheckedChange={(v) => handleChange("is_bfc_member", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Conference Sponsor</Label>
                    <p className="text-xs text-muted-foreground">Sponsored Bitcoin Conference</p>
                  </div>
                  <Switch
                    checked={formData.is_conference_sponsor}
                    onCheckedChange={(v) => handleChange("is_conference_sponsor", v)}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground">Bitcoin Attributes</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Bitcoin Only</Label>
                    <p className="text-xs text-muted-foreground">Focused exclusively on Bitcoin</p>
                  </div>
                  <Switch
                    checked={formData.is_bitcoin_only}
                    onCheckedChange={(v) => handleChange("is_bitcoin_only", v)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-normal">Accepts Crypto Payments</Label>
                    <p className="text-xs text-muted-foreground">Takes Bitcoin or crypto for payment</p>
                  </div>
                  <Switch
                    checked={formData.accepts_crypto}
                    onCheckedChange={(v) => handleChange("accepts_crypto", v)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label>BTC Holdings Source</Label>
                <Input
                  value={formData.btc_holdings_source}
                  onChange={(e) => handleChange("btc_holdings_source", e.target.value)}
                  placeholder="URL or source of BTC holdings verification"
                />
              </div>

              <div className="space-y-2">
                <Label>Referral URL</Label>
                <Input
                  value={formData.referral_url}
                  onChange={(e) => handleChange("referral_url", e.target.value)}
                  placeholder="Affiliate or referral link"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="mt-4 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !formData.name || !formData.description}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}