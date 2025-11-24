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
    // Define paths that are publicly accessible and don't require auth.
    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/privacy', '/signup/admin'];
    const isPublicPath = publicPaths.includes(pathname);

    // If Firebase is still checking the user's auth state, wait.
    if (isUserLoading) {
      return;
    }

    // If the user is logged in
    if (user) {
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        const userRole = userDoc.exists() ? userDoc.data().role : undefined;
        const targetDashboard = getDashboardPathForRole(userRole);

        // If user is on a public page (like login), redirect them to their dashboard.
        if (isPublicPath) {
          router.replace(targetDashboard);
          // Don't set isReady yet, the redirect will trigger a re-render.
          return;
        }

        // If user is on a protected page, but it's not the correct one for their role, redirect them.
        // Example: a customer trying to access /dashboard/admin/menu
        if (!pathname.startsWith(targetDashboard) && targetDashboard !== '/') {
           router.replace(targetDashboard);
           return;
        }

        // If user is on the correct page, we can show the content.
        setIsReady(true);
      }).catch((error) => {
        console.error("Error fetching user role, logging out.", error);
        // If we can't get the user doc, something is wrong. Log them out.
        // (This assumes you have a signOut function available)
        // For now, redirect to home and allow render.
        router.replace('/');
        setIsReady(true);
      });
    } else { // User is not logged in
      // If they are on a public page, it's fine. Show the content.
      if (isPublicPath) {
        setIsReady(true);
      } else {
        // If they are on a protected page, redirect to home.
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
