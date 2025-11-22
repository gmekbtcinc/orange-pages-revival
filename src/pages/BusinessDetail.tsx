import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fetchBusinessById } from "@/lib/businessQueries";

const BusinessDetail = () => {
  const { id } = useParams();
  
  const { data: business, isLoading, error } = useQuery({
    queryKey: ["business", id],
    queryFn: () => fetchBusinessById(id!),
    enabled: !!id,
  });

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
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Directory
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Business Header */}
          <div className="mb-8">
            {business.category && (
              <Link to={`/category/${business.category.slug}`}>
                <Badge variant="outline" className="mb-4 hover:bg-accent cursor-pointer">
                  {business.category.name}
                </Badge>
              </Link>
            )}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">{business.name}</h1>
                <p className="text-xl text-muted-foreground">{business.description}</p>
              </div>
              {business.featured && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Featured
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {business.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>
          </div>

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
                  href={business.website} 
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

            {business.address && (
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

            {business.email && (
              <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  Address
                </h3>
                <p className="text-muted-foreground">
                  {business.address}
                  {business.city && `, ${business.city}`}
                  {business.state && `, ${business.state}`}
                  {business.country && `, ${business.country}`}
                </p>
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

          {/* Company Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Company Information</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {business.category && (
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <p className="text-muted-foreground">{business.category.name}</p>
                  </div>
                )}
                {business.founded && (
                  <div>
                    <h3 className="font-semibold mb-2">Founded</h3>
                    <p className="text-muted-foreground">{business.founded}</p>
                  </div>
                )}
                {business.employees && (
                  <div>
                    <h3 className="font-semibold mb-2">Employees</h3>
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
                <a href={business.website} target="_blank" rel="noopener noreferrer">
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
    </div>
  );
};

export default BusinessDetail;
