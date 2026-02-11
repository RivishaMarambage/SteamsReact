'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import Footer from "@/components/layout/Footer";
import { FaWhatsapp } from "react-icons/fa";
import { Coffee, Sparkles, ArrowRight, Star, Gift, ShieldCheck } from "lucide-react";
import HighlightsSection from "@/components/home/HighlightsSection";
import OffersHighlight from "@/components/home/OffersHighlight";
import PublicHeader from "@/components/layout/PublicHeader";
import { useUser } from "@/firebase";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const { user } = useUser();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen bg-[#1a110a] selection:bg-primary selection:text-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Simplified Hero Section */}
        <section className="relative w-full h-[80dvh] flex items-center justify-center overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover brightness-50"
              priority
              data-ai-hint={heroImage.imageHint}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#1a110a]" />
          
          <div className="relative container mx-auto px-4 text-center text-white space-y-6 max-w-4xl">
            <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight leading-tight uppercase">
              Brewing <span className="text-primary">Moments,</span><br />
              One Cup at a Time
            </h1>
            
            <p className="max-w-2xl mx-auto text-lg md:text-xl font-medium text-white/80 leading-relaxed">
              Experience authentic Ceylon teas, expertly crafted coffee and comforting food in a homely space designed for meaningful conversations.
            </p>
            
            <div className="pt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="rounded-full h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest">
                <Link href="/menu" className="flex items-center gap-2">
                  View Menu <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 px-10 bg-white/5 border-white/20 text-white hover:bg-white hover:text-black font-bold uppercase tracking-widest">
                <Link href={user ? "/dashboard" : "/signup/customer"}>
                  {user ? "Go to Dashboard" : "Join the Club"}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Club Benefits Section */}
        <section className="bg-[#1a110a] text-white py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4 uppercase">
                The Steamsbury Club
              </h2>
              <p className="text-stone-400 text-lg max-w-2xl mx-auto">Loyalty redefined. Make every sip count toward exclusive rewards.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every purchase. 1 Point = LKR 1 Value.", color: "text-amber-400" },
                { icon: Gift, title: "Redeem Rewards", desc: "Use your points to pay for drinks, food, or exclusive merchandise.", color: "text-rose-400" },
                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it forever. No downgrades.", color: "text-emerald-400" },
              ].map((item, idx) => (
                <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all text-center">
                  <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto", item.color)}>
                    <item.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-headline font-bold mb-4 uppercase tracking-tight">{item.title}</h3>
                  <p className="text-stone-400 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OffersHighlight />
        <HighlightsSection />

        {/* Simplified Custom Section */}
        <section className="bg-primary text-white py-24 overflow-hidden relative">
          <div className="container mx-auto px-4 text-center space-y-8">
            <h2 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight">
              Create Your Perfect Cup
            </h2>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Unleash your inner barista. Choose your base, customize with premium add-ons, and craft a beverage that's uniquely yours.
            </p>
            <Button asChild size="lg" className="rounded-full h-16 px-12 bg-black text-white hover:bg-white hover:text-black transition-all font-bold uppercase tracking-widest shadow-2xl">
              <Link href="/dashboard/creator">Start Building Now</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating Action Button */}
      <Link
        href="https://wa.me/94740479838"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 h-16 w-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-8 w-8 text-white" />
      </Link>
    </div>
  );
}
