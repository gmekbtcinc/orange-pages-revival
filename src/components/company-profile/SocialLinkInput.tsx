import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinkInputProps {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}

const PLATFORMS = [
  { id: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/..." },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
  { id: "github", label: "GitHub", placeholder: "https://github.com/..." },
  { id: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
];

export function SocialLinkInput({ links, onChange }: SocialLinkInputProps) {
  const updateLink = (platform: string, url: string) => {
    const existing = links.find((l) => l.platform === platform);
    if (existing) {
      if (url) {
        onChange(links.map((l) => (l.platform === platform ? { ...l, url } : l)));
      } else {
        onChange(links.filter((l) => l.platform !== platform));
      }
    } else if (url) {
      onChange([...links, { platform, url }]);
    }
  };

  const removeLink = (platform: string) => {
    onChange(links.filter((l) => l.platform !== platform));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Social Media Links</label>
      <div className="space-y-2">
        {PLATFORMS.map((platform) => {
          const link = links.find((l) => l.platform === platform.id);
          return (
            <div key={platform.id} className="flex items-center gap-2">
              <div className="w-24 text-sm text-muted-foreground">{platform.label}</div>
              <div className="flex-1 flex items-center gap-2">
                <Input
                  placeholder={platform.placeholder}
                  value={link?.url || ""}
                  onChange={(e) => updateLink(platform.id, e.target.value)}
                  className="flex-1"
                />
                {link?.url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeLink(platform.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
