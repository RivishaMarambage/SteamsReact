
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { useDoc, useUser, useMemoFirebase } from "@/firebase";
import { doc, DocumentData } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomerProfile } from "@/lib/types";

export default function ProfilePage() {
  const { user, userDoc: authUserDoc, isLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (user?.uid) {
      return doc(firestore, "customer_profiles", user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: profile, isLoading: isProfileLoading } = useDoc<CustomerProfile>(profileRef);

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/5" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user || !profile) {
    return <p>Could not load user profile. Please try again.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Keep your details up to date.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm userProfile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
