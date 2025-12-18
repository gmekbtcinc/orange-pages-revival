import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, ExternalLink, Mail, Phone, MapPin, Globe, Loader2,
  Bitcoin, BadgeCheck, Award, Users, Calendar, Building2, Flag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchBusinessById } from "@/lib/businessQueries";
import { supabase } from "@/integrations/supabase/client";
import { ClaimBusinessDialog } from "@/components/claims/ClaimBusinessDialog";

// Social icons mapping
const SocialIcon = ({ platform }: { platform: string }) => {
  const icons: Record<string, string> = {
    x: "𝕏",
    linkedin: "in",
    youtube: "▶",
    github: "⌨",
    facebook: "f",
  };
  return <span className="font-bold">{icons[platform] || "🔗"}</span>;
};

const BusinessDetail = () => {
  const { id } = useParams();
  const [userId, setUserId] = useState<string | null>(null);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: () => fetchBusinessById(id!),
    enabled: !!id,
  });

  // Check claim eligibility (BFC member, already has linked users, or user has existing claim)
  const { data: claimEligibility } = useQuery({
    queryKey: ["claim-eligibility", id, userId],
    queryFn: async () => {
      // Check 1: Is this a BFC member business?
      const { data: membership } = await supabase
        .from("memberships")
        .select("id")
        .eq("business_id", id!)
        .eq("is_active", true)
        .maybeSingle();
      
      if (membership) return { canClaim: false, reason: "bfc_member" as const };
      
      // Check 2: Does it already have linked users?
      const { data: businessData } = await supabase
        .from("businesses")
        .select("has_linked_users")
        .eq("id", id!)
        .single();
      
      if (businessData?.has_linked_users) return { canClaim: false, reason: "already_claimed" as const };
      
      // Check 3: Does user already have a pending/approved claim?
      if (userId) {
        const { data: existingClaim } = await supabase
          .from("business_claims")
          .select("id, status")
          .eq("business_id", id!)
          .eq("claimant_user_id", userId)
          .in("status", ["pending", "approved"])
          .maybeSingle();
        
        if (existingClaim) return { canClaim: false, reason: "existing_claim" as const };
      }
      
      return { canClaim: true, reason: null };
    },
    enabled: !!id,
  });

  const canClaim = userId && claimEligibility?.canClaim;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Business Not Found</h2>
            <p className="text-muted-foreground mb-6">The business you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
          {canClaim && (
            <Button onClick={() => setClaimDialogOpen(true)} variant="outline" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Claim this Business
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Business Header */}
          <div className="mb-8">
            <div className="flex items-start gap-6 mb-6">
              {/* Logo */}
              {business.logo_url && (
                <div className="shrink-0">
                  <img 
                    src={business.logo_url} 
                    alt={`${business.name} logo`}
                    className="w-24 h-24 rounded-lg object-cover border border-border"
                  />
                </div>
              )}
              <div className="flex-1">
                {business.category && (
                  <Link to={`/category/${business.category.slug}`}>
                    <Badge variant="outline" className="mb-2 hover:bg-accent cursor-pointer">
                      {business.category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="text-4xl font-bold text-foreground mb-2">{business.name}</h1>
                <p className="text-xl text-muted-foreground">{business.description}</p>
                
                {/* Attribute Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {business.featured && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Featured
                    </Badge>
                  )}
                  {business.is_verified && (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <BadgeCheck className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {business.is_bitcoin_only && (
                    <Badge className="bg-bitcoin-orange/10 text-bitcoin-orange border-bitcoin-orange/20">
                      <Bitcoin className="h-3 w-3 mr-1" />
                      Bitcoin Only
                    </Badge>
                  )}
                  {business.is_bfc_member && (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      <Award className="h-3 w-3 mr-1" />
                      BFC Member
                    </Badge>
                  )}
                  {business.is_conference_sponsor && (
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Conference Sponsor
                    </Badge>
                  )}
                  {business.company_type && (
                    <Badge variant="outline" className="capitalize">
                      {business.company_type}
                    </Badge>
                  )}
                  {claimEligibility?.reason === "already_claimed" && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Already Claimed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {business.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>
          </div>

          {/* Social Links */}
          {business.social_links.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {business.social_links.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-colors"
                  title={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          )}

          {/* CEO / Leadership Section */}
          {business.ceo_name && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                  <Users className="mr-2 h-4 w-4 text-primary" />
                  Leadership
                </h2>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    {business.ceo_headshot_url ? (
                      <AvatarImage src={business.ceo_headshot_url} alt={business.ceo_name} />
                    ) : null}
                    <AvatarFallback className="bg-muted text-lg">
                      {business.ceo_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{business.ceo_name}</h3>
                    {business.ceo_title && (
                      <p className="text-sm text-muted-foreground">{business.ceo_title}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {business.website && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Globe className="mr-2 h-4 w-4 text-primary" />
                    Website
                  </h3>
                  <a 
                    href={business.referral_url || business.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center"
                  >
                    {business.website}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            )}

            {business.email && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-primary" />
                    Email
                  </h3>
                  <a 
                    href={`mailto:${business.email}`}
                    className="text-primary hover:underline"
                  >
                    {business.email}
                  </a>
                </CardContent>
              </Card>
            )}

            {business.phone && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-primary" />
                    Phone
                  </h3>
                  <a 
                    href={`tel:${business.phone}`}
                    className="text-primary hover:underline"
                  >
                    {business.phone}
                  </a>
                </CardContent>
              </Card>
            )}

            {(business.address || business.city) && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    Location
                  </h3>
                  <p className="text-muted-foreground">
                    {business.address && `${business.address}, `}
                    {business.city}
                    {business.state && `, ${business.state}`}
                    {business.country && `, ${business.country}`}
                  </p>
                  {business.markets && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Markets: {business.markets}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* About Section */}
          {business.long_description && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">About</h2>
                <div className="prose prose-gray max-w-none">
                  {business.long_description.split('\n\n').map((paragraph, index) => (
                    <p key={index} className="text-muted-foreground mb-4 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Services Section */}
          {business.services.length > 0 && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">Services</h2>
                <ul className="grid md:grid-cols-2 gap-3">
                  {business.services.map((service) => (
                    <li key={service.id} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span className="text-muted-foreground">{service.service_name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Articles Section */}
          {business.articles.length > 0 && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h2 className="text-2xl font-bold mb-4">News & Announcements</h2>
                <div className="space-y-4">
                  {business.articles.map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
                    >
                      <h3 className="font-semibold text-foreground hover:text-primary flex items-center">
                        {article.title}
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {article.source && `${article.source}`}
                        {article.published_date && ` • ${article.published_date}`}
                      </p>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Company Information</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {business.category && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      Category
                    </h3>
                    <p className="text-muted-foreground">{business.category.name}</p>
                  </div>
                )}
                {business.founded && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      Founded
                    </h3>
                    <p className="text-muted-foreground">{business.founded}</p>
                  </div>
                )}
                {business.employees && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                      Employees
                    </h3>
                    <p className="text-muted-foreground">{business.employees}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Separator className="mb-8" />
            <h3 className="text-xl font-semibold mb-4">Interested in working with {business.name}?</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              {business.website && (
                <a href={business.referral_url || business.website} target="_blank" rel="noopener noreferrer">
                  <Button size="lg">
                    Visit Website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
              {business.email && (
                <a href={`mailto:${business.email}`}>
                  <Button variant="outline" size="lg">
                    Contact Them
                    <Mail className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Claim Dialog */}
      <ClaimBusinessDialog
        businessId={id!}
        businessName={business.name}
        isOpen={claimDialogOpen}
        onClose={() => setClaimDialogOpen(false)}
        userId={userId}
      />
    </div>
  );
};

export default BusinessDetail;