'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/Logo";
import Footer from "@/components/layout/Footer";
import { FaWhatsapp } from "react-icons/fa";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Coffee, SlidersHorizontal, DollarSign, Sparkles, ArrowRight, Star, Gift, ShieldCheck, Tag } from "lucide-react";
import HighlightsSection from "@/components/home/HighlightsSection";
import OffersHighlight from "@/components/home/OffersHighlight";
import NewsBanner from "@/components/home/NewsBanner";
import PublicHeader from "@/components/layout/PublicHeader";
import { useUser } from "@/firebase";

export default function LandingPage() {
  const { user } = useUser();
  const clubSectionRef = useRef<HTMLDivElement>(null);
  const [isClubSectionVisible, setIsClubSectionVisible] = useState(false);

  const quotes = [
    { line1: "Coffee is a language in itself.", line2: "We speak it fluently." },
    { line1: "A yawn is a silent scream", line2: "for coffee." },
    { line1: "Life begins after", line2: "the first cup." },
  ];
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsClubSectionVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (clubSectionRef.current) {
      observer.observe(clubSectionRef.current);
    }

    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 4000);

    return () => {
      if (clubSectionRef.current) observer.unobserve(clubSectionRef.current);
      clearInterval(quoteInterval);
    };
  }, [quotes.length]);

  return (
    <div className="flex flex-col min-h-screen bg-[#1a110a] selection:bg-primary selection:text-white">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[100dvh] flex items-center justify-center overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-barista-making-a-latte-art-in-a-coffee-shop-4344-large.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#1a110a]" />
          
          <div className="relative container mx-auto px-4 md:px-6 flex flex-col items-center text-center text-white space-y-6 md:space-y-10 max-w-5xl">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] animate-in fade-in slide-in-from-top-4 duration-1000">
              Est. 2023 • Premium Roastery
            </div>
            
            <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-headline font-black tracking-tighter leading-[0.9] uppercase italic">
              Brewing <span className="text-primary not-italic">Moments,</span><br />
              <span className="text-white opacity-90">One Cup at a Time</span>
            </h1>
            
            <p className="max-w-2xl mx-auto text-sm md:text-lg lg:text-xl font-medium text-white/70 leading-relaxed px-4">
              We bring together authentic Ceylon teas, expertly crafted coffee and comforting food in a homely space designed for everyday moments and meaningful conversations.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4">
              <Button asChild size="lg" className="rounded-full h-14 md:h-16 px-10 bg-primary hover:bg-primary/90 text-white border-none shadow-[0_0_30px_rgba(217,119,6,0.4)] transition-all hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-widest">
                <Link href="/menu" className="flex items-center gap-3">
                  View Our Menu <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full h-14 md:h-16 px-10 bg-white/5 backdrop-blur-md border-white/20 text-white hover:bg-white hover:text-black transition-all hover:scale-105 active:scale-95 text-xs font-black uppercase tracking-widest">
                <Link href={user ? "/dashboard" : "/signup/customer"}>
                  {user ? "Dashboard" : "Join the Club"}
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50 hidden md:block">
            <div className="w-6 h-10 rounded-full border-2 border-white flex justify-center p-1">
              <div className="w-1 h-2 bg-white rounded-full animate-scroll" />
            </div>
          </div>
        </section>

        <NewsBanner />

        {/* Club Section */}
        <section
          ref={clubSectionRef}
          className="bg-[#1a110a] text-white py-24 lg:py-40 relative overflow-hidden"
        >
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className={cn(
              "text-center mb-16 md:mb-24 transition-all duration-1000",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            )}>
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-headline font-black mb-6 uppercase tracking-tighter italic">
                The <span className="text-primary not-italic">Steamsbury</span> Club
              </h2>
              <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto font-body">Loyalty redefined. Make every sip count toward exclusive rewards.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
              {[
                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every purchase. 1 Point = LKR 1 Value.", color: "text-amber-400", glow: "bg-amber-500/10" },
                { icon: Gift, title: "Redeem Rewards", desc: "Use your points to pay for drinks, food, or exclusive merchandise.", color: "text-rose-400", glow: "bg-rose-500/10" },
                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades.", color: "text-emerald-400", glow: "bg-emerald-500/10" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "group relative p-10 rounded-[3rem] bg-stone-900/40 border border-white/5 hover:border-primary/30 transition-all duration-700",
                    isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20"
                  )}
                  style={{ transitionDelay: `${idx * 200}ms` }}
                >
                  <div className={cn("absolute inset-0 rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl", item.glow)} />
                  <div className="relative z-10">
                    <div className={cn("w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6", item.color)}>
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-headline font-bold mb-4 uppercase italic tracking-tight">{item.title}</h3>
                    <p className="text-stone-400 leading-relaxed font-body text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-16 md:mt-24">
              <Button asChild size="lg" className="rounded-full h-16 px-12 bg-white text-black hover:bg-primary hover:text-white transition-all font-black uppercase tracking-widest">
                <Link href="/rewards">Explore Benefits</Link>
              </Button>
            </div>
          </div>
        </section>

        <OffersHighlight />

        {/* Custom Drink Section */}
        <section className="bg-primary text-white py-24 lg:py-40 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
          <div className="container mx-auto px-4 md:px-6 relative">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Sparkles className="h-4 w-4" /> NEW FEATURE
                </div>
                <h2 className="text-5xl md:text-7xl font-headline font-black uppercase italic tracking-tighter leading-[0.9]">
                  Create Your <br /><span className="text-black">Perfect Cup</span>
                </h2>
                <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                  Unleash your inner barista. Choose your base, customize with premium add-ons, and craft a beverage that's uniquely yours.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4">
                  {['4 Coffee Bases', '12+ Add-ons', 'Start from Rs 400'].map((tag, i) => (
                    <div key={i} className="px-5 py-2 bg-black/10 rounded-full text-xs font-bold uppercase tracking-wide border border-white/10">
                      {tag}
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="rounded-full h-16 px-10 bg-black text-white hover:bg-white hover:text-black transition-all shadow-2xl text-xs font-black uppercase tracking-widest">
                  <Link href="/dashboard/creator">Start Building Now</Link>
                </Button>
              </div>
              
              <div className="relative flex justify-center items-center h-[400px] md:h-[600px]">
                <div className="absolute w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-[0_0_100px_rgba(255,255,255,0.2)] animate-pulse-slow">
                  <Coffee className="w-32 h-32 md:w-48 md:h-48 text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
                </div>
                {/* Floating Bubbles */}
                <div className="absolute top-10 right-4 md:right-20 bg-white text-primary px-6 py-3 rounded-full shadow-2xl font-black text-xs md:text-sm animate-float">
                  + VANILLA
                </div>
                <div className="absolute bottom-20 left-4 md:left-10 bg-white text-primary px-6 py-3 rounded-full shadow-2xl font-black text-xs md:text-sm animate-float [animation-delay:1s]">
                  + OAT MILK
                </div>
                <div className="absolute top-1/2 -right-4 md:-right-10 bg-white text-primary px-6 py-3 rounded-full shadow-2xl font-black text-xs md:text-sm animate-float [animation-delay:0.5s]">
                  + EXTRA SHOT
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quotes Section */}
        <section className="bg-[#211811] text-white py-32 lg:py-48 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
            <span className="text-7xl font-headline text-primary opacity-50 block mb-8">"</span>
            <div className="h-32 md:h-48 relative">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 transform",
                    index === currentQuoteIndex ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
                  )}
                >
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-headline font-black uppercase tracking-tighter mb-4 italic">
                    {quote.line1}
                  </h2>
                  <p className="text-2xl md:text-4xl font-headline text-primary italic uppercase font-light">
                    {quote.line2}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-16 flex items-center justify-center gap-4 opacity-30">
              <div className="h-[1px] w-12 bg-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Established 2023</span>
              <div className="h-[1px] w-12 bg-white" />
            </div>
          </div>
        </section>

        <HighlightsSection />
      </main>

      <Footer />

      {/* Floating Action Button */}
      <Link
        href="https://wa.me/94740479838"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 h-16 w-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_15px_40px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-transform border-4 border-white/10"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-8 w-8 text-white" />
      </Link>
    </div>
  );
}
