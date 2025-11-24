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
    // Wait until the authentication status and user data are fully resolved.
    if (isLoading) {
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const userRole = userDoc?.role;

    if (user && userDoc) {
      // User is logged in and their data (including role) is available.
      const targetDashboard = getDashboardPathForRole(userRole);

      if (targetDashboard) {
        // If the user is on a public page or not on their correct dashboard path, redirect them.
        const isOnCorrectDashboard = pathname.startsWith(targetDashboard.split('/').slice(0, 3).join('/'));
        if (isPublicPath || !isOnCorrectDashboard) {
          router.replace(targetDashboard);
        }
      } else {
        // Fallback for an unknown role. This should not happen with correct data.
        if (pathname !== '/') {
            router.replace('/');
        }
      }
    } else {
      // User is not logged in, or their data is missing (which is treated as not logged in).
      // If they are on a protected page, redirect them to the homepage.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [user, userDoc, isLoading, pathname, router]);

  // --- Render Logic ---

  if (isLoading) {
    // Always show a spinner while authentication state is being determined.
    return <FullPageSpinner />;
  }

  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  if (user && userDoc) {
    // Logged in user: if they are on a public path, they are about to be redirected.
    // Show a spinner to prevent the public page from flashing.
    if (isPublicPath) {
      return <FullPageSpinner />;
    }
    // Otherwise, they are on a valid, protected page. Render the content.
    return <>{children}</>;
  } else {
    // Logged out user: if they are on a protected path, they are about to be redirected.
    // Show a spinner.
    if (!isPublicPath) {
      return <FullPageSpinner />;
    }
    // Otherwise, they are on a public page. Render the content.
    return <>{children}</>;
  }
}
