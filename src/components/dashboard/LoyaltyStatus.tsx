
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { UserProfile, LoyaltyLevel } from "@/lib/types";
import { Shield, Gem, Crown, Minus, Star, Trophy } from 'lucide-react';
import { Skeleton } from "../ui/skeleton";
import { useMemo } from "react";

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

  const { data: loyaltyTiersFromDB, isLoading } = useCollection<LoyaltyLevel>(loyaltyLevelsQuery);
  
  const loyaltyTiers = useMemo(() => {
    if (!loyaltyTiersFromDB) return null;
    return loyaltyTiersFromDB.filter(tier => tier.name.toLowerCase() !== 'standard');
  }, [loyaltyTiersFromDB]);

  if (isLoading || !loyaltyTiers || loyaltyTiers.length === 0) {
    return (
        <Card className="shadow-lg rounded-[2rem] sm:rounded-[2.5rem]">
            <CardHeader className="p-6 sm:p-8">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
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
  const lifetimePoints = user.lifetimePoints ?? 0;
  const currentTier = [...loyaltyTiers].reverse().find(tier => lifetimePoints >= tier.minimumPoints) || loyaltyTiers[0];
  const currentTierIndex = loyaltyTiers.findIndex(tier => tier.id === currentTier.id);
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
      progress = 100;
  }

  return (
    <Card className="shadow-lg rounded-[2rem] sm:rounded-[2.5rem]">
      <CardHeader className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div>
                <CardTitle className="font-headline text-xl sm:text-2xl">Your Loyalty Status</CardTitle>
                <CardDescription className="text-sm">Earn points with every purchase.</CardDescription>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              <div className="flex items-center gap-2 text-lg sm:text-xl font-black capitalize text-primary bg-primary/5 px-4 py-1.5 rounded-full border border-primary/10">
                  <Icon className="h-5 w-5 sm:h-6 sm:size-6" />
                  <span>{currentTier.name}</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mt-2 px-1">
                 <Trophy className="h-3 w-3" />
                 <span>{user.lifetimePoints ?? 0} Lifetime Points</span>
              </div>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 sm:p-8 pt-0 sm:pt-0">
        <div className="space-y-6">
          <div className="text-2xl sm:text-3xl font-black text-primary uppercase tracking-tight">
            {userPoints} <span className="text-sm font-bold text-muted-foreground">Redeemable Points</span>
          </div>
          
          <div className="space-y-3">
            <Progress value={progress} className="h-3 sm:h-4 bg-muted border border-border" />
            {nextTier ? (
                <p className="text-xs sm:text-sm text-muted-foreground font-medium leading-relaxed">
                    You're <strong>{pointsToNext}</strong> points away from the <strong className="text-primary">{nextTier.name}</strong> tier!
                </p>
            ) : (
                <p className="text-xs sm:text-sm text-primary font-bold">
                    You've reached the highest loyalty tier! Congratulations!
                </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
