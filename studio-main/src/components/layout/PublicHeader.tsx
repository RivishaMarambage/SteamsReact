
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useUser } from "@/firebase";

export default function PublicHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useUser();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/updates", label: "Updates" },
    { href: "/rewards", label: "Rewards" },
    { href: "/offers", label: "Offers" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <>
      <header className="px-4 lg:px-6 h-20 flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-[#1a110a] text-primary-foreground border-b border-white/5 shadow-md">
        <Logo className="scale-110" />

        <nav className="hidden lg:flex gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-accent",
                pathname === link.href ? "text-accent" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <nav className="hidden sm:flex items-center gap-4">
            <Button asChild className="rounded-full px-8 py-3 bg-[#d97706] hover:bg-[#b45309] text-white border-none font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(217,119,6,0.6)]">
              <Link href="/login/customer">Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-8 py-3 bg-white hover:bg-[#d97706] text-[#d97706] hover:text-white border-2 border-[#d97706] hover:border-[#d97706] font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(217,119,6,0.5)]">
              <Link href="/signup/customer">Sign Up</Link>
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-40 bg-[#1a110a] transition-all duration-300 transform lg:hidden",
        isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <nav className="flex flex-col items-center justify-center h-full gap-8 p-4">
          {navLinks.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-2xl font-headline font-bold transition-all duration-300",
                pathname === link.href ? "text-[#d97706]" : "text-white/70",
                isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-4 mt-8 w-full max-w-xs sm:hidden">
            <Button asChild className="rounded-full h-14 bg-[#d97706] text-white text-lg font-bold">
              <Link href="/login/customer" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full h-14 bg-white text-[#d97706] border-[#d97706] text-lg font-bold">
              <Link href="/signup/customer" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
