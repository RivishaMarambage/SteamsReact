export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'staff';
  // Optional fields, primarily for customers
  mobileNumber?: string;
  cafeNickname?: string;
  points?: number;
  loyaltyLevel?: LoyaltyLevel;
  recentOrders?: Order[];
  analytics?: {
    totalSpent: number;
    orderCount: number;
  };
};

export type MenuItem = {
  id: string;
  name:string;
  description: string;
  price: number;
  category: 'Hot Coffee' | 'Iced Coffee' | 'Pastries';
  imageId: string;
  stock: number;
  analytics?: {
    unitsSold: number;
  };
};

export type OrderStatus = 'Pending' | 'Processing' | 'Ready for Pickup' | 'Completed';

export type Order = {
  id: string;
  date: string;
  items: { menuItem: MenuItem; quantity: number }[];
  total: number;
  pointsEarned: number;
  status: OrderStatus;
};

export type LoyaltyLevel = 'None' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type LoyaltyTier = {
  level: LoyaltyLevel;
  minPoints: number;
  nextTierPoints: number | null;
  icon: React.ComponentType<{ className?: string }>;
  progressColor: string;
};
