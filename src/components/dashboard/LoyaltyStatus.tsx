
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
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
  
  const { data: loyaltyLevels, isLoading: levelsLoading } = useCollection<LoyaltyLevel>("loyalty_levels");
  
  const currentTierRef = useMemoFirebase(() => {
    if (firestore && user.loyaltyLevelId) {
        return doc(firestore, "loyalty_levels", user.loyaltyLevelId);
    }
    return null;
  }, [firestore, user.loyaltyLevelId]);

  const { data: currentTier, isLoading: tierLoading } = useDoc<LoyaltyLevel>(currentTierRef);

  const isLoading = levelsLoading || tierLoading;

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

  if (!user || !currentTier || !loyaltyLevels) return null;

  const sortedLevels = [...loyaltyLevels].sort((a, b) => a.minimumPoints - b.minimumPoints);
  const nextTier = sortedLevels.find(l => l.minimumPoints > currentTier.minimumPoints);

  const Icon = ICONS[currentTier.id.toLowerCase()] || Minus;

  const progress = nextTier
    ? (((user.loyaltyPoints ?? 0) - currentTier.minimumPoints) / (nextTier.minimumPoints - currentTier.minimumPoints)) * 100
    : 100;

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
          <Progress value={progress} className="h-3 [&>*]:bg-primary" />
          <div className="text-sm text-muted-foreground">
            {nextTier ? (
              <span>
                You are <strong>{nextTier.minimumPoints - (user.loyaltyPoints ?? 0)}</strong> points away from the <strong>{nextTier.name}</strong> tier.
              </span>
            ) : (
              <span>You've reached the highest tier!</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
