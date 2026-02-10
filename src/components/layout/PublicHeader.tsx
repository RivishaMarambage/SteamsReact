'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Menu, X, ShoppingCart, Tag, LayoutDashboard, LogIn } from "lucide-react";
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
                "text-sm font-medium transition-colors hover:text-accent tracking-tight uppercase",
                pathname === link.href ? "text-accent" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4">
          <nav className="hidden md:flex items-center gap-3">
            <Button asChild variant="outline" className="hidden lg:flex rounded-md px-4 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
              <Link href="/menu" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" /> View Menu
              </Link>
            </Button>
            <Button asChild variant="outline" className="hidden lg:flex rounded-md px-4 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white">
              <Link href="/offers" className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> View Offers
              </Link>
            </Button>
            
            {user ? (
              <Button asChild className="rounded-md px-6 bg-[#d97706] hover:bg-[#b45309] text-white">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
              </Button>
            ) : (
              <Button asChild className="rounded-md px-6 bg-[#d97706] hover:bg-[#b45309] text-white">
                <Link href="/login/customer" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Sign In
                </Link>
              </Button>
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
                "text-2xl font-headline font-bold uppercase tracking-tighter",
                pathname === link.href ? "text-[#d97706]" : "text-white/70"
              )}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="flex flex-col w-full max-w-xs gap-4 mt-8">
            <Button asChild variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white bg-transparent">
              <Link href="/menu" onClick={() => setIsMenuOpen(false)}>View Menu</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-12 rounded-xl border-white/20 text-white bg-transparent">
              <Link href="/offers" onClick={() => setIsMenuOpen(false)}>View Offers</Link>
            </Button>
            <Button asChild className="w-full h-12 rounded-xl bg-[#d97706] text-white">
              <Link href={user ? "/dashboard" : "/login/customer"} onClick={() => setIsMenuOpen(false)}>
                {user ? "Dashboard" : "Sign In"}
              </Link>
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
