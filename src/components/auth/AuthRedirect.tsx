'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, userDoc, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isRenderable, setIsRenderable] = useState(false);

  useEffect(() => {
    // Wait until the initial loading of user and userDoc is complete.
    if (isLoading) {
      setIsRenderable(false); // Show nothing while loading
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
    const userRole = userDoc?.role;

    if (user && userDoc) {
      // USER IS LOGGED IN AND HAS A DATA DOCUMENT
      const targetDashboard = getDashboardPathForRole(userRole);

      if (!targetDashboard) {
        // Logged in user has an invalid role or doc, send to home
        router.replace('/');
        setIsRenderable(false);
        return;
      }

      // If user is on a public page (like login) or the wrong dashboard, redirect them.
      if (isPublicPath || !pathname.startsWith(targetDashboard.split('/').slice(0, 3).join('/'))) {
        router.replace(targetDashboard);
        setIsRenderable(false);
      } else {
        // User is on a correct, protected page. Allow rendering.
        setIsRenderable(true);
      }
    } else {
      // USER IS NOT LOGGED IN (or userDoc doesn't exist)
      if (!isPublicPath) {
        // If on a protected page, redirect to home.
        router.replace('/');
        setIsRenderable(false);
      } else {
        // User is on a public page. Allow rendering.
        setIsRenderable(true);
      }
    }
  }, [user, userDoc, isLoading, pathname, router]);

  // Render children only when checks are complete and no redirect is pending.
  if (!isRenderable) {
    return null; // Or a global loading spinner
  }

  return <>{children}</>;
}
