import { Card, CardContent } from "@/components/ui/card";
import { Mic, Calendar, Cloud, MessageSquare, Settings, Smartphone } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Voice Greetings",
      description: "Wake up to a friendly, natural-sounding AI voice instead of a jarring alarm. Start your day with warmth and positivity.",
      color: "from-sunrise-mid to-sunrise-end"
    },
    {
      icon: Cloud,
      title: "Personalized Morning Briefings",
      description: "Get the latest weather, your calendar schedule, and top news headlines as part of your wake-up message.",
      color: "from-calm-blue to-calm-purple"
    },
    {
      icon: Mic,
      title: "Voice-Activated Controls",
      description: "Simply say 'snooze' or 'stop' to control your alarm without fumbling for your phone. Natural voice commands that just work.",
      color: "from-sunrise-end to-accent"
    },
    {
      icon: Settings,
      title: "Customizable Experience",
      description: "Choose from different voice styles and select the news topics that matter most to you. Make it truly yours.",
      color: "from-calm-purple to-sunrise-mid"
    },
    {
      icon: Calendar,
      title: "Smart Integrations",  
      description: "Connects seamlessly with your calendar and news sources to provide a truly personalized start to your day.",
      color: "from-accent to-calm-blue"
    },
    {
      icon: Smartphone,
      title: "Cross-Platform",
      description: "Available for both iOS and Android devices. Your perfect morning companion, wherever you are.",
      color: "from-sunrise-mid to-calm-blue"
    }
  ];

  return (
    <section aria-label="Planned product features" className="py-24 bg-background relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
            Transform Your 
            <span className="bg-gradient-to-r from-sunrise-mid to-sunrise-end bg-clip-text text-transparent ml-3">
              Morning Routine
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            More than just an alarm - it's your personal assistant that helps you wake up on the right side of the bed, every day.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-soft transition-all duration-300 border-0 bg-card">
              <CardContent className="p-8 space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} p-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-primary-foreground" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-sunrise-mid/10 to-sunrise-end/10 rounded-full px-6 py-3 border border-sunrise-mid/20">
            <div className="w-2 h-2 bg-sunrise-mid rounded-full animate-pulse"></div>
            <span className="text-foreground font-medium">Start your day smarter, calmer, and more informed</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
