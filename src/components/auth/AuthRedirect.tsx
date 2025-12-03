'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '../Logo';
import { getDashboardPathForRole, PUBLIC_PATHS } from '@/lib/auth/paths';


function FullPageSpinner() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <Logo className="mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until loading is complete
    }

    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

    if (authUser) {
      // User is logged in.
      // If they are on a public-only page (like landing or login), redirect them to their dashboard.
      if (isAuthPage || pathname === '/') {
        // We don't know the role here, so we redirect to the base dashboard.
        // The dashboard or sidebar can then handle role-specific views.
        router.replace('/dashboard');
      }
    } else {
      // User is not logged in.
      // If they are on a protected page, redirect to the landing page.
      if (!isPublicPath) {
        router.replace('/'); 
      }
    }
  }, [authUser, isUserLoading, pathname, router, isPublicPath]);
  
  // While loading, or if a redirect is pending, show a spinner.
  if (isUserLoading || (!authUser && !isPublicPath) || (authUser && (pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname === '/'))) {
      return <FullPageSpinner />;
  }

  // Otherwise, render the children (the requested page)
  return <>{children}</>;
}
