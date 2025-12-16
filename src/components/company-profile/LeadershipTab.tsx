import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "./ImageUploader";

interface LeadershipTabProps {
  formData: {
    ceo_name: string;
    ceo_title: string;
    ceo_headshot_url: string;
  };
  onChange: (field: string, value: any) => void;
}

export function LeadershipTab({ formData, onChange }: LeadershipTabProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">CEO / Leadership</h3>
        <p className="text-sm text-muted-foreground">
          Add information about your company's leadership
        </p>
      </div>

      <ImageUploader
        currentUrl={formData.ceo_headshot_url}
        onUpload={(url) => onChange("ceo_headshot_url", url)}
        onRemove={() => onChange("ceo_headshot_url", "")}
        folder="headshots"
        label="CEO Headshot"
        aspectRatio="square"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ceo_name">CEO Name</Label>
          <Input
            id="ceo_name"
            value={formData.ceo_name}
            onChange={(e) => onChange("ceo_name", e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ceo_title">Title</Label>
          <Input
            id="ceo_title"
            value={formData.ceo_title}
            onChange={(e) => onChange("ceo_title", e.target.value)}
            placeholder="e.g., CEO & Founder"
          />
        </div>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Coming soon:</strong> Add additional team members and their profiles.
        </p>
      </div>
    </div>
  );
}
