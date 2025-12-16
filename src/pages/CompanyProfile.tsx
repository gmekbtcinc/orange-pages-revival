import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMember } from "@/contexts/member/MemberContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Building2, Users, Bitcoin, Link2 } from "lucide-react";
import { CoreInfoTab } from "@/components/company-profile/CoreInfoTab";
import { LeadershipTab } from "@/components/company-profile/LeadershipTab";
import { BitcoinAttributesTab } from "@/components/company-profile/BitcoinAttributesTab";
import { LinksMediaTab } from "@/components/company-profile/LinksMediaTab";

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

export default function CompanyProfile() {
  const { companyUser, isLoading: memberLoading } = useMember();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    long_description: "",
    website: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    markets: "",
    founded: "",
    employees: "",
    company_type: "private",
    is_active: true,
    logo_url: "",
    category_id: "",
    ceo_name: "",
    ceo_title: "",
    ceo_headshot_url: "",
    is_bitcoin_only: false,
    accepts_crypto: false,
    is_bfc_member: false,
    is_verified: false,
    is_conference_sponsor: false,
    btc_holdings_source: "",
    referral_url: "",
  });

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch business data linked to member
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["member-business", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return null;
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", member.business_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!companyUser?.business_id,
  });

  // Fetch social links
  const { data: existingSocialLinks = [] } = useQuery({
    queryKey: ["business-social-links", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return [];
      const { data, error } = await supabase
        .from("business_social_links")
        .select("*")
        .eq("business_id", member.business_id);
      if (error) throw error;
      return data.map((l) => ({ platform: l.platform, url: l.url }));
    },
    enabled: !!companyUser?.business_id,
  });

  // Fetch articles
  const { data: existingArticles = [] } = useQuery({
    queryKey: ["business-articles", companyUser?.business_id],
    queryFn: async () => {
      if (!companyUser?.business_id) return [];
      const { data, error } = await supabase
        .from("business_articles")
        .select("*")
        .eq("business_id", member.business_id)
        .order("published_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!companyUser?.business_id,
  });

  // Populate form when data loads
  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || "",
        description: business.description || "",
        long_description: business.long_description || "",
        website: business.website || "",
        email: business.email || "",
        phone: business.phone || "",
        address: business.address || "",
        city: business.city || "",
        state: business.state || "",
        country: business.country || "",
        markets: business.markets || "",
        founded: business.founded || "",
        employees: business.employees || "",
        company_type: business.company_type || "private",
        is_active: business.is_active ?? true,
        logo_url: business.logo_url || "",
        category_id: business.category_id || "",
        ceo_name: business.ceo_name || "",
        ceo_title: business.ceo_title || "",
        ceo_headshot_url: business.ceo_headshot_url || "",
        is_bitcoin_only: business.is_bitcoin_only ?? false,
        accepts_crypto: business.accepts_crypto ?? false,
        is_bfc_member: business.is_bfc_member ?? false,
        is_verified: business.is_verified ?? false,
        is_conference_sponsor: business.is_conference_sponsor ?? false,
        btc_holdings_source: business.btc_holdings_source || "",
        referral_url: business.referral_url || "",
      });
    }
  }, [business]);

  useEffect(() => {
    setSocialLinks(existingSocialLinks);
  }, [existingSocialLinks]);

  useEffect(() => {
    setArticles(existingArticles);
  }, [existingArticles]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!companyUser?.business_id) throw new Error("No business linked");

      // Update business
      const { error: businessError } = await supabase
        .from("businesses")
        .update({
          name: formData.name,
          description: formData.description,
          long_description: formData.long_description,
          website: formData.website,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          markets: formData.markets,
          founded: formData.founded,
          employees: formData.employees,
          company_type: formData.company_type as any,
          is_active: formData.is_active,
          logo_url: formData.logo_url || null,
          category_id: formData.category_id || null,
          ceo_name: formData.ceo_name || null,
          ceo_title: formData.ceo_title || null,
          ceo_headshot_url: formData.ceo_headshot_url || null,
          is_bitcoin_only: formData.is_bitcoin_only,
          accepts_crypto: formData.accepts_crypto,
          is_bfc_member: formData.is_bfc_member,
          is_verified: formData.is_verified,
          is_conference_sponsor: formData.is_conference_sponsor,
          btc_holdings_source: formData.btc_holdings_source || null,
          referral_url: formData.referral_url || null,
        })
        .eq("id", member.business_id);

      if (businessError) throw businessError;

      // Update social links - delete all and re-insert
      await supabase
        .from("business_social_links")
        .delete()
        .eq("business_id", member.business_id);

      if (socialLinks.length > 0) {
        const { error: socialError } = await supabase
          .from("business_social_links")
          .insert(
            socialLinks.map((l) => ({
              business_id: member.business_id,
              platform: l.platform,
              url: l.url,
            }))
          );
        if (socialError) throw socialError;
      }

      // Update articles - delete all and re-insert
      await supabase
        .from("business_articles")
        .delete()
        .eq("business_id", member.business_id);

      if (articles.length > 0) {
        const { error: articlesError } = await supabase
          .from("business_articles")
          .insert(
            articles.map((a) => ({
              business_id: member.business_id,
              title: a.title,
              url: a.url,
              source: a.source || null,
              published_date: a.published_date || null,
            }))
          );
        if (articlesError) throw articlesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-business"] });
      queryClient.invalidateQueries({ queryKey: ["business-social-links"] });
      queryClient.invalidateQueries({ queryKey: ["business-articles"] });
      toast({
        title: "Profile saved",
        description: "Your company profile has been updated",
      });
    },
    onError: (error) => {
      console.error("Save error:", error);
      toast({
        title: "Error saving profile",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (memberLoading || businessLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!companyUser?.business_id) {
    return (
      <DashboardLayout>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              No Company Linked
            </h2>
            <p className="text-muted-foreground mb-6">
              Your account is not linked to a company profile. Contact support to link your membership to a company listing.
            </p>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
            <p className="text-muted-foreground">
              Manage your company's public listing
            </p>
          </div>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="core" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Core Info</span>
                </TabsTrigger>
                <TabsTrigger value="leadership" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Leadership</span>
                </TabsTrigger>
                <TabsTrigger value="bitcoin" className="flex items-center gap-2">
                  <Bitcoin className="h-4 w-4" />
                  <span className="hidden sm:inline">Bitcoin</span>
                </TabsTrigger>
                <TabsTrigger value="links" className="flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Links</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="core">
                <CoreInfoTab
                  formData={formData}
                  categories={categories}
                  onChange={handleChange}
                />
              </TabsContent>

              <TabsContent value="leadership">
                <LeadershipTab formData={formData} onChange={handleChange} />
              </TabsContent>

              <TabsContent value="bitcoin">
                <BitcoinAttributesTab formData={formData} onChange={handleChange} />
              </TabsContent>

              <TabsContent value="links">
                <LinksMediaTab
                  formData={formData}
                  socialLinks={socialLinks}
                  articles={articles}
                  onFieldChange={handleChange}
                  onSocialLinksChange={setSocialLinks}
                  onArticlesChange={setArticles}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
