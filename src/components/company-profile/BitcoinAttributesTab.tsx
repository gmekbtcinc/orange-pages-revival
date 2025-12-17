import { ToggleCard } from "./ToggleCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bitcoin, BadgeCheck, Award, Coins } from "lucide-react";

interface BitcoinAttributesTabProps {
  formData: {
    is_bitcoin_only: boolean;
    accepts_crypto: boolean;
    is_bfc_member: boolean;
    is_verified: boolean;
    is_conference_sponsor: boolean;
    btc_holdings_source: string;
  };
  onChange: (field: string, value: string | boolean) => void;
}

export function BitcoinAttributesTab({ formData, onChange }: BitcoinAttributesTabProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h3 className="text-lg font-semibold text-foreground">Bitcoin Attributes</h3>
        <p className="text-sm text-muted-foreground">
          Specify your company's relationship with Bitcoin
        </p>
      </div>

      <div className="space-y-4">
        <ToggleCard
          label="Bitcoin-Only"
          description="Company focuses exclusively on Bitcoin (no other cryptocurrencies)"
          checked={formData.is_bitcoin_only}
          onCheckedChange={(checked) => onChange("is_bitcoin_only", checked)}
          icon={<Bitcoin className="h-4 w-4" />}
        />

        <ToggleCard
          label="Accepts Crypto Payments"
          description="Company accepts Bitcoin or other cryptocurrency payments"
          checked={formData.accepts_crypto}
          onCheckedChange={(checked) => onChange("accepts_crypto", checked)}
          icon={<Coins className="h-4 w-4" />}
        />

        <ToggleCard
          label="BFC Member"
          description="Company is a Bitcoin for Corporations member"
          checked={formData.is_bfc_member}
          onCheckedChange={(checked) => onChange("is_bfc_member", checked)}
          icon={<Award className="h-4 w-4" />}
        />

        <ToggleCard
          label="Verified Listing"
          description="This listing has been verified by our team"
          checked={formData.is_verified}
          onCheckedChange={(checked) => onChange("is_verified", checked)}
          icon={<BadgeCheck className="h-4 w-4" />}
        />

        <ToggleCard
          label="Conference Sponsor"
          description="Company is a Bitcoin Conference sponsor"
          checked={formData.is_conference_sponsor}
          onCheckedChange={(checked) => onChange("is_conference_sponsor", checked)}
          icon={<Award className="h-4 w-4" />}
        />
      </div>

      <div className="space-y-2 pt-4">
        <Label htmlFor="btc_holdings">BTC Holdings Source</Label>
        <Input
          id="btc_holdings"
          value={formData.btc_holdings_source}
          onChange={(e) => onChange("btc_holdings_source", e.target.value)}
          placeholder="e.g., mNAV, StrategyTracker URL"
        />
        <p className="text-xs text-muted-foreground">
          Optional: Link to public BTC holdings data source
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Coming soon:</strong> Automatic BTC holdings sync from mNAV and StrategyTracker.
        </p>
      </div>
    </div>
  );
}
