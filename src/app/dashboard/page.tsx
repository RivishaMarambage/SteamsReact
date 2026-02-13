
'use client';

import LoyaltyStatus from "@/components/dashboard/LoyaltyStatus";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon, Sparkles, MailWarning, Percent, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import BirthdayReward from "@/components/dashboard/BirthdayReward";
import DailyOffersPreview from "@/components/dashboard/DailyOffersPreview";
import type { UserProfile } from "@/lib/types";
import { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDashboardPathForRole } from "@/lib/auth/paths";

const WELCOME_OFFERS = [
    { order: 0, discount: 10, label: "First Order Reward" },
    { order: 1, discount: 5, label: "Second Order Reward" },
    { order: 2, discount: 15, label: "Third Order Reward" },
];

export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const userRef = useMemoFirebase(() => authUser ? doc(firestore, "users", authUser.uid) : null, [authUser, firestore]);
  const { data: user, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  // REDIRECT LOGIC: Ensure non-customers land on their appropriate dashboards
  useEffect(() => {
    if (user && user.role !== 'customer') {
      router.replace(getDashboardPathForRole(user.role));
    }
  }, [user, router]);

  const isLoading = isUserLoading || isProfileLoading;

  const currentWelcomeOffer = useMemo(() => {
    if (!user || (user.orderCount ?? 0) >= 3) return null;
    return WELCOME_OFFERS.find(o => o.order === (user.orderCount ?? 0));
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-4 w-1/3 mt-2" />
        </div>
        <div className="grid gap-8">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'customer') {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="bg-muted p-6 rounded-full mb-4">
          <UserIcon className="size-12 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-bold">Redirecting...</h2>
        <p className="text-muted-foreground max-sm mb-6">Navigating to your portal.</p>
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-headline tracking-tight text-[#2c1810]">
            Welcome back, <span className="text-[#d97706]">{user.name?.split(' ')[0]}</span>! 👋
            </h1>
            <p className="text-[#6b584b] text-base sm:text-lg mt-2 font-medium">Your daily brew and rewards are waiting.</p>
        </div>
        
        {currentWelcomeOffer && (
            <Card className="bg-blue-600 text-white border-0 shadow-lg px-6 py-4 rounded-3xl animate-in slide-in-from-right-4 duration-1000">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-2 rounded-2xl">
                        <Percent className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{currentWelcomeOffer.label}</p>
                        <p className="text-xl font-headline font-black">{currentWelcomeOffer.discount}% OFF YOUR NEXT CUP</p>
                    </div>
                </div>
            </Card>
        )}
      </div>

      <div className="grid gap-6 md:gap-8">
        {!user.emailVerified && currentWelcomeOffer && (
            <Card className="border-2 border-dashed border-amber-200 bg-amber-50 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center sm:text-left">
                        <div className="bg-amber-100 p-4 rounded-full">
                            <MailWarning className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black font-headline text-amber-800 uppercase">Unlock Your {currentWelcomeOffer.discount}% Discount</h3>
                            <p className="text-amber-700/80 text-sm font-medium">Verify your email to activate your welcome rewards!</p>
                        </div>
                    </div>
                    <Button asChild size="lg" className="rounded-full bg-amber-600 hover:bg-amber-700 text-white border-none shadow-md whitespace-nowrap">
                        <Link href="/dashboard/profile">Verify Now <ArrowRight className="ml-2 w-4 h-4"/></Link>
                    </Button>
                </CardContent>
            </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
            <BirthdayReward user={user} />
            <DailyOffersPreview userProfile={user} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-md border-0 bg-white group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl text-[#2c1810]">Order Again</CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Ready for another coffee?</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <Button asChild className="w-full bg-[#2c1810] hover:bg-[#d97706] text-white rounded-lg h-12 font-bold transition-colors">
                <Link href="/dashboard/order" className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" /> Start Order
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-gradient-to-br from-[#d97706]/10 to-[#f59e0b]/5 group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl flex items-center gap-2 text-[#d97706]">
                Create Own <Sparkles className="w-5 h-5" />
              </CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Build your perfect custom drink.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <Button asChild className="w-full bg-[#d97706] hover:bg-[#b45309] text-white rounded-lg h-12 font-bold transition-colors">
                <Link href="/dashboard/creator" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Build a Drink
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 bg-white group hover:shadow-lg transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <CardHeader className="p-6">
              <CardTitle className="font-headline text-xl text-[#2c1810]">My Profile</CardTitle>
              <CardDescription className="text-[#6b584b] text-sm">Keep your details up to date.</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-6">
              <Button asChild variant="outline" className="w-full border-2 border-[#2c1810]/10 hover:border-[#d97706] text-[#2c1810] hover:text-[#d97706] rounded-lg h-12 font-bold transition-colors">
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
