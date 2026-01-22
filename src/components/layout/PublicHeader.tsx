
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
  );
}
