import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <CategoryGrid />
      <FeaturedBusinesses />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
