'use client';

import { useUser } from '@/lib/auth/provider';
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
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path) || pathname === '/');

  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth state is resolved
    }

    if (user) {
      // User is logged in.
      // If they are on a public path, redirect them to their dashboard.
      if (isPublicPath) {
        const targetDashboard = getDashboardPathForRole(user.role);
        router.replace(targetDashboard);
      }
    } else {
      // User is not logged in.
      // If they are on a protected path, redirect to home.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [user, isLoading, pathname, router, isPublicPath]);
  
  // Show a spinner if we are still loading, or if a redirect is imminent.
  if (isLoading || (!user && !isPublicPath) || (user && isPublicPath)) {
    return <FullPageSpinner />;
  }

  return <>{children}</>;
}
