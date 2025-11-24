'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

const getDashboardPathForRole = (role: string | undefined) => {
  if (role === 'customer') return '/dashboard';
  if (role === 'staff') return '/dashboard/staff/orders';
  if (role === 'admin') return '/dashboard/admin/menu';
  return '/dashboard'; // Default fallback
};

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Define paths that are publicly accessible and don't require auth.
    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/privacy'];
    const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/login');


    // If initial auth check is happening, wait.
    if (isUserLoading) {
      return;
    }

    if (user) {
      // User is logged in. Fetch their role.
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        const userRole = userDoc.exists() ? userDoc.data().role : undefined;
        const targetDashboard = getDashboardPathForRole(userRole);

        // If user is on their correct dashboard, we're done.
        if (pathname.startsWith(targetDashboard)) {
          setIsReady(true);
          return;
        }

        // If user is on any other page (public or wrong dashboard), redirect them.
        router.replace(targetDashboard);
        // We don't set isReady here because the navigation will trigger a re-render.
      }).catch(() => {
        // Error fetching role, redirect to a safe default and allow render.
         router.replace('/');
      });

    } else {
      // User is not logged in.
      if (isPublicPath) {
        // If on a public page, allow render.
        setIsReady(true);
      } else {
        // If on a protected page, redirect to home.
        router.replace('/');
      }
    }
  }, [user, isUserLoading, router, pathname, firestore]);

  // Only render children when all checks are complete and we are on the correct page.
  if (!isReady) {
    // You can return a loading spinner here for better UX
    return null;
  }

  return <>{children}</>;
}
