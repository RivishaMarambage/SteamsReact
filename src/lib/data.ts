import { Medal, Shield, Gem, Crown, Minus } from 'lucide-react';
import type { LoyaltyTier } from './types';

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { level: 'None', minPoints: 0, nextTierPoints: 10, icon: Minus, progressColor: 'bg-muted' },
  { level: 'Bronze', minPoints: 10, nextTierPoints: 50, icon: Medal, progressColor: 'bg-yellow-600/80' },
  { level: 'Silver', minPoints: 50, nextTierPoints: 100, icon: Shield, progressColor: 'bg-slate-400' },
  { level: 'Gold', minPoints: 100, nextTierPoints: 200, icon: Gem, progressColor: 'bg-amber-400' },
  { level: 'Platinum', minPoints: 200, nextTierPoints: null, icon: Crown, progressColor: 'bg-violet-500' },
];

export const getLoyaltyTier = (points: number): LoyaltyTier => {
  for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
    if (points >= LOYALTY_TIERS[i].minPoints) {
      return LOYALTY_TIERS[i];
    }
  }
  return LOYALTY_TIERS[0];
};
