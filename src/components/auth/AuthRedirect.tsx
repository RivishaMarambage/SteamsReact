'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '../Logo';

const getDashboardPathForRole = (role?: string) => {
  switch (role) {
    case 'admin':
      return '/dashboard/admin/menu';
    case 'staff':
      return '/dashboard/staff/orders';
    case 'customer':
      return '/dashboard';
    default:
      return null;
  }
};

const PUBLIC_PATHS = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/signup/admin', '/privacy'];

// A simple loading spinner component
function FullPageSpinner() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <Logo className="mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}


export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If we are still loading authentication state, don't do anything yet.
    if (isLoading) {
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const userRole = userDoc?.role;

    if (user && userDoc) {
      // === USER IS LOGGED IN AND HAS DATA ===
      const targetDashboard = getDashboardPathForRole(userRole);
      
      if (!targetDashboard) {
        // This case should not happen if data is consistent, but as a fallback,
        // send them home if their role doesn't have a defined dashboard.
        if (pathname !== '/') router.replace('/');
        return;
      }
      
      // If the user is on a public page (like /login) or on the wrong dashboard path,
      // redirect them to their correct dashboard.
      const isonCorrectDashboard = pathname.startsWith(targetDashboard.split('/').slice(0,3).join('/'));

      if(isPublicPath || !isonCorrectDashboard) {
        router.replace(targetDashboard);
      }

    } else if (user && !userDoc) {
        // === USER IS LOGGED IN BUT DATA IS MISSING (e.g., during signup process) ===
        // This is a transient state. We wait for the userDoc to be created.
        // We do nothing and let the loading screen show. If it persists, it's an error state.
        // The useUser hook should eventually provide the userDoc.
        return;

    } else {
      // === USER IS LOGGED OUT ===
      // If they are on a protected page, redirect them to the homepage.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [user, userDoc, isLoading, pathname, router]);

  // Determine if we should show the children or the loading screen
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user && !isPublicPath) {
    // Logged out and on a private page, show spinner while redirecting
    return <FullPageSpinner />;
  }

  if (user && userDoc && isPublicPath) {
     // Logged in and on a public page, show spinner while redirecting
     return <FullPageSpinner />;
  }
  
  // In all other valid states (e.g., logged out on public page, logged in on correct private page), render the children.
  return <>{children}</>;
}
