
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PublicHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
        <Logo />
        <nav className="hidden lg:flex gap-6">
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">Home</Link>
          <Link href="/menu" className="text-sm font-medium hover:underline underline-offset-4">Menu</Link>
          <Link href="/rewards" className="text-sm font-medium hover:underline underline-offset-4">Rewards</Link>
          <Link href="/offers" className="text-sm font-medium hover:underline underline-offset-4">Offers</Link>
          <Link href="/updates" className="text-sm font-medium hover:underline underline-offset-4">Updates</Link>
          <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">About Us</Link>
        </nav>
        <nav className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Log In</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild><Link href="/login/customer">Customer Login</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/login/staff">Staff Login</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/login/admin">Admin Login</Link></DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/signup/customer">Sign Up</Link>
          </Button>
        </nav>
    </header>
  );
}
