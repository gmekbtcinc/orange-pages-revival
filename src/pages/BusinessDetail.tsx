import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Mail, Phone, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock data - will be replaced with database queries later
const mockBusinesses = [
  {
    id: "1",
    name: "BitStack Solutions",
    category: "Technology",
    description: "Leading Bitcoin infrastructure provider offering enterprise-grade solutions for businesses looking to integrate Bitcoin payments and services into their operations.",
    longDescription: "BitStack Solutions is at the forefront of Bitcoin technology integration, providing comprehensive infrastructure solutions for businesses of all sizes. Our team of expert developers and Bitcoin specialists work closely with clients to design, implement, and maintain robust Bitcoin payment systems, custody solutions, and blockchain integration services.\n\nWith over 5 years of experience in the Bitcoin space, we've helped hundreds of businesses successfully navigate the complexities of Bitcoin adoption. Our solutions are built with security, scalability, and user experience as top priorities.",
    tags: ["Bitcoin", "Infrastructure", "Enterprise", "Payments"],
    featured: true,
    website: "https://bitstacksolutions.com",
    email: "contact@bitstacksolutions.com",
    phone: "+1 (555) 123-4567",
    address: "123 Bitcoin Blvd, San Francisco, CA 94102",
    founded: "2019",
    employees: "25-50",
    services: ["Bitcoin Payment Integration", "Custody Solutions", "Blockchain Consulting", "API Development"]
  },
  {
    id: "2",
    name: "Orange Financial",
    category: "Finance",
    description: "Bitcoin-focused financial services providing custody, lending, and investment solutions for individuals and institutions.",
    longDescription: "Orange Financial is a trusted name in Bitcoin financial services, offering secure custody solutions, Bitcoin-backed lending products, and institutional-grade investment services. We combine traditional financial expertise with deep Bitcoin knowledge to provide our clients with safe, reliable, and innovative financial products.\n\nOur mission is to make Bitcoin accessible to everyone while maintaining the highest standards of security and regulatory compliance.",
    tags: ["Bitcoin", "Finance", "Custody", "Investment"],
    featured: true,
    website: "https://orangefinancial.com",
    email: "info@orangefinancial.com",
    phone: "+1 (555) 234-5678",
    address: "456 Satoshi Street, New York, NY 10001",
    founded: "2020",
    employees: "50-100",
    services: ["Bitcoin Custody", "Lending Services", "Investment Management", "Financial Planning"]
  },
  {
    id: "3",
    name: "Satoshi's Coffee",
    category: "Food & Beverage",
    description: "Bitcoin-friendly coffee shop chain accepting Lightning Network payments with locations across major cities.",
    longDescription: "Satoshi's Coffee is more than just a coffee shop - it's a community hub for Bitcoin enthusiasts and curious minds alike. We accept Lightning Network payments for instant, low-fee transactions, and our staff is knowledgeable about Bitcoin and happy to discuss the technology with customers.\n\nWe source our beans ethically and roast them to perfection, offering a premium coffee experience that aligns with Bitcoin's values of transparency and quality.",
    tags: ["Coffee", "Lightning", "Retail", "Community"],
    featured: false,
    website: "https://satoshiscoffee.com",
    email: "hello@satoshiscoffee.com",
    phone: "+1 (555) 345-6789",
    address: "789 Lightning Lane, Austin, TX 78701",
    founded: "2021",
    employees: "10-25",
    services: ["Coffee & Beverages", "Lightning Payments", "Bitcoin Education", "Community Events"]
  }
];

const BusinessDetail = () => {
  const { id } = useParams();
  const business = mockBusinesses.find(b => b.id === id);

  if (!business) {
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
                <Badge key={tag} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
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

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <MapPin className="mr-2 h-4 w-4 text-primary" />
                  Address
                </h3>
                <p className="text-muted-foreground">{business.address}</p>
              </CardContent>
            </Card>
          </div>

          {/* About Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">About</h2>
              <div className="prose prose-gray max-w-none">
                {business.longDescription.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="text-muted-foreground mb-4 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services Section */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Services</h2>
              <ul className="grid md:grid-cols-2 gap-3">
                {business.services.map((service) => (
                  <li key={service} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    <span className="text-muted-foreground">{service}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Company Information</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p className="text-muted-foreground">{business.category}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Founded</h3>
                  <p className="text-muted-foreground">{business.founded}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Employees</h3>
                  <p className="text-muted-foreground">{business.employees}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="mt-12 text-center">
            <Separator className="mb-8" />
            <h3 className="text-xl font-semibold mb-4">Interested in working with {business.name}?</h3>
            <div className="flex gap-4 justify-center">
              <a href={business.website} target="_blank" rel="noopener noreferrer">
                <Button size="lg">
                  Visit Website
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <a href={`mailto:${business.email}`}>
                <Button variant="outline" size="lg">
                  Contact Them
                  <Mail className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BusinessDetail;
