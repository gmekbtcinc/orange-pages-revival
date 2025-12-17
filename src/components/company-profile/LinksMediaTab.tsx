import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLinkInput } from "./SocialLinkInput";
import { ArticleManager } from "./ArticleManager";

interface SocialLink {
  platform: string;
  url: string;
}

interface Article {
  id?: string;
  title: string;
  url: string;
  published_date?: string;
  source?: string;
}

interface LinksMediaTabProps {
  formData: {
    email: string;
    phone: string;
    address: string;
    referral_url: string;
  };
  socialLinks: SocialLink[];
  articles: Article[];
  onFieldChange: (field: string, value: string) => void;
  onSocialLinksChange: (links: SocialLink[]) => void;
  onArticlesChange: (articles: Article[]) => void;
}

export function LinksMediaTab({
  formData,
  socialLinks,
  articles,
  onFieldChange,
  onSocialLinksChange,
  onArticlesChange,
}: LinksMediaTabProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">Contact & Links</h3>
        <p className="text-sm text-muted-foreground">
          Add contact information and social media links
        </p>
      </div>

      {/* Contact Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Contact Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="contact@company.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => onFieldChange("address", e.target.value)}
          placeholder="Full mailing address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="referral_url">Referral URL</Label>
        <Input
          id="referral_url"
          value={formData.referral_url}
          onChange={(e) => onFieldChange("referral_url", e.target.value)}
          placeholder="https://company.com/?ref=bfc"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Custom referral link for tracking
        </p>
      </div>

      {/* Social Links */}
      <div className="pt-4">
        <SocialLinkInput links={socialLinks} onChange={onSocialLinksChange} />
      </div>

      {/* Articles */}
      <div className="pt-4">
        <ArticleManager articles={articles} onChange={onArticlesChange} />
      </div>
    </div>
  );
}
