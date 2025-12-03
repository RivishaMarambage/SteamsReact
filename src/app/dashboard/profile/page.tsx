'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useDoc } from "@/firebase";
import { doc, getFirestore } from "firebase/firestore";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = getFirestore();
  const userRef = authUser ? doc(firestore, "users", authUser.uid) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userRef);

  const isLoading = isUserLoading || isProfileLoading;

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

  if (!userProfile) {
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
          <ProfileForm userProfile={userProfile} />
        </CardContent>
      </Card>
    </div>
  );
}
