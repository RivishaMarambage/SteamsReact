
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
