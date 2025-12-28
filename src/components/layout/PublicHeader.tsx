'use client';

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import PublicMenuDisplay from "@/components/order/PublicMenuDisplay";
import { Logo } from "@/components/Logo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col min-h-dvh">
       <header className="px-4 lg:px-6 h-16 flex items-center justify-between fixed top-0 left-0 right-0 z-20 transition-colors duration-300 bg-transparent text-white">
        <Logo />
        <nav className="hidden lg:flex gap-6">
          <Link href="/" className="text-sm font-medium hover:underline underline-offset-4">Home</Link>
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
              <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 hover:text-white">Log In</Button>
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
              Join our loyalty program. Earn points, get rewards, and enjoy exclusive perks with every sip and bite.
            </p>
            <div className="mt-8 flex justify-center gap-4">
                <Dialog>
                    <DialogTrigger asChild>
                         <Button size="lg" variant="secondary">View Menu</Button>
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
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup/customer">Become a Member</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/signup/customer">Our Offers</Link>
              </Button>
              
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}