'use client';

import { useUser, useDoc, useFirestore } from '@/firebase';
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

  const isPublicPath = PUBLIC_PATHS.some(p => p === pathname);
  const isLoading = isUserLoading || (authUser && isProfileLoading);

  useEffect(() => {
    if (isLoading) {
      return; // Wait until loading is complete
    }

    if (authUser && userProfile) {
      // User is logged in and has a profile
      const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');
      if (isAuthPage || pathname === '/') {
        const targetDashboard = getDashboardPathForRole(userProfile.role);
        router.replace(targetDashboard);
      }
    } else if (!authUser) {
      // User is not logged in
      if (!isPublicPath) {
        router.replace('/'); // Redirect to home if on a protected page
      }
    }
  }, [authUser, userProfile, isLoading, pathname, router, isPublicPath]);
  
  // While loading, show a spinner.
  if (isLoading) {
      return <FullPageSpinner />;
  }

  // If user is logged in, but trying to access a public path like login, show spinner until redirect happens.
  if(authUser && userProfile && (isPublicPath || pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    return <FullPageSpinner />;
  }
  
  // If user is not logged in and not on a public path, show spinner until redirect happens.
  if (!authUser && !isPublicPath) {
     return <FullPageSpinner />;
  }


  // Otherwise, render the children (the requested page)
  return <>{children}</>;
}
