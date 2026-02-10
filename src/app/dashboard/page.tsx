'use client';

import LoyaltyStatus from "@/components/dashboard/LoyaltyStatus";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, Sparkles } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import BirthdayReward from "@/components/dashboard/BirthdayReward";
import DailyOffersPreview from "@/components/dashboard/DailyOffersPreview";
import type { UserProfile } from "@/lib/types";

export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, "users", authUser.uid) : null, [authUser, firestore]);
  const { data: user, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </div>
        <div className="grid gap-8">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <p>Please log in to view your dashboard.</p>;
  }

  return (
    <div className="space-y-6 md:space-y-10">
      <div className="animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-[#2c1810]">
          Welcome back, <span className="text-[#d97706]">{user.name?.split(' ')[0]}</span>! <span className="inline-block animate-bounce origin-bottom-right">👋</span>
        </h1>
        <p className="text-[#6b584b] text-base sm:text-lg mt-2 font-medium">Your daily brew and rewards are ready.</p>
      </div>

      <div className="grid gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        <div className="grid grid-cols-1 gap-6">
            <BirthdayReward user={user} />
            <DailyOffersPreview userProfile={user} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-lg border-0 bg-white group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-[#d97706] -rotate-12" />
            </div>
            <CardHeader className="relative z-10 p-6">
              <CardTitle className="font-headline text-xl text-[#2c1810]">Order Again</CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Ready for another coffee?</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0 p-6">
              <Button asChild className="w-full bg-[#2c1810] hover:bg-[#d97706] text-white rounded-full h-12 font-bold shadow-md transition-all duration-300">
                <Link href="/dashboard/order" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Start New Order
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-[#d97706]/10 to-[#f59e0b]/5 group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#d97706]/10 rounded-full blur-2xl group-hover:bg-[#d97706]/20 transition-all duration-300" />
            <CardHeader className="relative z-10 p-6">
              <CardTitle className="font-headline text-xl flex items-center gap-2 text-[#d97706]">
                Create Own <Sparkles className="w-5 h-5 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Build your perfect custom drink.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0 p-6">
              <Button asChild className="w-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] hover:from-[#b45309] hover:to-[#d97706] text-white border-none rounded-full h-12 font-bold shadow-md transition-all duration-300">
                <Link href="/dashboard/creator" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Build a Drink
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden sm:col-span-2 lg:col-span-1">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl text-[#2c1810]">Your Profile</CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Update your details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <Button asChild variant="outline" className="w-full border-2 border-[#2c1810]/10 hover:border-[#d97706] hover:bg-[#d97706]/5 text-[#2c1810] hover:text-[#d97706] rounded-full h-12 font-bold transition-all duration-300">
                <Link href="/dashboard/profile" className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> View Profile
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:gap-8">
          <LoyaltyStatus user={user} />
          <RecentOrders userId={user.id} />
        </div>
      </div>
    </div>
  );
}