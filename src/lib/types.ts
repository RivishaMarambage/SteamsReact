
import { Timestamp } from "firebase/firestore";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  mobileNumber?: string;
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

export type GameProfile = {
  lastPlayedDate: string; // YYYY-MM-DD
  triviaCount: number;
  spinCount: number;
};

export type DailyGameWinners = {
  spinWinner: string | null;
  scratchWinner: string | null;
  triviaWinner: string | null;
}

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
  isActive?: boolean;
  displayOrder?: number;
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
  displayOrder?: number;
};

export type Category = {
  id:string;
  name: string;
  type: 'Food' | 'Beverages';
  displayOrder?: number;
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
    status: 'Placed' | 'Accepting' | 'Processing' | 'Ready for Pickup' | 'Completed' | 'Rejected';
    orderItems: OrderItem[];
    orderType: 'Dine-in' | 'Takeaway';
    tableNumber?: string;
    pointsRedeemed?: number;
    discountApplied?: number;
    serviceCharge?: number;
    pointsToEarn?: number;
    paymentStatus?: 'Paid' | 'Unpaid';
    paymentMethod?: 'Online' | 'Cash' | 'QR' | 'Wallet';
    transactionId?: string;
    welcomeOfferApplied?: boolean;
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

export type PointTransaction = {
    id: string;
    date: Timestamp;
    description: string;
    amount: number; // positive for earn, negative for redeem
    type: 'earn' | 'redeem';
};
