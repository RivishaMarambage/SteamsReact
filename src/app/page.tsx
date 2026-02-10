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
import { Coffee, SlidersHorizontal, DollarSign, Sparkles, ArrowRight, Star, Gift, ShieldCheck, Tag, LayoutDashboard, LogIn } from "lucide-react";
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
            <div className="inline-block px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-black tracking-[0.2em] mb-2 animate-fade-in uppercase">
              Est. 2023 • Premium Roastery
            </div>
            <h1 className="text-4xl xs:text-5xl font-headline font-black tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              Brewing Moments,<br />
              <span className="text-[#f59e0b]">One Cup at a Time</span>
            </h1>

            <div className="max-w-[800px] mx-auto text-base md:text-lg lg:text-xl font-body text-white/80 leading-relaxed px-4">
              <span className="block mb-4 font-black text-white text-xl sm:text-2xl uppercase tracking-tighter text-center">
                Your Coffee Journey Starts Here ☕
              </span>

              <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6">
                <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black whitespace-nowrap tracking-wider uppercase">☕ 1st order — 10% OFF</span>
                <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black whitespace-nowrap tracking-wider uppercase">☕ 2nd order — 5% OFF</span>
                <span className="px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] sm:text-xs font-black whitespace-nowrap tracking-wider uppercase">☕ 3rd order — 15% OFF</span>
              </div>

              <p className="text-white/70 text-sm sm:text-base font-medium">
                From first sip to last drop, we brew joy in the heart of the city using only the finest beans.
                Join the club, sip happy, and unlock member-only perks.
              </p>
            </div>

            <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 px-4 w-full">
              <Button asChild size="lg" className="rounded-full h-14 sm:h-16 px-10 bg-[#d97706] hover:bg-[#b45309] text-white border-none font-black text-lg shadow-[0_20px_50px_rgba(217,119,6,0.3)] transition-all hover:scale-105 active:scale-95 flex-1 max-w-[240px] uppercase tracking-tighter">
                <Link href="/menu" className="flex items-center justify-center gap-2">
                  <span>View Menu</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full h-14 sm:h-16 px-10 bg-[#f59e0b] hover:bg-[#d97706] text-black font-black text-lg border-none shadow-[0_20px_50px_rgba(245,158,11,0.2)] transition-all duration-300 hover:scale-105 active:scale-95 flex-1 max-w-[240px] uppercase tracking-tighter">
                <Link href="/offers" className="flex items-center justify-center gap-2">
                  <span>View Offers</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full h-14 sm:h-16 px-10 bg-white text-black hover:bg-white/90 font-black text-lg border-none shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 hover:scale-105 active:scale-95 flex-1 max-w-[240px] uppercase tracking-tighter">
                <Link href={user ? "/dashboard" : "/login/customer"} className="flex items-center justify-center gap-2">
                  <span>{user ? "Dashboard" : "Sign In"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          ref={clubSectionRef}
          className={cn(
            "bg-gradient-to-b from-[#1a110a] via-[#2c1810] to-[#1a110a] text-white py-16 xs:py-24 lg:py-40 transition-all duration-1000 ease-out relative overflow-hidden",
            isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className={cn(
              "text-center mb-12 xs:mb-20 transition-all duration-700",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <h2 className="text-3xl xs:text-4xl md:text-6xl lg:text-7xl font-headline font-black mb-4 xs:mb-6 bg-gradient-to-r from-white via-white to-[#d97706] bg-clip-text text-transparent uppercase tracking-tighter leading-none px-4">
                Why Join The Club?
              </h2>
              <p className="text-white/60 text-base xs:text-lg md:text-2xl max-w-3xl mx-auto font-medium px-4 leading-relaxed">Three futuristic reasons to make every single sip count.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 xs:mb-16 max-w-7xl mx-auto">
              {[
                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every rupee spent. Points never expire and unlock instant value.", color: "text-amber-400", glow: "bg-amber-500/20", borderColor: "border-amber-500/30" },
                { icon: Gift, title: "Redeem Rewards", desc: "Use points to pay for your favorite drinks, artisanal food, or limited merchandise.", color: "text-rose-400", glow: "bg-rose-500/20", borderColor: "border-rose-500/30" },
                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades, just continuous elevation.", color: "text-emerald-400", glow: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "glass-card p-8 xs:p-10 rounded-[2.5rem] group relative overflow-hidden cursor-pointer transition-all duration-700 border border-white/5",
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
                    "w-16 h-16 xs:w-20 xs:h-20 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-8 relative z-10 transition-all duration-500",
                    "border group-hover:border-white/30 group-hover:scale-110",
                    item.borderColor,
                    item.color
                  )}>
                    <item.icon className="w-8 h-8 xs:w-10 xs:h-10 transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black font-headline mb-4 relative z-10 transition-colors duration-300 group-hover:text-white uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-white/50 leading-relaxed relative z-10 text-sm sm:text-base transition-colors duration-300 group-hover:text-white/80 font-medium">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className={cn(
              "text-center transition-all duration-700 delay-500",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Button asChild size="lg" className="rounded-full h-16 sm:h-20 px-12 bg-[#d97706] hover:bg-[#b45309] text-white border-none shadow-[0_0_50px_rgba(217,119,6,0.3)] text-lg font-black transition-all duration-300 hover:scale-110 active:scale-95 uppercase tracking-widest">
                <Link href="/rewards" className="flex items-center gap-3">
                  <span>Explore Benefits</span>
                  <Sparkles className="w-6 h-6 animate-pulse" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <NewsBanner />

        {/* Create Your Perfect Cup - Enhanced Responsive Section */}
        <section className="bg-gradient-to-br from-[#CF6D17] to-[#F58D37] text-accent-foreground min-h-screen flex items-center overflow-hidden relative py-20 lg:py-0">
          <div className="absolute -top-20 -left-40 w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] bg-white/10 rounded-full blur-[80px] sm:blur-[120px] opacity-50" />
          <div className="absolute -bottom-40 -right-40 w-[25rem] sm:w-[50rem] h-[25rem] sm:h-[50rem] bg-white/10 rounded-full blur-[100px] sm:blur-[150px] opacity-50" />
          
          <div className="container mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10 text-center lg:text-left">
            <div className="space-y-6 sm:space-y-10 order-2 lg:order-1">
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-black/20 rounded-full text-xs sm:text-sm font-black tracking-widest uppercase backdrop-blur-md mx-auto lg:mx-0">
                <Sparkles className="h-4 w-4" />
                NEW FEATURE
              </div>
              <h2 className="text-4xl xs:text-6xl lg:text-8xl font-black font-headline leading-[1.05] tracking-tight uppercase">
                Create Your <br className="hidden sm:block" />Perfect Cup
              </h2>
              <p className="text-lg lg:text-2xl text-accent-foreground/90 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 px-4">
                Unleash your inner barista! Choose your base, customize with premium add-ons, and craft a coffee that's uniquely yours.
              </p>
              
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-6 text-[10px] sm:text-sm uppercase tracking-widest font-black px-4">
                <div className="flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 bg-black/20 rounded-[1.5rem] backdrop-blur-md border border-white/10 whitespace-nowrap">
                  <Coffee className="h-5 w-5 sm:h-7" />
                  <span>Bases</span>
                </div>
                <div className="flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 bg-black/20 rounded-[1.5rem] backdrop-blur-md border border-white/10 whitespace-nowrap">
                  <SlidersHorizontal className="h-5 w-5 sm:h-7" />
                  <span>Add-ons</span>
                </div>
              </div>
              
              <div className="pt-6 px-4">
                <Button asChild size="lg" className="rounded-full h-16 sm:h-20 px-12 bg-white text-[#d97706] hover:bg-white/90 font-black text-xl border-none shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-300 hover:scale-105 group w-full sm:w-auto">
                  <Link href="/signup/customer" className="flex items-center justify-center gap-4 uppercase tracking-tighter">
                    Start Building <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex justify-center items-center relative h-[300px] sm:h-[500px] lg:h-[700px] order-1 lg:order-2">
              <div className="absolute w-[15rem] sm:w-[30rem] h-[15rem] sm:h-[30rem] bg-white/20 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" />
              <div className="relative z-10 w-56 h-56 sm:w-80 md:w-[30rem] md:h-[30rem] bg-white/10 rounded-full flex items-center justify-center backdrop-blur-3xl border-4 border-white/30 shadow-[inset_0_0_80px_rgba(255,255,255,0.2)]">
                <Coffee className="w-28 h-28 sm:w-48 md:w-72 md:h-72 text-white drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)] opacity-95 transition-transform hover:scale-110 duration-700" />
                
                <div className="absolute top-2 -right-4 sm:top-10 sm:-right-4 bg-white/90 backdrop-blur-xl text-[#d97706] px-4 py-2 sm:px-6 rounded-full shadow-lg font-black animate-float text-sm sm:text-lg border border-white whitespace-nowrap">
                  <span className="text-[#f59e0b]">+</span> Vanilla
                </div>
                
                <div className="absolute bottom-10 -right-2 sm:bottom-16 sm:-right-8 bg-white/90 backdrop-blur-xl text-[#d97706] px-4 py-2 sm:px-6 rounded-full shadow-lg font-black animate-float [animation-delay:-1.2s] text-sm sm:text-lg border border-white whitespace-nowrap">
                  <span className="text-[#f59e0b]">+</span> Oat Milk
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#211811] text-white py-24 relative">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <p className="text-4xl sm:text-7xl font-black font-headline text-[#d97706]/20 absolute top-10 left-1/2 -translate-x-1/2 select-none uppercase tracking-widest overflow-hidden whitespace-nowrap w-full">STEAMSBURY</p>
            <p className="text-4xl font-headline text-accent mb-8">❞</p>
            <div className="mt-4 h-32 sm:h-40 relative">
              {quotes.map((quote, index) => (
                <div
                  key={index}
                  className={cn(
                    "absolute inset-0 flex flex-col items-center justify-center transition-all duration-[3000ms] transform px-4",
                    index === currentQuoteIndex ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-95"
                  )}
                >
                  <h2 className="text-xl xs:text-3xl font-headline font-black sm:text-6xl uppercase tracking-tighter leading-tight">
                    {quote.line1}
                  </h2>
                  <p className="text-xl xs:text-3xl font-headline text-[#f59e0b] sm:text-6xl italic leading-tight">
                    {quote.line2}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <HighlightsSection />

      </main>
      <Footer />
      <Link
        href="https://wa.me/94740479838"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 left-6 xs:bottom-8 xs:left-8 z-50 h-14 w-14 sm:h-16 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(37,211,102,0.4)] hover:scale-110 transition-transform active:scale-90"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-8 w-8 sm:h-10 text-white" />
      </Link>
    </div >
  );
}