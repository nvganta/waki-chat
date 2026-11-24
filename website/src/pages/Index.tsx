import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <p role="note" className="bg-background px-6 py-3 text-center text-sm">Concept preview — features shown here include planned work, not a released product.</p>
      <Hero />
      <Features />
      <CTA />
    </div>
  );
};

export default Index;
