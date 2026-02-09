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
import { Coffee, SlidersHorizontal, DollarSign, Sparkles, ArrowRight, Star, Gift, ShieldCheck } from "lucide-react";
import HighlightsSection from "@/components/home/HighlightsSection";

import OffersHighlight from "@/components/home/OffersHighlight";
import NewsBanner from "@/components/home/NewsBanner";
import PublicHeader from "@/components/layout/PublicHeader";
import { useUser } from "@/firebase";

export default function LandingPage() {
  const { user } = useUser();
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const pathname = usePathname();
  
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
      {
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    if (clubSectionRef.current) {
      observer.observe(clubSectionRef.current);
    }

    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000);

    return () => {
      if (clubSectionRef.current) {
        observer.unobserve(clubSectionRef.current);
      }
      clearInterval(quoteInterval);
    };
  }, [quotes.length]);

  return (
    <div className="flex flex-col min-h-dvh bg-background overflow-x-hidden">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
          >
            <source src="/coffee.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-[#1a110a]" />
          <div className="relative container mx-auto px-4 md:px-6 flex flex-col items-center text-center text-white space-y-6 md:space-y-8 max-w-5xl">
            <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-bold tracking-widest mb-2 animate-fade-in uppercase">
              Est. 2023 • Premium Roastery
            </div>
            <h1 className="text-4xl xs:text-5xl font-headline font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              Brewing Moments,<br />
              <span className="text-[#f59e0b]">One Cup at a Time</span>
            </h1>

            <div className="max-w-[800px] mx-auto text-base md:text-lg lg:text-xl font-body text-white/80 leading-relaxed px-4">
              <span className="block mb-4 font-bold text-white text-2xl uppercase tracking-tighter">
                Your Coffee Journey Starts Here ☕
              </span>

              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-black">☕ 1st order — 10% OFF</span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-black">☕ 2nd order — 5% OFF</span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-black">☕ 3rd order — 15% OFF</span>
              </div>

              <p className="text-white/70">
                From first sip to last drop, we brew joy in the heart of the city using only the finest beans.
                Join the club, sip happy, and unlock member-only perks.
              </p>
            </div>

            <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 px-4">
              <Button asChild size="lg" className="rounded-full h-16 px-10 bg-[#d97706] hover:bg-[#b45309] text-white border-none font-black text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 w-full sm:w-auto">
                <Link href="/menu" className="flex items-center justify-center gap-2">
                  View Our Menu <span className="text-xl">🍴</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full h-16 px-10 bg-[#f59e0b] hover:bg-[#d97706] text-black font-black text-lg border-none shadow-[0_0_40px_rgba(245,158,11,0.4)] w-full sm:w-auto transition-all duration-300 hover:scale-105 active:scale-95">
                <Link href={user ? "/dashboard" : "/signup/customer"} className="flex items-center justify-center gap-2">
                  {user ? "Go to Dashboard" : "Become a Member"} <span className="bg-black text-[#f59e0b] rounded-full p-1"><Sparkles className="h-4 w-4 fill-current" /></span>
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full h-16 px-10 bg-white/10 backdrop-blur-xl text-white border-2 border-white/20 font-black text-lg w-full sm:w-auto hover:bg-white/20 transition-all active:scale-95">
                <Link href="/offers" className="flex items-center justify-center gap-2">
                  View Offers <span className="text-xl">📅</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          ref={clubSectionRef}
          className={cn(
            "bg-gradient-to-b from-[#1a110a] via-[#2c1810] to-[#1a110a] text-white py-24 lg:py-40 transition-all duration-1000 ease-out relative overflow-hidden",
            isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className={cn(
              "text-center mb-20 transition-all duration-700",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <h2 className="text-5xl md:text-7xl font-headline font-black mb-6 bg-gradient-to-r from-white via-white to-[#d97706] bg-clip-text text-transparent">
                Why Join The Club?
              </h2>
              <p className="text-white/60 text-lg md:text-2xl max-w-3xl mx-auto font-medium">Three futuristic reasons to make every single sip count.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {[
                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every rupee spent. Points never expire and unlock instant value.", color: "text-amber-400", glow: "bg-amber-500/20", borderColor: "border-amber-500/30" },
                { icon: Gift, title: "Redeem Rewards", desc: "Use points to pay for your favorite drinks, artisanal food, or limited merchandise.", color: "text-rose-400", glow: "bg-rose-500/20", borderColor: "border-rose-500/30" },
                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades, just continuous elevation.", color: "text-emerald-400", glow: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "glass-card p-10 rounded-[3rem] group relative overflow-hidden cursor-pointer transition-all duration-700 border border-white/5",
                    "hover:-translate-y-4 hover:shadow-[0_20px_80px_rgba(217,119,6,0.15)]",
                    isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  )}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className={cn(
                    "absolute -right-20 -top-20 w-64 h-64 rounded-full blur-[80px] transition-all duration-700",
                    "group-hover:blur-[120px] group-hover:scale-[2] group-hover:opacity-100",
                    item.glow
                  )} />

                  <div className={cn(
                    "w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center mb-8 relative z-10 transition-all duration-500",
                    "border group-hover:border-white/30 group-hover:scale-110 group-hover:rotate-12",
                    "group-hover:shadow-2xl shadow-inner",
                    item.borderColor,
                    item.color
                  )}>
                    <item.icon className="w-10 h-10 transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  <h3 className="text-2xl font-black font-headline mb-4 relative z-10 transition-colors duration-300 group-hover:text-white uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed relative z-10 text-base transition-colors duration-300 group-hover:text-white/80 font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className={cn(
              "text-center transition-all duration-700 delay-500",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Button asChild size="lg" className="rounded-full h-16 px-12 bg-[#d97706] hover:bg-[#b45309] text-white border-none shadow-[0_0_50px_rgba(217,119,6,0.3)] text-xl font-black transition-all duration-300 hover:scale-110 active:scale-95">
                <Link href="/rewards" className="flex items-center gap-3">
                  Explore All Benefits
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#CF6D17] to-[#F58D37] text-accent-foreground py-24 lg:py-32 overflow-hidden relative rounded-[4rem] mx-4 md:mx-8 mb-20">
          <div className="absolute -top-20 -left-40 w-80 h-80 bg-white/10 rounded-full opacity-50" />
          <div className="absolute -bottom-20 -right-40 w-96 h-96 bg-white/10 rounded-full opacity-50" />
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-16 items-center relative">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/20 rounded-full text-sm font-black tracking-widest uppercase">
                <Sparkles className="h-5 w-5" />
                NEW FEATURE
              </div>
              <h2 className="text-5xl lg:text-7xl font-black font-headline leading-tight">Create Your Perfect Cup</h2>
              <p className="text-xl text-accent-foreground/90 font-medium leading-relaxed">
                Unleash your inner barista! Choose your base, customize with premium add-ons, and craft a coffee that's uniquely yours. From syrups to milk alternatives, every detail is in your hands.
              </p>
              <div className="flex flex-wrap gap-4 text-sm uppercase tracking-widest font-black">
                <div className="flex items-center gap-3 px-6 py-3 bg-black/20 rounded-full">
                  <Coffee className="h-6 w-6" />
                  <span>4 Bases</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-black/20 rounded-full">
                  <SlidersHorizontal className="h-6 w-6" />
                  <span>12+ Add-ons</span>
                </div>
                <div className="flex items-center gap-3 px-6 py-3 bg-black/20 rounded-full">
                  <DollarSign className="h-6 w-6" />
                  <span>From Rs 400</span>
                </div>
              </div>
              <Button asChild size="lg" className="rounded-full h-16 px-12 bg-white text-[#d97706] hover:bg-white/90 font-black text-lg border-none shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Link href="/signup/customer" className="flex items-center gap-3 uppercase tracking-tighter">Start Building Now <ArrowRight className="h-6 w-6" /></Link>
              </Button>
            </div>
            <div className="flex justify-center items-center relative h-[400px] md:h-[550px] mt-8 md:mt-0">
              <div className="absolute w-64 h-64 md:w-96 md:h-96 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-2xl border-4 border-white/20 shadow-inner">
                <Coffee className="w-32 h-32 md:w-48 md:h-48 text-white drop-shadow-2xl opacity-90" />
              </div>
              <div className="absolute top-16 right-4 md:top-24 md:right-16 bg-white text-[#d97706] px-6 py-3 md:px-8 md:py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] font-black animate-float [animation-delay:-0.5s] flex items-center gap-3 text-lg">
                <span className="text-2xl text-[#f59e0b]">+</span> Vanilla
              </div>
              <div className="absolute bottom-24 right-4 md:bottom-32 md:right-12 bg-white text-[#d97706] px-6 py-3 md:px-8 md:py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] font-black animate-float [animation-delay:-1.2s] flex items-center gap-3 text-lg">
                <span className="text-2xl text-[#f59e0b]">+</span> Oat Milk
              </div>
              <div className="absolute bottom-12 left-4 md:bottom-20 md:left-12 bg-white text-[#d97706] px-6 py-3 md:px-8 md:py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] font-black animate-float [animation-delay:-0.8s] flex items-center gap-3 text-lg">
                <span className="text-2xl text-[#f59e0b]">+</span> Extra Shot
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#211811] text-white py-24 lg:py-32 relative">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <p className="text-7xl font-black font-headline text-[#d97706]/20 absolute top-10 left-1/2 -translate-x-1/2 select-none">STEAMSBURY</p>
            <p className="text-6xl font-headline text-accent mb-8">❞</p>
            <div className="mt-4 h-32 relative">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center transition-all duration-[3000ms] transform",
                    index === currentQuoteIndex ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                  )}
                >
                  <h2 className="text-4xl font-headline font-black sm:text-6xl uppercase tracking-tighter">
                    {quote.line1}
                  </h2>
                  <p className="text-4xl font-headline text-[#f59e0b] sm:text-6xl italic">
                    {quote.line2}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-sm text-white/40 tracking-[0.5em] font-black uppercase">
              <span className="inline-block w-16 h-px bg-white/20 align-middle"></span>
              <span className="mx-6">ESTABLISHED 2023</span>
              <span className="inline-block w-16 h-px bg-white/20 align-middle"></span>
            </div>
          </div>
        </section>

        <NewsBanner />
        <HighlightsSection />

      </main>
      <Footer />
      <Link
        href="https://wa.me/94740479838"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 left-8 z-50 h-16 w-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform active:scale-90"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-10 w-10 text-white" />
      </Link>
    </div >
  );
}
