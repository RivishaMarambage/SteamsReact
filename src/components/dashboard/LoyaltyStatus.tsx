
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile, LoyaltyLevel } from "@/lib/types";
import { Medal, Shield, Gem, Crown, Minus } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "none": Minus,
    "bronze": Medal,
    "silver": Shield,
    "gold": Gem,
    "platinum": Crown,
};

export default function LoyaltyStatus({ user }: { user: UserProfile }) {
  const firestore = useFirestore();
  
  const currentTierRef = useMemoFirebase(() => {
    if (firestore && user.loyaltyLevelId) {
        return doc(firestore, "loyalty_levels", user.loyaltyLevelId);
    }
    return null;
  }, [firestore, user.loyaltyLevelId]);

  const { data: currentTier, isLoading } = useDoc<LoyaltyLevel>(currentTierRef);

  if (isLoading) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>
            </CardContent>
        </Card>
    )
  }

  // Handle case where user has no tier yet or tier data is not found
  if (!user || !currentTier) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Your Loyalty Status</CardTitle>
                <CardDescription>Start earning points with every purchase.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-primary">{user?.loyaltyPoints ?? 0} Points</div>
                <p className="text-sm text-muted-foreground mt-2">You are not yet in a loyalty tier.</p>
            </CardContent>
        </Card>
    );
  }
  
  const Icon = ICONS[currentTier.id.toLowerCase()] || Minus;

  // Since we don't fetch all tiers, we can't show progress to the next one.
  // This is a simplification to ensure the current status always shows.
  // We can show a full progress bar if they are in a tier.
  const progress = currentTier.minimumPoints > 0 ? ((user.loyaltyPoints ?? 0) / currentTier.minimumPoints) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl">Your Loyalty Status</CardTitle>
                <CardDescription>Earn points with every purchase.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold capitalize text-primary">
                <Icon className="h-6 w-6" />
                <span>{currentTier.name}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">{user.loyaltyPoints ?? 0} Points</div>
           <p className="text-sm text-muted-foreground">
              You are currently in the <strong>{currentTier.name}</strong> tier.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
