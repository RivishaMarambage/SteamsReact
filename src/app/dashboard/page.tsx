'use client';

import LoyaltyStatus from "@/components/dashboard/LoyaltyStatus";
import RecentOrders from "@/components/dashboard/RecentOrders";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/lib/auth/provider";

export default function DashboardPage() {
  const { user, isLoading } = useUser();

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
        <h1 className="text-3xl font-bold font-headline">Welcome back, {user.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's a look at your loyalty journey with us.</p>
      </div>

      <div className="grid gap-8">
        <LoyaltyStatus user={user} />
        <RecentOrders user={user} />
      </div>
    </div>
  );
}
