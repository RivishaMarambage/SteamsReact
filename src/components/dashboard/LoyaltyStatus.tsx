'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getLoyaltyTier, LOYALTY_TIERS } from "@/lib/data";
import { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function LoyaltyStatus({ user }: { user: User }) {
  if (!user.points === undefined) return null;

  const currentTier = getLoyaltyTier(user.points ?? 0);
  const Icon = currentTier.icon;
  const progress = currentTier.nextTierPoints
    ? (((user.points ?? 0) - currentTier.minPoints) / (currentTier.nextTierPoints - currentTier.minPoints)) * 100
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
                <span>{currentTier.level}</span>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-3xl font-bold text-primary">{user.points ?? 0} Points</div>
          <Progress value={progress} className="h-3 [&>*]:bg-primary" />
          <div className="text-sm text-muted-foreground">
            {currentTier.nextTierPoints ? (
              <span>
                You are <strong>{currentTier.nextTierPoints - (user.points ?? 0)}</strong> points away from the <strong>{LOYALTY_TIERS.find(t => t.minPoints === currentTier.nextTierPoints)?.level}</strong> tier.
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
