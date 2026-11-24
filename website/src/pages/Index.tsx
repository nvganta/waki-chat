import Hero from "@/components/Hero";
import Features from "@/components/Features";
import CTA from "@/components/CTA";

const Index = () => {
  return (
    <div className="min-h-screen">
      <p role="note" className="bg-background px-6 py-3 text-center text-sm">Prototype preview. Everything described here is built into the Android prototype, which has not yet been tested on a real phone.</p>
      <Hero />
      <Features />
      <CTA />
    </div>
  );
};

export default Index;
