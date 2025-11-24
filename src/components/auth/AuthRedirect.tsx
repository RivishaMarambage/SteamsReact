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
    if (isLoading) {
      return; // Wait until Firebase auth state and userDoc are resolved
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const userRole = userDoc?.role;

    if (user && userDoc) {
      // User is logged in and their data (including role) is available
      const targetDashboard = getDashboardPathForRole(userRole);

      if (targetDashboard) {
        // If the user is on a public page or not on a path for their role, redirect them.
        const isAlreadyOnCorrectPath = pathname.startsWith(targetDashboard.split('/').slice(0, 3).join('/'));
        if (!isAlreadyOnCorrectPath) {
          router.replace(targetDashboard);
        }
      } else {
        // Logged-in user has an invalid role or no dashboard mapping. Send to home.
        if (pathname !== '/') {
            router.replace('/');
        }
      }
    } else {
      // User is not logged in.
      // If they are on a protected page, redirect them to the homepage.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [user, userDoc, isLoading, pathname, router]);


  if (isLoading) {
    return <FullPageSpinner />;
  }

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // If we are logged in, but on a public path, we are about to redirect. Show a spinner.
  if (user && userDoc && isPublicPath) {
    return <FullPageSpinner />;
  }

  // If we are not logged in and on a protected path, we are about to redirect. Show a spinner.
  if (!user && !isPublicPath) {
    return <FullPageSpinner />;
  }
  
  // Otherwise, we are in the correct state (e.g., logged in on a protected page, or logged out on a public one).
  return <>{children}</>;
}
