'use client';

import { useUser } from '@/lib/auth/provider';
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

      if (targetDashboard) {
        const isAlreadyOnCorrectPath = pathname.startsWith(targetDashboard.split('/').slice(0, 3).join('/'));
        
        if (userRole === 'customer' && pathname === '/dashboard') {
            // Already at the right place
        } else if (!isAlreadyOnCorrectPath) {
          router.replace(targetDashboard);
        }
      } else {
        if (pathname !== '/') {
            router.replace('/');
        }
      }
    } else {
      // User is not logged in.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [user, isLoading, pathname, router]);


  // While authentication is loading, show a spinner.
  if (isLoading) {
    return <FullPageSpinner />;
  }

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // If we are logged in, but on a public path, a redirect is imminent. Show a spinner.
  if (user && isPublicPath) {
    return <FullPageSpinner />;
  }

  // If we are not logged in and on a protected path, a redirect is imminent. Show a spinner.
  if (!user && !isPublicPath) {
    return <FullPageSpinner />;
  }
  
  // Otherwise, we are in the correct state
  return <>{children}</>;
}
