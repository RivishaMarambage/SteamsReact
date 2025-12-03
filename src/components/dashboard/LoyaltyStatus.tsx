'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCollection, useDoc } from "@/firebase";
import { doc, getFirestore, collection } from "firebase/firestore";
import type { UserProfile, LoyaltyLevel } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Medal, Shield, Gem, Crown, Minus } from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    "none": Minus,
    "bronze": Medal,
    "silver": Shield,
    "gold": Gem,
    "platinum": Crown,
};

export default function LoyaltyStatus({ user }: { user: UserProfile }) {
  const { data: loyaltyLevels, isLoading: levelsLoading } = useCollection("loyalty_levels");
  
  if (!user || levelsLoading) return null;

  const getLoyaltyTier = (points: number): LoyaltyLevel | undefined => {
    if (!loyaltyLevels) return undefined;
    
    let currentLevel: LoyaltyLevel | undefined = undefined;
    for (const level of loyaltyLevels) {
        if (points >= level.minimumPoints) {
            currentLevel = level as LoyaltyLevel;
        } else {
            break; // Levels are sorted by min points
        }
    }
    return currentLevel;
  };

  const currentTier = getLoyaltyTier(user.loyaltyPoints ?? 0);
  if (!currentTier) return null;

  const nextTier = loyaltyLevels?.find(l => l.minimumPoints > currentTier.minimumPoints);

  const Icon = ICONS[currentTier.name.toLowerCase()] || Minus;

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
            <div className="flex items-center gap-2 text-lg font-semibold">
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
