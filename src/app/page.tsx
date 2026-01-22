
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
import { Coffee, SlidersHorizontal, DollarSign, Sparkles, ArrowRight } from "lucide-react";
import HighlightsSection from "@/components/home/HighlightsSection";
import OffersHighlight from "@/components/home/OffersHighlight";

export default function LandingPage() {
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
    <div className="flex flex-col min-h-dvh bg-background">
       <header className="px-4 lg:px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-20 bg-[#211811] text-primary-foreground">
        <Logo />
        <nav className="hidden lg:flex gap-6">
          {navLinks.map(link => (
            <Link 
              key={link.href} 
              href={link.href} 
              className={cn(
                "text-sm font-medium hover:text-accent",
                pathname === link.href ? "text-accent" : ""
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-2 sm:gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/login/customer">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="bg-primary-foreground border-accent text-accent hover:bg-primary-foreground/90">
            <Link href="/signup/customer">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-dvh flex items-center justify-center">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative container mx-auto px-4 md:px-6 text-center text-white space-y-6">
            <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome To Steamsburry
            </h1>
            <h3>Your Daily Dose of Delight </h3>
            <p className="max-w-[700px] mx-auto text-lg md:text-xl font-body">
              Join our loyalty program and get rewarded! Enjoy 10% off your first order, 5% off your second, and 15% off your third as a warm welcome from us.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg" variant="secondary">
                <Link href="/menu">View Menu</Link>
              </Button>
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup/customer">Become a Member</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/offers">Our Offers</Link>
              </Button>

            </div>
          </div>
        </section>
        
        <section
          ref={clubSectionRef}
          className={cn(
            "bg-card text-card-foreground py-16 lg:py-24 transition-all duration-1000 ease-out",
            isClubSectionVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          )}
        >
          <div className="container mx-auto px-4 md:px-6 text-center space-y-8">
            <div className="space-y-6">
                <h2 className="text-3xl font-headline font-bold sm:text-4xl">The Steamsbury Club</h2>
                <p className="text-lg font-semibold text-primary">Loyalty & Rewards Program | Steam Points</p>
                <div className="max-w-3xl mx-auto space-y-4">
                    <p className="text-muted-foreground md:text-lg">
                        The Steamsbury Club is our way of rewarding loyalty and
                        making every visit more rewarding. Members earn Steam
                        Points every time they spend with us, turning regular visits
                        into meaningful rewards.
                    </p>
                    <p className="text-muted-foreground md:text-lg">
                        As a Club member, you enjoy exclusive benefits, special
                        offers, birthday rewards, and early access to promotions.
                        Steam Points can be accumulated and redeemed for a range
                        of member privileges, ensuring that loyalty is always
                        recognised and appreciated.
                    </p>
                </div>
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
                Unleash your inner barista! Choose your base, customize with premium add-ons, and craft a coffee that's uniquely yours. From syrups to milk alternatives, every detail is in your hands.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full">
                  <Coffee className="h-5 w-5" />
                  <span>4 Coffee Bases</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full">
                  <SlidersHorizontal className="h-5 w-5" />
                  <span>12+ Add-ons</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full">
                  <DollarSign className="h-5 w-5" />
                  <span>Start from Rs 400</span>
                </div>
              </div>
              <Button asChild size="lg" className="bg-accent-foreground text-accent hover:bg-accent-foreground/90">
                <Link href="/dashboard/creator">Start Building Now <ArrowRight className="ml-2" /></Link>
              </Button>
            </div>
            <div className="hidden md:flex justify-center items-center relative h-96">
                <div className="absolute w-64 h-64 bg-black/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Coffee className="w-32 h-32 text-white" />
                </div>
                <div className="absolute top-10 right-0 bg-white text-accent px-4 py-2 rounded-full shadow-lg font-semibold animate-float">+ Vanilla</div>
                <div className="absolute bottom-20 -right-10 bg-white text-accent px-4 py-2 rounded-full shadow-lg font-semibold animate-float [animation-delay:-1.5s]">+ Oat Milk</div>
                <div className="absolute bottom-10 left-0 bg-white text-accent px-4 py-2 rounded-full shadow-lg font-semibold animate-float [animation-delay:-0.5s]">+ Extra Shot</div>
            </div>
          </div>
        </section>

        <section className="bg-[#211811] text-white py-20 lg:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center">
              <p className="text-5xl font-headline text-accent">❞</p>
              <div className="mt-4 h-24 relative">
                  {quotes.map((quote, index) => (
                      <div
                          key={index}
                          className={cn(
                              "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-3000",
                              index === currentQuoteIndex ? "opacity-100" : "opacity-0"
                          )}
                      >
                          <h2 className="text-3xl font-headline font-bold sm:text-4xl">
                              {quote.line1}
                          </h2>
                          <p className="text-3xl font-headline text-accent sm:text-4xl">
                              {quote.line2}
                          </p>
                      </div>
                  ))}
              </div>
              <div className="mt-8 text-sm text-white/70 tracking-widest">
                  <span className="inline-block w-8 h-px bg-white/50 align-middle"></span>
                  <span className="mx-4">Since 2023</span>
                  <span className="inline-block w-8 h-px bg-white/50 align-middle"></span>
              </div>
          </div>
        </section>

        <HighlightsSection />

        <OffersHighlight />

      </main>
      <Footer />
       <Link
        href="https://wa.me/94740479838"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 h-16 w-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 transition-colors"
        aria-label="Chat on WhatsApp"
      >
        <FaWhatsapp className="h-8 w-8 text-white" />
      </Link>
    </div>
  );
}
