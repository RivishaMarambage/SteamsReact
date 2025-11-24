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
      return '/'; // Fallback to landing page
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
    // Wait until Firebase has determined the initial auth state
    if (isUserLoading) {
      return;
    }

    const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (user) {
      // User is logged in
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then((userDoc) => {
        if (userDoc.exists()) {
          const userRole = userDoc.data()?.role;
          const targetDashboard = getDashboardPathForRole(userRole);

          // If user is on a public page, redirect them to their dashboard
          if (isPublic) {
            router.replace(targetDashboard);
            // Don't set isReady, as a redirect is happening
            return;
          }

          // If user is on a protected page, check if it's the correct one
          if (pathname.startsWith(getDashboardPathForRole(userRole))) {
            setIsReady(true); // Correct page, allow render
          } else {
            router.replace(targetDashboard); // Wrong page, redirect
          }
        } else {
          // This can happen briefly after signup.
          // Or if the user doc was deleted. For safety, send to home.
          // The next navigation or a reload will likely resolve if it was a race condition.
          router.replace('/');
        }
      }).catch(() => {
        // If fetching the doc fails, log out and go home
        router.replace('/');
      });

    } else {
      // User is not logged in
      if (!isPublic) {
        // If on a protected page, redirect to home
        router.replace('/');
      } else {
        // On a public page, allow render
        setIsReady(true);
      }
    }
  }, [user, isUserLoading, pathname, firestore, router]);

  // Only render children when all checks are complete and no redirect is pending
  if (!isReady) {
    return null; // Render nothing (or a loader) to prevent content flashing
  }

  return <>{children}</>;
}
