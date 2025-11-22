import { 
  Wallet, 
  Shield, 
  TrendingUp, 
  CreditCard, 
  Cpu, 
  Server,
  Layers,
  Code,
  BarChart3,
  Lock,
  Briefcase,
  FileText,
  Package,
  MessageSquare,
  GraduationCap
} from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  { name: "Wallets", icon: Wallet, count: 45 },
  { name: "Custody & Institutional Banking", icon: Shield, count: 28 },
  { name: "Exchanges & Trading Venues", icon: TrendingUp, count: 67 },
  { name: "Payments & Commerce", icon: CreditCard, count: 52 },
  { name: "Mining: Hardware, Pools & Operations", icon: Cpu, count: 34 },
  { name: "Nodes & Core Network Infrastructure", icon: Server, count: 23 },
  { name: "Scaling & Layer-2 Protocols", icon: Layers, count: 19 },
  { name: "Developer Tooling & Frameworks", icon: Code, count: 41 },
  { name: "Data, Analytics & Oracles", icon: BarChart3, count: 31 },
  { name: "Privacy & Security Tools", icon: Lock, count: 26 },
  { name: "Financial Products & Asset Management", icon: Briefcase, count: 38 },
  { name: "Business Operations & Compliance", icon: FileText, count: 29 },
  { name: "Apps & Use-Case Platforms on Bitcoin", icon: Package, count: 44 },
  { name: "Social & Communication Platforms", icon: MessageSquare, count: 22 },
  { name: "Education, Media, Funding & Advocacy", icon: GraduationCap, count: 56 },
];

const CategoryGrid = () => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Browse by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card
                key={index}
                className="group relative overflow-hidden border-border hover:border-primary transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {category.count} listings
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {category.name}
                  </h3>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
