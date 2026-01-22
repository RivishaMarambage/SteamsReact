
'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import PublicMenuDisplay from "@/components/order/PublicMenuDisplay";
import { Logo } from "@/components/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function PublicHeader() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b">
        <Logo />
        <nav className="hidden lg:flex gap-6">
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">Home</Link>
          <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">About</Link>
          <Link href="/rewards" className="text-sm font-medium hover:underline underline-offset-4">Rewards</Link>
          <Link href="/news" className="text-sm font-medium hover:underline underline-offset-4">News</Link>
          <Dialog>
            <DialogTrigger asChild>
              <button className="text-sm font-medium hover:underline underline-offset-4">Menu</button>
            </DialogTrigger>
            <DialogContent className="h-dvh w-screen max-w-full flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="font-headline text-2xl">Our Menu</DialogTitle>
                    <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                        <span className="sr-only">Close</span>
                    </DialogClose>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <PublicMenuDisplay />
                </div>
            </DialogContent>
          </Dialog>
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
