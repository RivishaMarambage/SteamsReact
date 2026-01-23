'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import Link from 'next/link';

export default function Home() {
  const auth = useAuth();
  const handleSignOut = () => {
    if (auth) {
      auth.signOut();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-center text-center">
         <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
          Welcome To Steamsburry
        </h1>
        <p className="mt-4 text-muted-foreground">Your daily dose of delight.</p>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/menu">
            <Button>View Menu</Button>
        </Link>
         <Link href="/signup/customer">
            <Button variant="secondary">Sign Up</Button>
        </Link>
        <Link href="/login/customer">
          <Button>Customer Login</Button>
        </Link>
      </div>
    </main>
  );
}
