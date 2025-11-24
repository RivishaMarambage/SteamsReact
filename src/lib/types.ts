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

// This type is no longer needed as its properties are merged into User
// export type CustomerProfile = {
//   id: string;
//   email: string;
//   mobileNumber: string;
//   name: string;
//   cafeNickname?: string;
//   loyaltyPoints: number;
//   loyaltyLevelId: string;
// }

    