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
        <Card className="rounded-[2.5rem]">
            <CardHeader className="p-6 md:p-8">
                 <Skeleton className="h-8 w-1/2" />
                 <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent className="p-6 md:p-8 pt-0">
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
    <Card className="shadow-lg rounded-[2.5rem]">
      <CardHeader className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
                <CardTitle className="font-headline text-xl md:text-2xl uppercase tracking-tight">Your Loyalty Status</CardTitle>
                <CardDescription className="text-sm">Earn points with every rupee spent.</CardDescription>
            </div>
            <div className="flex flex-row items-center gap-3 bg-primary/5 px-4 py-2 rounded-full border border-primary/10 w-fit">
                <Icon className="h-5 w-5 md:h-6 md:size-6 text-primary" />
                <span className="font-black capitalize text-primary text-lg">{currentTier.name}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8 pt-0">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-black text-primary tracking-tighter">{userPoints}</span>
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Redeemable Steam Points</span>
          </div>
          
          <div className="space-y-3">
            <Progress value={progress} className="h-3 bg-muted border border-border" />
            <div className="flex justify-between items-center text-xs md:text-sm font-bold uppercase tracking-tight">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="h-3.5 w-3.5" />
                    <span>{lifetimePoints} Total Lifetime Points</span>
                </div>
                {nextTier && (
                    <span className="text-primary">{pointsToNext} to {nextTier.name}</span>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
