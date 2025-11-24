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

    if (user) {
      // User is logged in.
      const targetDashboard = getDashboardPathForRole(user.role);
      
      // If user is on a public path (like /login), redirect them to their dashboard.
      if (isPublicPath) {
        router.replace(targetDashboard);
        return;
      }

      // This logic is primarily for users who land on a protected page directly.
      const isCorrectAdminPath = user.role === 'admin' && pathname.startsWith('/dashboard/admin');
      const isCorrectStaffPath = user.role === 'staff' && pathname.startsWith('/dashboard/staff');
      const isCorrectCustomerPath = user.role === 'customer' && !pathname.startsWith('/dashboard/admin') && !pathname.startsWith('/dashboard/staff');

      const isOnCorrectPath = isCorrectAdminPath || isCorrectStaffPath || isCorrectCustomerPath;
      
      if (!isOnCorrectPath && pathname.startsWith('/dashboard')) {
        // If on the wrong dashboard (e.g. staff on admin page), redirect to correct one.
        router.replace(targetDashboard);
      }
      
    } else {
      // User is not logged in.
      if (!isPublicPath) {
        // If on a protected path without a user, redirect to home.
        router.replace('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  // Show a spinner if authentication is loading or if a redirect is imminent.
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  if (isLoading || (user && isPublicPath) || (!user && !isPublicPath)) {
    return <FullPageSpinner />;
  }
  
  // Otherwise, we are in the correct state (e.g., logged out on public page, or logged in on correct protected page)
  return <>{children}</>;
}
