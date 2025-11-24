'use client';

import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const firestore = useFirestore();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user auth state is resolved

    const publicPaths = ['/', '/login/customer', '/login/staff', '/login/admin', '/signup/customer'];
    const isPublicPath = publicPaths.includes(pathname);

    if (user) {
        getDoc(doc(firestore, 'users', user.uid)).then(userDoc => {
            if (userDoc.exists()) {
                const userRole = userDoc.data().role;
                const targetDashboard = `/dashboard/${userRole === 'customer' ? '' : userRole}`;

                if(isPublicPath || !pathname.startsWith('/dashboard')) {
                   router.replace(targetDashboard.replace(/\/$/, ''));
                } else if (!pathname.startsWith(targetDashboard)) {
                    // Logged in user trying to access wrong dashboard
                    router.replace(targetDashboard.replace(/\/$/, ''));
                }

            } else {
                // User document not found, maybe new user. Stay put or redirect to profile creation.
                // For now, if on a public page, let's redirect to dashboard as a default.
                if(isPublicPath) {
                    router.replace('/dashboard');
                }
            }
        });

    } else if (!isPublicPath) {
        // Not logged in and not on a public path, redirect to landing
        router.replace('/');
    }

  }, [user, isUserLoading, router, pathname, firestore]);

  return <>{children}</>;
}
