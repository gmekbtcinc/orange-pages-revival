import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import btcLogo from "@/assets/btc-logo.png";
import { SubmitBusinessDialog } from "@/components/submissions/SubmitBusinessDialog";

const Hero = () => {
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/directory");
    }
  };

  return (
    <section className="relative bg-secondary py-20 px-4 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
      </div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-center mb-8">
          <img src={btcLogo} alt="BTC Inc" className="h-16 w-auto invert" />
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold text-center text-secondary-foreground mb-4">
          Orange Pages
        </h1>
        
        <p className="text-xl md:text-2xl text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
          The comprehensive directory of Bitcoin businesses and services
        </p>
        
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="search"
                placeholder="Search Bitcoin businesses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-lg bg-background border-border"
              />
            </div>
            <Button type="submit" size="lg" className="h-14 px-8 bg-primary hover:bg-primary/90">
              Search
            </Button>
          </div>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate("/directory")}
            >
              Browse All
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setSubmitDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Submit a Business
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Powered by BTC Inc • Bitcoin Magazine • Bitcoin Conference • Bitcoin for Corporations
          </p>
        </div>
      </div>

      <SubmitBusinessDialog 
        isOpen={submitDialogOpen} 
        onClose={() => setSubmitDialogOpen(false)} 
      />
    </section>
  );
};

export default Hero;
