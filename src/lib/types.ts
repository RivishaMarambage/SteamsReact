export type User = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  nickname: string;
  role: 'customer' | 'admin' | 'staff';
  points: number;
  loyaltyLevel: LoyaltyLevel;
  recentOrders: Order[];
};

export type MenuItem = {
  id: string;
  name:string;
  description: string;
  price: number;
  category: 'Hot Coffee' | 'Iced Coffee' | 'Pastries';
  imageId: string;
};

export type Order = {
  id: string;
  date: string;
  items: { menuItem: MenuItem; quantity: number }[];
  total: number;
  pointsEarned: number;
};

export type LoyaltyLevel = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type LoyaltyTier = {
  level: LoyaltyLevel;
  minPoints: number;
  nextTierPoints: number | null;
  icon: React.ComponentType<{ className?: string }>;
  progressColor: string;
};
