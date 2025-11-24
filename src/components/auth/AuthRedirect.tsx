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
  return '/'; // Fallback to home if role is unknown or user is logged out
};

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/signup/admin', '/privacy'];
    const isPublicPath = publicPaths.includes(pathname);

    if (isUserLoading) {
      // Still waiting for Firebase to determine if a user is logged in.
      return;
    }

    if (user) {
      // User is logged in, now we need their role.
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        const userRole = userDoc.exists() ? userDoc.data().role : undefined;
        const targetDashboard = getDashboardPathForRole(userRole);

        // If the user is on a login/signup/home page, redirect them to their dashboard.
        if (isPublicPath) {
          router.replace(targetDashboard);
          return; // Redirect is happening, don't render children yet.
        }

        // User is on a protected page. Check if it's the right one.
        // A simple `startsWith` is sufficient here.
        if (pathname.startsWith(targetDashboard)) {
          // Correct page for their role, show the content.
          setIsReady(true);
        } else {
          // Wrong page for their role, redirect them.
          router.replace(targetDashboard);
        }
      }).catch(error => {
        console.error("Error fetching user document:", error);
        // If we can't get the user doc, something is very wrong. Log them out.
        // For now, redirect to home to prevent getting stuck.
        router.replace('/');
      });
    } else {
      // User is not logged in.
      if (isPublicPath) {
        // They are on a public page, which is fine.
        setIsReady(true);
      } else {
        // They are on a protected page without being logged in. Redirect to home.
        router.replace('/');
      }
    }
  }, [user, isUserLoading, router, pathname, firestore]);

  // Only render children when all checks are complete.
  // This prevents flashing of content or rendering the wrong page.
  if (!isReady) {
    // You can return a loading spinner here for better UX
    return null;
  }

  return <>{children}</>;
}
