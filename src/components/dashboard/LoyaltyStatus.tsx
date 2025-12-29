
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { UserProfile, LoyaltyLevel } from "@/lib/types";
import { Medal, Shield, Gem, Crown, Minus, Star, Trophy } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "member": Star,
    "bronze": Shield,
    "silver": Gem,
    "gold": Crown,
    "platinum": Crown,
};

export default function LoyaltyStatus({ user }: { user: UserProfile }) {
  const firestore = useFirestore();
  
  const loyaltyLevelsQuery = useMemoFirebase(() => {
    if (firestore) {
        return query(collection(firestore, "loyalty_levels"), orderBy("minimumPoints"));
    }
    return null;
  }, [firestore]);

  const { data: loyaltyTiers, isLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);

  if (isLoading || !loyaltyTiers || loyaltyTiers.length === 0) {
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
  
  const userPoints = user.loyaltyPoints ?? 0;

  // Find the current tier based on lifetime points
  const lifetimePoints = user.lifetimePoints ?? 0;
  const currentTier = [...loyaltyTiers].reverse().find(tier => lifetimePoints >= tier.minimumPoints) || loyaltyTiers[0];
  const currentTierIndex = loyaltyTiers.findIndex(tier => tier.id === currentTier.id);

  // Find the next tier
  const nextTier = currentTierIndex < loyaltyTiers.length - 1 ? loyaltyTiers[currentTierIndex + 1] : null;

  const Icon = ICONS[currentTier.id.toLowerCase()] || Minus;

  let progress = 0;
  let pointsToNext = 0;

  if (nextTier) {
      const pointsInCurrentTier = lifetimePoints - currentTier.minimumPoints;
      const pointsForNextTier = nextTier.minimumPoints - currentTier.minimumPoints;
      progress = pointsForNextTier > 0 ? (pointsInCurrentTier / pointsForNextTier) * 100 : 100;
      pointsToNext = nextTier.minimumPoints - lifetimePoints;
  } else {
      // User is at the highest tier
      progress = 100;
  }


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle className="font-headline text-2xl">Your Loyalty Status</CardTitle>
                <CardDescription>Earn points with every purchase.</CardDescription>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-lg font-semibold capitalize text-primary">
                  <Icon className="h-6 w-6" />
                  <span>{currentTier.name}</span>
              </div>
              <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-1">
                 <Trophy className="h-3 w-3" />
                 <span>{user.lifetimePoints ?? 0} Lifetime Points</span>
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-3xl font-bold text-primary">{userPoints} Redeemable Points</div>
          
          <div>
            <Progress value={progress} className="h-3" />
            {nextTier ? (
                <p className="text-sm text-muted-foreground mt-2">
                    You're <strong>{pointsToNext}</strong> points away from the <strong>{nextTier.name}</strong> tier!
                </p>
            ) : (
                <p className="text-sm text-muted-foreground mt-2">
                    You've reached the highest loyalty tier! Congratulations!
                </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    
