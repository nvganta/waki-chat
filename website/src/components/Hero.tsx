import heroImage from "@/assets/waki-hero-image.jpg";
import { Smartphone } from "lucide-react";
const Hero = () => {
  return <section className="min-h-screen bg-gradient-hero relative overflow-hidden flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-sunrise-start/20 via-transparent to-sunrise-end/10"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-primary-foreground leading-tight">
                Wake Up
                <br />
                <span className="bg-gradient-to-r from-sunrise-mid to-sunrise-end bg-clip-text text-transparent">
                  Smarter
                </span>
              </h1>
              <p className="text-xl lg:text-2xl text-primary-foreground/90 max-w-lg">
                An Android alarm prototype that rings and speaks a short greeting. Set a time, then stop or snooze when it rings.
              </p>
            </div>


            
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-r from-sunrise-mid to-sunrise-end rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              <img src={heroImage} alt="Illustration of a morning alarm on a smartphone" className="relative w-full max-w-md mx-auto rounded-3xl shadow-2xl" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-8 -right-8 animate-pulse">
              <div className="bg-warm-white/20 backdrop-blur-lg rounded-2xl p-4 shadow-lg">
                <Smartphone className="w-8 h-8 text-sunrise-mid" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;
