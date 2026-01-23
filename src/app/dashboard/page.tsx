

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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's a look at your loyalty journey with us.</p>
      </div>

      <div className="grid gap-8">
        <BirthdayReward user={user} />
        <DailyOffersPreview userProfile={user} />
        <div className="grid md:grid-cols-3 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Order Again</CardTitle>
                    <CardDescription>Ready for another coffee? Your usual is just a click away.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/dashboard/order"><ShoppingCart /> Start New Order</Link>
                    </Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Create Your Own</CardTitle>
                    <CardDescription>Feeling creative? Build your perfect custom drink from scratch.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/dashboard/creator"><Sparkles /> Build a Drink</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Keep your details and preferences up to date.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Button asChild variant="secondary" className="w-full sm:w-auto">
                        <Link href="/dashboard/profile"><UserIcon /> View Profile</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
        <LoyaltyStatus user={user} />
        <RecentOrders userId={user.id} />
      </div>
    </div>
  );
}
