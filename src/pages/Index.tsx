import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MemberCarousel from "@/components/MemberCarousel";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedBusinesses from "@/components/FeaturedBusinesses";
import CallToAction from "@/components/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <MemberCarousel />
      <CategoryGrid />
      <FeaturedBusinesses />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
