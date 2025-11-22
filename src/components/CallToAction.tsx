import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-12 text-center">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-secondary-foreground rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-secondary-foreground rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Is your Bitcoin business listed?
            </h2>
            <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Join hundreds of Bitcoin companies in the most comprehensive directory of Bitcoin businesses and services.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-background text-foreground hover:bg-background/90 border-2 border-background"
              >
                <Plus className="mr-2 h-5 w-5" />
                Submit Your Business
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="bg-transparent text-primary-foreground border-2 border-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Search className="mr-2 h-5 w-5" />
                Explore Directory
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
