'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

// Helper function to get the base dashboard path for a given role.
const getDashboardPathForRole = (role: string | undefined) => {
  if (!role) return '/dashboard';
  if (role === 'customer') return '/dashboard';
  return `/dashboard/${role}`;
};

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    // Wait until both Firebase auth state and the user's role have been checked.
    if (isUserLoading) {
      return;
    }
    
    // Define paths that are publicly accessible.
    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer', '/privacy'];

    if (user) {
      // User is authenticated, check their role from Firestore.
      const userDocRef = doc(firestore, 'users', user.uid);
      getDoc(userDocRef).then(userDoc => {
        const userRole = userDoc.exists() ? userDoc.data().role : undefined;
        const targetDashboard = getDashboardPathForRole(userRole);
        
        // Redirect from a public page to the correct dashboard.
        if (publicPaths.includes(pathname)) {
          router.replace(targetDashboard);
        }
        // If on a dashboard page that doesn't match the user's role, redirect them.
        else if (pathname.startsWith('/dashboard') && !pathname.startsWith(targetDashboard)) {
          router.replace(targetDashboard);
        }
        setIsCheckingRole(false);
      });
    } else {
      // User is not authenticated.
      // If they are on a protected page, redirect them to the landing page.
      if (!publicPaths.includes(pathname)) {
        router.replace('/');
      }
      setIsCheckingRole(false);
    }
  }, [user, isUserLoading, router, pathname, firestore]);
  
  // While checking auth state or role, don't render the children to avoid flashes of incorrect content.
  if (isUserLoading || isCheckingRole) {
    return null; 
  }

  return <>{children}</>;
}
