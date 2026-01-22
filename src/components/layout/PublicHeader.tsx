'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Menu } from "lucide-react";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="hidden lg:flex items-center gap-2 sm:gap-4">
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/login/customer">Sign In</Link>
          </Button>
          <Button asChild variant="outline" className="bg-primary-foreground border-accent text-accent hover:bg-primary-foreground/90">
            <Link href="/signup/customer">Sign Up</Link>
          </Button>
        </div>
        <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="bg-[#211811] text-primary-foreground border-sidebar-border w-full max-w-xs sm:max-w-sm">
                    <div className="p-4">
                        <Logo />
                    </div>
                    <nav className="grid gap-4 p-4 text-lg font-medium">
                        {navLinks.map(link => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "hover:text-accent transition-colors",
                                    pathname === link.href ? "text-accent" : ""
                                )}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="absolute bottom-8 left-8 right-8 flex flex-col gap-4">
                        <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                            <Link href="/login/customer" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                        </Button>
                        <Button asChild variant="outline" className="bg-primary-foreground border-accent text-accent hover:bg-primary-foreground/90">
                            <Link href="/signup/customer" onClick={() => setIsMobileMenuOpen(false)}>Sign Up</Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    </header>
  );
}
