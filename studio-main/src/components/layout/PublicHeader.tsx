
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PublicHeader() {
  const pathname = usePathname();
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/menu", label: "Menu" },
    { href: "/updates", label: "Updates" },
    { href: "/rewards", label: "Rewards" },
    { href: "/offers", label: "Offers" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="px-4 lg:px-6 h-20 flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-[#1a110a]/90 backdrop-blur-md text-primary-foreground border-b border-white/5 shadow-md">
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
      <nav className="flex items-center gap-4">
        <Button asChild className="rounded-full px-6 bg-[#d97706] hover:bg-[#b45309] text-white border-none transition-transform hover:scale-105">
          <Link href="/login/customer">Sign In</Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full px-6 bg-white text-black border-none hover:bg-white/90 transition-transform hover:scale-105">
          <Link href="/signup/customer">Sign Up</Link>
        </Button>
      </nav>
    </header>
  );
}
