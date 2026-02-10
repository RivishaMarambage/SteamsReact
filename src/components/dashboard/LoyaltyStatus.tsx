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
        <Card className="border shadow-md">
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
    <Card className="shadow-md overflow-hidden border">
      <CardHeader className="border-b bg-muted/5">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="space-y-1">
                <CardTitle className="font-headline text-xl md:text-2xl uppercase tracking-tight">Loyalty Tier</CardTitle>
                <CardDescription>Your dedication is brewing rewards.</CardDescription>
            </div>
            <div className="flex flex-row items-center gap-3 bg-primary/10 px-5 py-2 rounded-full border border-primary/20">
                <Icon className="h-5 w-5 text-primary" />
                <span className="font-bold capitalize text-primary text-lg">{currentTier.name}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <div className="flex flex-col items-baseline sm:flex-row gap-2">
            <span className="text-5xl font-black text-primary tracking-tighter">{userPoints}</span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available Steam Points</span>
          </div>
          
          <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex flex-col xs:flex-row justify-between items-center gap-3 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>{lifetimePoints} Lifetime Points</span>
                </div>
                {nextTier && (
                    <div className="bg-secondary px-3 py-1 rounded-md">
                        {pointsToNext} points to reach {nextTier.name}
                    </div>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}