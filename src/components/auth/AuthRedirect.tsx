'use client';

import { useUser, useDoc, useFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '../Logo';
import { getDashboardPathForRole, PUBLIC_PATHS } from '@/lib/auth/paths';
import { doc } from 'firebase/firestore';


function FullPageSpinner() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
      <Logo className="mb-4" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  );
}

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user: authUser, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const userDocRef = authUser ? doc(firestore, 'users', authUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef);
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.some(path => path === pathname || (path.endsWith('/') && pathname.startsWith(path)));

  useEffect(() => {
    if (isUserLoading || isProfileLoading) {
      return; // Wait until auth state and profile are resolved
    }

    if (authUser && userProfile) {
      // User is logged in.
      if (isPublicPath) {
        const targetDashboard = getDashboardPathForRole(userProfile.role);
        router.replace(targetDashboard);
      }
    } else {
      // User is not logged in.
      if (!isPublicPath) {
        router.replace('/');
      }
    }
  }, [authUser, userProfile, isUserLoading, isProfileLoading, pathname, router, isPublicPath]);
  
  const isLoading = isUserLoading || isProfileLoading;
  
  // While authentication is loading, or if a redirect is imminent, show the spinner.
  if (isLoading || (authUser && isPublicPath) || (!authUser && !isPublicPath)) {
    return <FullPageSpinner />;
  }

  // Otherwise, render the children (the requested page)
  return <>{children}</>;
}
