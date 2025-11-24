import { Medal, Shield, Gem, Crown, Minus } from 'lucide-react';
import type { User, MenuItem, LoyaltyTier } from './types';

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

export const MENU_ITEMS: MenuItem[] = [
  { id: 'item_1', name: 'Espresso', description: 'Rich & intense, a pure coffee experience.', price: 3.50, category: 'Hot Coffee', imageId: 'espresso' },
  { id: 'item_2', name: 'Latte', description: 'Smooth espresso with steamed milk.', price: 4.50, category: 'Hot Coffee', imageId: 'latte' },
  { id: 'item_3', name: 'Cappuccino', description: 'Equal parts espresso, steamed milk, and foam.', price: 4.00, category: 'Hot Coffee', imageId: 'cappuccino' },
  { id: 'item_4', name: 'Iced Coffee', description: 'Chilled and refreshing, brewed to perfection.', price: 4.00, category: 'Iced Coffee', imageId: 'iced-coffee' },
  { id: 'item_5', name: 'Croissant', description: 'Buttery, flaky, and fresh from the oven.', price: 3.50, category: 'Pastries', imageId: 'croissant' },
  { id: 'item_6', name: 'Blueberry Muffin', description: 'Sweet and moist, packed with blueberries.', price: 3.00, category: 'Pastries', imageId: 'muffin' },
];


export const MOCK_USER: User = {
  id: 'usr_1',
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  mobile: '555-123-4567',
  nickname: 'Lex',
  role: 'admin', // 'admin' to show all nav items
  points: 78,
  loyaltyLevel: getLoyaltyTier(78).level,
  recentOrders: [
    {
      id: 'ord_1',
      date: '2024-07-28',
      items: [{ menuItem: MENU_ITEMS[1], quantity: 1 }, { menuItem: MENU_ITEMS[4], quantity: 1 }],
      total: 8.00,
      pointsEarned: 8,
    },
    {
      id: 'ord_2',
      date: '2024-07-25',
      items: [{ menuItem: MENU_ITEMS[0], quantity: 2 }],
      total: 7.00,
      pointsEarned: 7,
    },
    {
      id: 'ord_3',
      date: '2024-07-22',
      items: [{ menuItem: MENU_ITEMS[2], quantity: 1 }],
      total: 4.00,
      pointsEarned: 4,
    }
  ]
};
