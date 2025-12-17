import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "./ImageUploader";
import { ToggleCard } from "./ToggleCard";
import { Building2, Eye } from "lucide-react";

interface CoreInfoTabProps {
  formData: {
    name: string;
    description: string;
    long_description: string;
    website: string;
    city: string;
    state: string;
    country: string;
    markets: string;
    founded: string;
    employees: string;
    company_type: string;
    is_active: boolean;
    logo_url: string;
    category_id: string;
  };
  categories: Array<{ id: string; name: string }>;
  onChange: (field: string, value: string | boolean) => void;
}

export function CoreInfoTab({ formData, categories, onChange }: CoreInfoTabProps) {
  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <ImageUploader
        currentUrl={formData.logo_url}
        onUpload={(url) => onChange("logo_url", url)}
        onRemove={() => onChange("logo_url", "")}
        folder="logos"
        label="Company Logo"
        aspectRatio="square"
      />

      {/* Status Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ToggleCard
          label="Active Listing"
          description="Show this company in the directory"
          checked={formData.is_active}
          onCheckedChange={(checked) => onChange("is_active", checked)}
          icon={<Building2 className="h-4 w-4" />}
        />
        <Select
          value={formData.company_type}
          onValueChange={(value) => onChange("company_type", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Company Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="subsidiary">Subsidiary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter company name"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Industry / Category</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => onChange("category_id", value)}
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
        <Label htmlFor="description">Short Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Brief description (1-2 sentences)"
          rows={2}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="long_description">Full Description</Label>
        <Textarea
          id="long_description"
          value={formData.long_description}
          onChange={(e) => onChange("long_description", e.target.value)}
          placeholder="Detailed company description"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => onChange("website", e.target.value)}
          placeholder="https://company.com"
        />
      </div>

      {/* Location */}
      <div>
        <Label className="mb-2 block">Location</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            value={formData.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="City"
          />
          <Input
            value={formData.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="State/Region"
          />
          <Input
            value={formData.country}
            onChange={(e) => onChange("country", e.target.value)}
            placeholder="Country"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="markets">Markets / Regions Served</Label>
        <Input
          id="markets"
          value={formData.markets}
          onChange={(e) => onChange("markets", e.target.value)}
          placeholder="e.g., North America, Europe, Global"
        />
      </div>

      {/* Company Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="founded">Founded Year</Label>
          <Input
            id="founded"
            value={formData.founded}
            onChange={(e) => onChange("founded", e.target.value)}
            placeholder="e.g., 2015"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="employees">Employee Count</Label>
          <Input
            id="employees"
            value={formData.employees}
            onChange={(e) => onChange("employees", e.target.value)}
            placeholder="e.g., 50-100"
          />
        </div>
      </div>
    </div>
  );
}
