import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CreditCard, Clock, DollarSign, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function MemberFastFacts() {
  const { membership } = useUser();
  
  if (!membership) return null;
  const [showDetails, setShowDetails] = useState(false);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (cents: number | null) => {
    if (!cents) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(cents / 100);
  };

  const facts = [
    {
      label: "Member Since",
      value: formatDate(membership?.member_since || null),
      icon: Calendar,
      color: "bg-green-500/10 text-green-500",
    },
    {
      label: "Renewal Date",
      value: formatDate(membership?.renewal_date || null),
      icon: Clock,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      label: "Next Payment Due",
      value: formatDate(membership?.next_payment_due || null),
      icon: CreditCard,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      label: "Amount Due",
      value: formatCurrency(membership?.payment_amount_cents || null),
      icon: DollarSign,
      color: "bg-bitcoin-orange/10 text-bitcoin-orange",
    },
  ];

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5 text-bitcoin-orange" />
            Member Fast Facts
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "View Details"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {facts.map((fact) => (
            <div
              key={fact.label}
              className="p-4 rounded-lg bg-muted/50 border border-border/50"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${fact.color}`}>
                  <fact.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{fact.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {fact.value}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {showDetails && membership && (
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/50 space-y-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Membership Tier:</span>{" "}
              {membership.tier?.charAt(0).toUpperCase() + membership.tier?.slice(1)}
            </p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Status:</span>{" "}
              {membership.is_active ? "Active" : "Inactive"}
            </p>
            {membership.billing_email && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Billing Email:</span>{" "}
                {membership.billing_email}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
