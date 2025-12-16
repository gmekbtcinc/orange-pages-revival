import { useMember } from "@/contexts/member/MemberContext";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, CreditCard, Clock, DollarSign } from "lucide-react";

export function MemberFastFacts() {
  const { membership } = useMember();

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
    },
    {
      label: "Renewal Date",
      value: formatDate(membership?.renewal_date || null),
      icon: Clock,
    },
    {
      label: "Next Payment Due",
      value: formatDate(membership?.next_payment_due || null),
      icon: CreditCard,
    },
    {
      label: "Amount Due",
      value: formatCurrency(membership?.payment_amount_cents || null),
      icon: DollarSign,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Member Fast Facts
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {facts.map((fact) => (
          <Card key={fact.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-bitcoin-orange/10">
                  <fact.icon className="h-5 w-5 text-bitcoin-orange" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{fact.label}</p>
                  <p className="text-lg font-semibold text-foreground">
                    {fact.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
