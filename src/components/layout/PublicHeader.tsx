'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X, LayoutDashboard, LogIn, UserPlus } from "lucide-react";
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
        <Logo className="scale-90 sm:scale-110" />

        <nav className="hidden xl:flex gap-8">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs font-black transition-colors hover:text-accent tracking-widest uppercase",
                pathname === link.href ? "text-accent" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden md:flex items-center gap-3">
            {user ? (
              <Button asChild className="rounded-full px-8 bg-[#d97706] hover:bg-[#b45309] text-white font-black text-xs uppercase tracking-widest shadow-lg">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" className="rounded-full px-6 text-white hover:bg-white hover:text-[#1a110a] font-black text-xs uppercase tracking-widest transition-all duration-300">
                  <Link href="/login/customer" className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" /> Sign In
                  </Link>
                </Button>
                <Button asChild className="rounded-full px-8 bg-[#d97706] hover:bg-[#b45309] text-white font-black text-xs uppercase tracking-widest shadow-lg">
                  <Link href="/signup/customer" className="flex items-center gap-2">
                    <UserPlus className="w-4 h-4" /> Sign Up
                  </Link>
                </Button>
              </>
            )}
          </nav>

          <button
            className="xl:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 z-40 bg-[#1a110a] transition-all duration-300 transform xl:hidden",
        isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <nav className="flex flex-col items-center justify-center h-full gap-6 p-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={cn(
                "text-2xl font-headline font-black uppercase tracking-tighter",
                pathname === link.href ? "text-[#d97706]" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex flex-col w-full max-w-xs gap-4 mt-8">
            {user ? (
              <Button asChild className="w-full h-14 rounded-full bg-[#d97706] text-white font-black uppercase tracking-widest shadow-2xl">
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full h-14 rounded-full border-white/20 text-white hover:bg-white hover:text-[#1a110a] bg-transparent font-black uppercase tracking-widest transition-all duration-300">
                  <Link href="/login/customer" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button asChild className="w-full h-14 rounded-full bg-[#d97706] text-white font-black uppercase tracking-widest shadow-2xl">
                  <Link href="/signup/customer" onClick={() => setIsMenuOpen(false)}>Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
