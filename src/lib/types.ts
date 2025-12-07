import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  id: string;
  email: string;
  mobileNumber?: string;
  name: string;
  cafeNickname?: string;
  loyaltyPoints?: number;
  loyaltyLevelId?: string;
  role: 'customer' | 'admin' | 'staff';
  dateOfBirth?: string;
  birthdayCredit?: number;
  birthdayFreebieMenuItemIds?: string[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
};

export type Category = {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'snacks' | 'dinner' | 'beverage' | 'main food' | 'deserts' | 'match' | 'coffee';
};

export type LoyaltyLevel = {
    id: string;
    name: string;
    minimumPoints: number;
};

export type Order = {
    id: string;
    customerId: string;
    orderDate: Timestamp;
    totalAmount: number;
    status: 'Placed' | 'Processing' | 'Ready for Pickup' | 'Completed';
    menuItemIds: string[];
    orderType: 'Dine-in' | 'Pick up' | 'Takeway';
    pointsRedeemed?: number;
    discountApplied?: number;
}

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};

