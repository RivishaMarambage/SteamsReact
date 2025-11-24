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

  useEffect(() => {
    if (isLoading) {
      return; // Wait until auth state is resolved
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const userRole = user?.role;

    if (user) {
      // User is logged in
      const targetDashboard = getDashboardPathForRole(userRole);

      // This logic is primarily for users who land on a protected page directly.
      // The AuthForm now handles the initial redirect after login.
      if (targetDashboard) {
        const isAlreadyOnCorrectPath = pathname.startsWith(targetDashboard.split('/').slice(0, 3).join('/'));
        
        if (userRole === 'customer' && pathname === '/dashboard') {
            // Already at the right place
        } else if (!isAlreadyOnCorrectPath && pathname.startsWith('/dashboard')) {
          router.replace(targetDashboard);
        }
      }
    } else {
      // User is not logged in.
      if (!isPublicPath) {
        // If on a protected path without a user, redirect to home.
        router.replace('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  // While authentication is loading, show a spinner.
  if (isLoading) {
    return <FullPageSpinner />;
  }

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // If we are logged in, but on a public path (like the login page after a refresh),
  // a redirect is imminent. Show a spinner to prevent flashing the public page.
  if (user && isPublicPath) {
    // We also need to redirect from here if the user lands on a public page while logged in.
    const targetDashboard = getDashboardPathForRole(user.role);
    router.replace(targetDashboard);
    return <FullPageSpinner />;
  }

  // If we are not logged in and on a protected path, a redirect is imminent. Show a spinner.
  if (!user && !isPublicPath) {
    return <FullPageSpinner />;
  }
  
  // Otherwise, we are in the correct state (e.g., logged out on public page, or logged in on protected page)
  return <>{children}</>;
}
