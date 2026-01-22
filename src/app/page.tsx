
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

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');
  const pathname = usePathname();
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/rewards", label: "Rewards" },
    { href: "/offers", label: "Offers" },
    { href: "/updates", label: "Updates" },
    { href: "/about", label: "About Us" },
  ];

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
                "text-sm font-medium hover:text-accent underline-offset-4",
                pathname === link.href ? "text-accent underline" : ""
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
        
        <section className="bg-card text-card-foreground py-16 lg:py-24">
          <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
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
        </section>
        
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
