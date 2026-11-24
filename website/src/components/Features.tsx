import { Card, CardContent } from "@/components/ui/card";
import { BellRing, MessageSquare, Mic } from "lucide-react";

const features = [
  { icon: BellRing, title: "A local alarm", description: "Set one wake-up time on your Android phone. Waki plays the phone's alarm sound, or its own built-in tone if that sound can't play, and keeps the schedule on the device." },
  { icon: MessageSquare, title: "A spoken greeting", description: "The phone's text-to-speech voice says the time and a short greeting. The alarm sound continues if speech is unavailable." },
  { icon: Mic, title: "Stop or snooze", description: "Use the buttons, or tap to speak a supported stop or snooze command when your phone's speech recognition is available." },
];
export default function Features() {
  return <section aria-label="How Waki works" className="py-24 bg-background"><div className="container mx-auto px-4">
    <div className="text-center space-y-4 mb-16"><h2 className="text-4xl lg:text-5xl font-bold">A simpler morning alarm</h2><p className="text-xl text-muted-foreground max-w-3xl mx-auto">An Android prototype. Delivery, reboot and voice controls still need testing on a real phone.</p></div>
    <div className="grid md:grid-cols-3 gap-8">{features.map(feature => <Card key={feature.title} className="border-0 bg-card"><CardContent className="p-8 space-y-4"><feature.icon className="w-8 h-8 text-primary" /><h3 className="text-xl font-semibold">{feature.title}</h3><p className="text-muted-foreground leading-relaxed">{feature.description}</p></CardContent></Card>)}</div>
  </div></section>;
}
