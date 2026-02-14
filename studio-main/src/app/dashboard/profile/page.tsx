'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export default function ProfilePage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, "users", authUser.uid) : null, [authUser, firestore]);
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
    <div className="relative space-y-8 min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#f2efe9] to-[#FDFBF7] p-6 lg:p-10 transition-colors duration-500 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#d97706]/10 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#2c1810]/5 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#d97706]/5 to-[#2c1810]/5 rounded-full blur-[150px] animate-pulse delay-500"></div>

      {/* Animated Dots Pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#2c1810 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="relative z-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="relative inline-block">
          <h1 className="text-4xl lg:text-5xl font-black font-headline tracking-tight bg-gradient-to-r from-[#2c1810] via-[#d97706] to-[#2c1810] bg-clip-text text-transparent animate-gradient">
            My Profile
          </h1>
          {/* Animated Underline */}
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#d97706] to-transparent rounded-full animate-pulse"></div>
        </div>
        <p className="text-[#6b584b] text-lg mt-4 font-medium">Manage your personal information and preferences.</p>
      </div>

      <div className="relative group animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {/* Gradient Border Effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-[#d97706] via-[#2c1810] to-[#d97706] rounded-[1.6rem] opacity-0 group-hover:opacity-100 transition-all duration-700 blur-sm group-hover:blur-md animate-gradient"></div>

        <Card className="relative shadow-2xl border-0 bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-[0_20px_80px_rgba(217,119,6,0.2)] hover:-translate-y-1">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>

          <CardHeader className="border-b border-[#2c1810]/5 pb-6 bg-gradient-to-r from-[#FDFBF7]/50 to-[#f2efe9]/50">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 bg-gradient-to-b from-[#d97706] to-[#2c1810] rounded-full animate-pulse"></div>
              <CardTitle className="font-headline text-2xl bg-gradient-to-r from-[#2c1810] to-[#6b584b] bg-clip-text text-transparent">Personal Information</CardTitle>
            </div>
            <CardDescription className="text-[#6b584b] ml-5">Keep your details up to date.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 relative">
            <ProfileForm userProfile={userProfile} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
