'use client';

import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

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
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait until Firebase has determined the initial auth state.
    if (isUserLoading) {
      return;
    }

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (user) {
      // User is logged in. Fetch their role.
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((userDoc) => {
        if (userDoc.exists()) {
          const userRole = userDoc.data()?.role;
          const targetDashboard = getDashboardPathForRole(userRole);

          if (!targetDashboard) {
            // Role is invalid or not found, treat as logged out.
            router.replace('/');
            return;
          }
          
          // If user is on a public page or the wrong dashboard, redirect them.
          if (isPublicPath || !pathname.startsWith(targetDashboard)) {
            router.replace(targetDashboard);
          } else {
            // User is on the correct dashboard page.
            setIsReady(true);
          }
        } else {
          // This can happen briefly after signup before the user doc is created.
          // In this case, we don't do anything and wait for the doc to be created.
          // A more robust solution might involve a loading state here.
          // For now, if the doc is missing for a logged-in user, we log them out.
           router.replace('/');
        }
      }).catch(() => {
        // If fetching the user doc fails, send to home page.
        router.replace('/');
      });

    } else {
      // User is not logged in.
      if (!isPublicPath) {
        // If on a protected page, redirect to home.
        router.replace('/');
      } else {
        // On a public page, allow render.
        setIsReady(true);
      }
    }
  }, [user, isUserLoading, pathname, firestore, router]);

  // Render children only when checks are complete and no redirect is pending.
  if (!isReady) {
    return null; // Or a loading spinner to prevent content flashing
  }

  return <>{children}</>;
}
