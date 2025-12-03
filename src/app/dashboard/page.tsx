'use client';

import LoyaltyStatus from "@/components/dashboard/LoyaltyStatus";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, User as UserIcon } from "lucide-react";
import { useDoc } from "@/firebase";
import { doc, getFirestore } from "firebase/firestore";

export default function DashboardPage() {
  const { user: authUser, isUserLoading } = useUser();
  const firestore = getFirestore();
  const userRef = authUser ? doc(firestore, "users", authUser.uid) : null;
  const { data: user, isLoading: isProfileLoading } = useDoc(userRef);

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
        <h1 className="text-3xl font-bold font-headline">Welcome back, {user.name?.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's a look at your loyalty journey with us.</p>
      </div>

      <div className="grid gap-8">
        <div className="grid md:grid-cols-2 gap-8">
            <Card className="shadow-lg flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="font-headline">Order Again</CardTitle>
                    <CardDescription>Ready for another coffee? Your usual is just a click away.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full sm:w-auto">
                        <Link href="/dashboard/order"><ShoppingCart /> Start New Order</Link>
                    </Button>
                </CardContent>
            </Card>
            <Card className="shadow-lg flex flex-col justify-between">
                <CardHeader>
                    <CardTitle className="font-headline">Your Profile</CardTitle>
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
