'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const getDashboardPathForRole = (role?: string) => {
  switch (role) {
    case 'admin':
      return '/dashboard/admin/menu';
    case 'staff':
      return '/dashboard/staff/orders';
    case 'customer':
      return '/dashboard';
    default:
      return '/'; // Fallback to landing page if no role or unknown role
  }
};

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If Firebase is still checking auth state, do nothing.
    if (isUserLoading) {
      return;
    }

    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/signup/admin', '/privacy'];
    const isPublicPath = publicPaths.includes(pathname);

    if (user) {
      // User is logged in. Fetch their role from Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((userDoc) => {
        const userRole = userDoc.exists() ? userDoc.data()?.role : undefined;
        const targetDashboard = getDashboardPathForRole(userRole);

        if (isPublicPath) {
          // If on a public page, redirect to their dashboard.
          router.replace(targetDashboard);
        } else if (pathname.startsWith(targetDashboard) && targetDashboard !== '/') {
          // They are on the correct dashboard page, allow render.
          setIsReady(true);
        } else {
          // They are logged in but on the wrong page (or role is missing), redirect.
          router.replace(targetDashboard);
        }
      }).catch(error => {
        console.error("Error fetching user document for redirection:", error);
        // If we can't get the user doc, log them out to be safe.
        router.replace('/');
      });

    } else {
      // User is not logged in.
      if (isPublicPath) {
        // Allow access to public pages.
        setIsReady(true);
      } else {
        // On a protected page without being logged in, redirect to home.
        router.replace('/');
      }
    }
  }, [user, isUserLoading, pathname, firestore, router]);

  // Render a loading state or nothing until checks are complete.
  // This prevents content flashing.
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
