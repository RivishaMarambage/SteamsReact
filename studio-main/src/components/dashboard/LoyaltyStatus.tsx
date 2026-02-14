
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
    // Filter out any tier named "Standard" to handle stale data in the database.
    return loyaltyTiersFromDB.filter(tier => tier.name.toLowerCase() !== 'standard');
  }, [loyaltyTiersFromDB]);

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
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-xl overflow-hidden relative group hover:shadow-2xl hover:shadow-[#d97706]/10 transition-all duration-500">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#d97706]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <CardHeader className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-headline text-3xl text-[#2c1810]">Your Loyalty Status</CardTitle>
            <CardDescription className="text-[#6b584b] text-base">Earn points with every purchase.</CardDescription>
          </div>
          <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 md:gap-0">
            <div className="flex items-center justify-end gap-2 text-xl font-bold capitalize text-[#d97706] bg-[#d97706]/10 px-4 py-1.5 rounded-full border border-[#d97706]/20">
              <Icon className="h-6 w-6 fill-current animate-pulse-slow" />
              <span>{currentTier.name}</span>
            </div>
            <div className="flex items-center justify-end gap-2 text-sm text-[#6b584b] mt-1 font-medium">
              <Trophy className="h-4 w-4 text-[#d97706]" />
              <span>{user.lifetimePoints ?? 0} Lifetime Points</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-6">
          <div>
            <div className="text-4xl md:text-5xl font-black text-[#2c1810] mb-1">{userPoints}</div>
            <div className="text-sm font-bold tracking-wider text-[#6b584b] uppercase">Redeemable Points</div>
          </div>

          <div>
            <div className="h-4 w-full bg-[#2c1810]/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#d97706] to-[#f59e0b] shadow-[0_0_10px_rgba(217,119,6,0.5)] transition-all duration-1000 ease-out rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
              </div>
            </div>
            {/* <Progress value={progress} className="h-4 bg-[#2c1810]/5 [&>div]:bg-gradient-to-r [&>div]:from-[#d97706] [&>div]:to-[#f59e0b]" /> */}

            {nextTier ? (
              <p className="text-sm text-[#6b584b] mt-3 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#d97706] animate-pulse" />
                You're <strong className="text-[#2c1810]">{pointsToNext}</strong> points away from the <strong className="text-[#d97706] uppercase">{nextTier.name}</strong> tier!
              </p>
            ) : (
              <p className="text-sm text-[#6b584b] mt-3 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-[#d97706]" />
                You've reached the highest loyalty tier! Congratulations!
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
