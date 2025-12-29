
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  id: string;
  email: string;
  mobileNumber?: string;
  name: string;
  cafeNickname?: string;
  loyaltyPoints?: number;
  lifetimePoints?: number;
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
  imageUrl?: string;
  isOutOfStock?: boolean;
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
    status: 'Placed' | 'Processing' | 'Ready for Pickup' | 'Completed' | 'Rejected';
    menuItemIds: string[];
    orderType: 'Dine-in' | 'Takeaway';
    tableNumber?: string;
    pointsRedeemed?: number;
    discountApplied?: number;
    serviceCharge?: number;
    pointsToEarn?: number;
}

export type DailyOffer = {
  id: string;
  menuItemId: string;
  offerStartDate: string; // Stored as YYYY-MM-DD string
  offerEndDate: string; // Stored as YYYY-MM-DD string
  title: string;
  tierDiscounts: Record<string, number>; // Map of loyaltyLevelId to discount value
  discountType: 'fixed' | 'percentage'; // LKR amount or %
  orderType: 'Dine-in' | 'Takeaway';
}

export type CartItem = {
  menuItem: MenuItem;
  quantity: number;
};
