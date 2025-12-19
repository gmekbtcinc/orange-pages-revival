import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/contexts/member/MemberContext";
import { useUser } from "@/contexts/UserContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Mic, BookOpen, Radio, MessageSquare, ExternalLink } from "lucide-react";

const resources = [
  {
    id: "podcast",
    title: "BFC Podcast",
    description: "Book a guest appearance on the Bitcoin for Corporations podcast",
    icon: Mic,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    actionLabel: "Request Booking",
  },
  {
    id: "magazine",
    title: "Bitcoin Magazine",
    description: "Order copies of Bitcoin Magazine for your team",
    icon: BookOpen,
    color: "text-bitcoin-orange",
    bgColor: "bg-bitcoin-orange/10",
    actionLabel: "Order Copies",
  },
  {
    id: "twitter_spaces",
    title: "Twitter Spaces",
    description: "Join exclusive member Twitter Spaces discussions",
    icon: Radio,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    actionLabel: "View Schedule",
  },
  {
    id: "forum",
    title: "Member Forum",
    description: "Connect with other BFC members in the private forum",
    icon: MessageSquare,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    actionLabel: "Open Forum",
    isExternal: true,
  },
];

export function MemberResources() {
  const { activeCompanyId } = useMember();
  const { profile } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loadingResource, setLoadingResource] = useState<string | null>(null);

  const requestMutation = useMutation({
    mutationFn: async (resourceType: string) => {
      if (!profile?.id || !activeCompanyId) {
        throw new Error("Missing profile or company");
      }
      
      const { error } = await supabase.from("member_resource_requests").insert({
        profile_id: profile.id,
        business_id: activeCompanyId,
        resource_type: resourceType,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resource_requests"] });
      toast({
        title: "Request submitted!",
        description: "We'll be in touch shortly about your request.",
      });
      setLoadingResource(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
      setLoadingResource(null);
    },
  });

  const handleResourceAction = (resourceId: string, isExternal?: boolean) => {
    if (isExternal) {
      // Open external link (forum)
      window.open("https://forum.bfc.co", "_blank");
      return;
    }

    setLoadingResource(resourceId);
    requestMutation.mutate(resourceId);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-foreground mb-4">
        Member Resources
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resources.map((resource) => (
          <Card key={resource.id} className="bg-card border-border">
            <CardHeader className="pb-2">
              <div className={`p-2 rounded-lg ${resource.bgColor} w-fit`}>
                <resource.icon className={`h-5 w-5 ${resource.color}`} />
              </div>
              <CardTitle className="text-base text-foreground">
                {resource.title}
              </CardTitle>
              <CardDescription className="text-sm">
                {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleResourceAction(resource.id, resource.isExternal)}
                disabled={loadingResource === resource.id}
              >
                {loadingResource === resource.id ? (
                  "Submitting..."
                ) : (
                  <>
                    {resource.actionLabel}
                    {resource.isExternal && (
                      <ExternalLink className="h-3 w-3 ml-2" />
                    )}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
