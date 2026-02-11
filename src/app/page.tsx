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
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/updates", label: "Updates" },
    { href: "/rewards", label: "Rewards" },
    { href: "/offers", label: "Offers" },
    { href: "/about", label: "About Us" },
  ];

  const clubSectionRef = useRef<HTMLDivElement>(null);
  const [isClubSectionVisible, setIsClubSectionVisible] = useState(false);

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

    return () => {
      if (clubSectionRef.current) {
        observer.unobserve(clubSectionRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <PublicHeader />

      <main className="flex-1">
        <section className="relative w-full min-h-[90dvh] flex items-center justify-center overflow-hidden bg-[#1a110a]">
          <div className="absolute inset-0">
            {heroImage && (
              <Image 
                src={heroImage.imageUrl} 
                alt={heroImage.description} 
                fill 
                className="object-cover opacity-40 brightness-50"
                priority
                data-ai-hint={heroImage.imageHint}
              />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-[#1a110a]" />
          <div className="relative container mx-auto px-4 md:px-6 flex flex-col items-center text-center text-white space-y-6 md:space-y-8 max-w-5xl">
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] md:text-xs font-medium tracking-wider mb-2 animate-fade-in">
              Est. 2023 • Premium Roastery
            </div>
            <h1 className="text-4xl xs:text-5xl font-headline font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl leading-[1.1]">
              Brewing Moments,<br />
              <span className="text-[#f59e0b]">One Cup at a Time</span>
            </h1>
            <p className="max-w-[800px] mx-auto text-base md:text-lg lg:text-xl font-body text-white/80 leading-relaxed px-4">
              Experience the art of coffee in the heart of the city. We source the finest beans to bring you a daily ritual worth savoring.
            </p>
            <div className="mt-8 md:mt-10 flex flex-wrap justify-center gap-4 px-4">
              <Button asChild size="lg" className="rounded-full h-14 px-6 md:px-8 bg-[#d97706] hover:bg-[#b45309] text-white border-none shadow-xl w-full sm:w-auto">
                <Link href="/menu" className="flex items-center justify-center gap-2">
                  View Our Menu <span className="text-xl">🍴</span>
                </Link>
              </Button>
              <Button asChild size="lg" className="rounded-full h-14 px-6 md:px-8 bg-[#f59e0b] hover:bg-[#d97706] text-black font-semibold border-none shadow-lg w-full sm:w-auto transition-all duration-300 hover:scale-105">
                <Link href={user ? "/dashboard" : "/signup/customer"} className="flex items-center justify-center gap-2">
                  {user ? "Go to Dashboard" : "Become a Member"} <span className="bg-black text-[#f59e0b] rounded-full p-0.5"><Sparkles className="h-3 w-3 fill-current" /></span>
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="rounded-full h-14 px-6 md:px-8 text-white hover:bg-white/10 hover:text-white border border-white/20 bg-transparent w-full sm:w-auto">
                <Link href="/offers" className="flex items-center justify-center gap-2">
                  View Offers <span className="text-xl opacity-30">📅</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section
          ref={clubSectionRef}
          className={cn(
            "bg-gradient-to-b from-[#1a110a] via-[#2c1810] to-[#1a110a] text-white py-20 lg:py-32 transition-all duration-1000 ease-out relative overflow-hidden",
            isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(#d97706 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className={cn(
              "text-center mb-16 transition-all duration-700",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <h2 className="text-4xl md:text-5xl font-headline font-black mb-4 bg-gradient-to-r from-white via-white to-[#d97706] bg-clip-text text-transparent">
                Why Join The Steamsbury Club?
              </h2>
              <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">Three simple reasons to make every sip count.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Star, title: "Earn Points", desc: "Collect Steam Points on every rupee spent. Points never expire.", color: "text-amber-400", glow: "bg-amber-500/20", borderColor: "border-amber-500/30" },
                { icon: Gift, title: "Redeem Rewards", desc: "Use points to pay for your favorite drinks, food, or merchandise.", color: "text-rose-400", glow: "bg-rose-500/20", borderColor: "border-rose-500/30" },
                { icon: ShieldCheck, title: "Tier Protection", desc: "Once you reach a tier, you keep it. Forever. No downgrades.", color: "text-emerald-400", glow: "bg-emerald-500/20", borderColor: "border-emerald-500/30" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "glass-card p-8 rounded-3xl group relative overflow-hidden cursor-pointer transition-all duration-700 border border-white/5",
                    "hover:-translate-y-3 hover:shadow-2xl hover:shadow-[#d97706]/20",
                    isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                  )}
                  style={{ transitionDelay: `${idx * 150}ms` }}
                >
                  <div className={cn(
                    "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[50px] transition-all duration-700",
                    "group-hover:blur-[80px] group-hover:scale-[2] group-hover:opacity-100",
                    item.glow
                  )} />

                  <div className={cn(
                    "absolute top-0 right-0 p-6 opacity-10 transition-all duration-700",
                    "group-hover:opacity-25 group-hover:scale-110 group-hover:rotate-12",
                    item.color
                  )}>
                    <item.icon className="w-24 h-24" />
                  </div>

                  <div className={cn(
                    "w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 relative z-10 transition-all duration-500",
                    "border group-hover:border-white/30 group-hover:scale-110 group-hover:rotate-6",
                    "group-hover:shadow-lg",
                    item.borderColor,
                    item.color
                  )}>
                    <item.icon className="w-7 h-7 transition-transform duration-500 group-hover:scale-110" />
                  </div>

                  <h3 className="text-xl font-bold font-headline mb-3 relative z-10 transition-colors duration-300 group-hover:text-white">
                    {item.title}
                  </h3>
                  <p className="text-white/60 leading-relaxed relative z-10 text-sm transition-colors duration-300 group-hover:text-white/80">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className={cn(
              "text-center transition-all duration-700 delay-500",
              isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <Button asChild size="lg" className="rounded-full h-14 px-8 bg-[#d97706] hover:bg-[#b45309] text-white border-none shadow-lg text-lg font-bold transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] active:scale-95">
                <Link href="/rewards" className="flex items-center gap-2">
                  Explore All Benefits
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[#CF6D17] to-[#F58D37] text-accent-foreground py-20 lg:py-24 overflow-hidden relative">
          <div className="absolute -top-20 -left-40 w-80 h-80 bg-white/10 rounded-full opacity-50" />
          <div className="absolute -bottom-20 -right-40 w-96 h-96 bg-white/10 rounded-full opacity-50" />
          <div className="container mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-12 items-center relative">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/20 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                NEW FEATURE
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold font-headline">Create Your Perfect Cup</h2>
              <p className="text-lg text-accent-foreground/90">
                Unleash your inner barista! Choose your base, customize with premium add-ons, and craft a coffee that's uniquely yours.
              </p>
              <Button asChild size="lg" className="rounded-2xl h-14 px-8 bg-white text-[#d97706] hover:bg-white/90 font-bold border-none shadow-xl transition-all duration-300 hover:scale-105 active:scale-95">
                <Link href="/dashboard/creator" className="flex items-center gap-2">Start Building Now <ArrowRight className="h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="flex justify-center items-center relative h-[300px] md:h-[400px]">
              <div className="absolute w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl">
                <Coffee className="w-24 h-24 md:w-32 md:h-32 text-white" />
              </div>
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
        className="fixed bottom-8 left-8 z-50 h-14 w-14 bg-green rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95 border border-black/5"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-8 w-8 text-[#25D366]" />
      </Link>
    </div >
  );
}
