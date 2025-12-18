import { Award, ArrowRight, Ticket, Users, Mic2, UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function MembershipCTA() {
  const benefits = [
    { icon: Ticket, text: "Complimentary conference tickets" },
    { icon: Users, text: "Exclusive BFC Symposium access" },
    { icon: Mic2, text: "Priority speaker consideration" },
    { icon: UtensilsCrossed, text: "VIP dinner invitations" },
  ];

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Become a BFC Member</h3>
            <p className="text-sm text-muted-foreground">
              Unlock exclusive benefits for your company
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <benefit.icon className="h-4 w-4 text-primary shrink-0" />
              <span className="text-muted-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        <Button className="w-full gap-2" asChild>
          <a href="https://bitcoinforcorporations.com/join/" target="_blank" rel="noopener noreferrer">
            Learn About Membership
            <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
