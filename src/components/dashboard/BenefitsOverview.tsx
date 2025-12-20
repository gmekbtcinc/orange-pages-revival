import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, CheckCircle, Clock, ExternalLink } from "lucide-react";
import {
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_COLORS,
  BENEFIT_SCOPE_LABELS,
  type Fulfillment,
  type FulfillmentStatus
} from "@/types/user";

export function BenefitsOverview() {
  const { activeCompanyId, membership } = useUser();
  const currentYear = new Date().getFullYear();

  // Fetch packages (tier_track_packages table)
  const { data: packages = [] } = useQuery({
    queryKey: ["tier-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_track_packages")
        .select("*, membership_tiers(name)");
      if (error) {
        console.error("[BenefitsOverview] packages query error:", error);
        throw error;
      }
      return data;
    },
  });

  // Fetch all benefits
  const { data: benefits = [] } = useQuery({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("benefits")
        .select("*, benefit_categories(name)");
      if (error) {
        console.error("[BenefitsOverview] benefits query error:", error);
        throw error;
      }
      return data;
    },
  });

  // Fetch package benefits
  const { data: packageBenefits = [] } = useQuery({
    queryKey: ["package-benefits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("package_benefits")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch company's fulfillments
  const { data: fulfillments = [] } = useQuery({
    queryKey: ["my-fulfillments", activeCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillments")
        .select("*")
        .eq("business_id", activeCompanyId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Fulfillment[];
    },
    enabled: !!activeCompanyId,
  });

  // Fetch company benefit overrides
  const { data: benefitOverrides = [] } = useQuery({
    queryKey: ["my-benefit-overrides", activeCompanyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_benefit_overrides")
        .select("*")
        .eq("business_id", activeCompanyId);
      if (error) throw error;
      return data;
    },
    enabled: !!activeCompanyId,
  });

  if (!membership) {
    return null;
  }

  // Find the package for this tier (case-insensitive matching)
  const memberTier = membership.tier?.toLowerCase();
  const tierPackage = packages.find((p: any) =>
    p.membership_tiers?.name?.toLowerCase() === memberTier
  );

  // Get benefits for this package
  const packageBenefitIds = tierPackage
    ? packageBenefits.filter((pb: any) => pb.package_id === tierPackage.id)
    : [];

  // Build benefits data - only admin-fulfilled benefits (not self-service like tickets)
  const memberBenefits: any[] = [];

  benefits.forEach((benefit: any) => {
    // Skip self-service benefits (tickets are handled by EventCards)
    if (benefit.fulfillment_mode === "self_service") return;

    const pb = packageBenefitIds.find((p: any) => p.benefit_id === benefit.id);
    const override = benefitOverrides.find((o: any) =>
      o.benefit_id === benefit.id &&
      (o.period_year === currentYear || o.period_year === null)
    );

    // Skip if not in package and no override
    if (!pb && !override) return;

    // Calculate entitled quantity
    let entitled = pb?.quantity || 0;
    if (override) {
      if (override.override_mode === "absolute") {
        entitled = override.quantity_override ?? entitled;
      } else {
        entitled = entitled + (override.quantity_override ?? 0);
      }
    }
    if (pb?.is_unlimited || override?.is_unlimited_override) {
      entitled = -1; // unlimited
    }

    // Count fulfillments
    const benefitFulfillments = fulfillments.filter((f: any) =>
      f.benefit_id === benefit.id &&
      (f.period_year === currentYear || benefit.scope === "one_time")
    );
    const fulfilled = benefitFulfillments.reduce((sum: number, f: any) =>
      f.status === "completed" ? sum + f.quantity : sum, 0
    );
    const scheduled = benefitFulfillments.filter((f: any) => f.status === "scheduled");

    memberBenefits.push({
      ...benefit,
      entitled,
      fulfilled,
      remaining: entitled === -1 ? -1 : Math.max(0, entitled - fulfilled),
      fulfillments: benefitFulfillments,
      scheduledCount: scheduled.length,
    });
  });

  // If no benefits to show, don't render anything
  if (memberBenefits.length === 0) {
    return null;
  }

  // Group by category
  const benefitsByCategory: Record<string, any[]> = {};
  memberBenefits.forEach((b) => {
    const category = b.benefit_categories?.name || "Other";
    if (!benefitsByCategory[category]) {
      benefitsByCategory[category] = [];
    }
    benefitsByCategory[category].push(b);
  });

  // Calculate overall progress
  const totalEntitled = memberBenefits.reduce((sum, b) => b.entitled === -1 ? sum : sum + b.entitled, 0);
  const totalFulfilled = memberBenefits.reduce((sum, b) => sum + b.fulfilled, 0);
  const overallProgress = totalEntitled > 0 ? (totalFulfilled / totalEntitled) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Your Benefits</h2>
        <Badge variant="outline" className="text-xs">
          {currentYear} Membership Year
        </Badge>
      </div>

      {/* Overall Progress Card */}
      <Card className="bg-gradient-to-r from-bitcoin-orange/10 to-transparent border-bitcoin-orange/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-bitcoin-orange" />
              <span className="font-medium">Overall Benefit Fulfillment</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {totalFulfilled} / {totalEntitled} delivered
            </span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Benefits by Category */}
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(benefitsByCategory).map(([category, categoryBenefits]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryBenefits.map((benefit) => {
                const progress = benefit.entitled === -1
                  ? 100
                  : benefit.entitled > 0
                    ? (benefit.fulfilled / benefit.entitled) * 100
                    : 0;

                return (
                  <div key={benefit.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{benefit.label}</span>
                          {benefit.fulfilled >= benefit.entitled && benefit.entitled > 0 && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        {benefit.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{benefit.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {benefit.entitled === -1 ? (
                            <span className="text-green-600">Unlimited</span>
                          ) : (
                            <>
                              <span className={benefit.fulfilled > 0 ? "text-green-600" : ""}>
                                {benefit.fulfilled}
                              </span>
                              <span className="text-muted-foreground">/{benefit.entitled}</span>
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    <Progress value={progress} className="h-1.5" />

                    {/* Recent fulfillments */}
                    {benefit.fulfillments.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {benefit.fulfillments.slice(0, 2).map((f: Fulfillment) => (
                          <div
                            key={f.id}
                            className="flex items-center gap-2 text-xs"
                          >
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0 ${
                                f.status === "completed"
                                  ? "border-green-500/50 text-green-600"
                                  : f.status === "scheduled"
                                    ? "border-blue-500/50 text-blue-600"
                                    : "border-yellow-500/50 text-yellow-600"
                              }`}
                            >
                              {f.status === "completed" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <Clock className="h-3 w-3 mr-1" />
                              )}
                              {FULFILLMENT_STATUS_LABELS[f.status as FulfillmentStatus]}
                            </Badge>
                            <span className="text-muted-foreground truncate">
                              {f.title || `${f.quantity}x delivered`}
                            </span>
                            {f.proof_url && (
                              <a
                                href={f.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-bitcoin-orange hover:underline flex items-center gap-0.5"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Scheduled indicator */}
                    {benefit.scheduledCount > 0 && (
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {benefit.scheduledCount} scheduled
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
