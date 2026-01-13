

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
  birthdayDiscountValue?: number | null;
  birthdayDiscountType?: 'fixed' | 'percentage' | null;
  birthdayFreebieMenuItemIds?: string[];
  orderCount?: number;
  emailVerified?: boolean;
  referralCode?: string;
  hasLinkedSocials?: boolean;
  hasLeftReview?: boolean;
  dailyOffersRedeemed?: Record<string, string>; // e.g. { "offerId": "YYYY-MM-DD" }
};

export type AddonCategory = {
  id: string;
  name: string;
  description: string;
}

export type Addon = {
  id: string;
  name: string;
  price: number;
  addonCategoryId: string;
};

export type MenuItemAddonGroup = {
  addonCategoryId: string;
  isRequired: boolean;
  minSelection: number;
  maxSelection: number;
}

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl?: string;
  isOutOfStock?: boolean;
  addonGroups?: MenuItemAddonGroup[];
};

export type Category = {
  id:string;
  name: string;
  type: 'Food' | 'Beverages';
};

export type LoyaltyLevel = {
    id: string;
    name: string;
    minimumPoints: number;
};

export type OrderItem = {
    menuItemId: string;
    menuItemName: string;
    quantity: number;
    basePrice: number;
    addons: {
        addonId: string;
        addonName: string;
        addonPrice: number;
    }[];
    totalPrice: number;
    appliedDailyOfferId?: string;
}

export type Order = {
    id: string;
    customerId: string;
    orderDate: Timestamp;
    totalAmount: number;
    status: 'Placed' | 'Processing' | 'Ready for Pickup' | 'Completed' | 'Rejected';
    orderItems: OrderItem[];
    orderType: 'Dine-in' | 'Takeaway';
    tableNumber?: string;
    pointsRedeemed?: number;
    discountApplied?: number;
    serviceCharge?: number;
    pointsToEarn?: number;
    birthdayDiscountApplied?: {
      type: 'fixed' | 'percentage';
      value: number;
    } | {
      type: 'free-item';
      menuItemIds: string[];
    } | null;
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

export type CartItemAddon = {
  id: string;
  name: string;
  price: number;
}

export type CartItem = {
  id: string; // Unique ID for the cart item instance
  menuItem: MenuItem;
  quantity: number;
  addons: CartItemAddon[];
  totalPrice: number;
  appliedDailyOfferId?: string;
};
