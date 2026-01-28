'use server';

/**
 * @fileOverview Payment processing flows that act as a secure backend bridge.
 *
 * - initiatePayment - Generates a mock payment token and checkout URL.
 * - placeOrderAfterPayment - Verifies a mock payment and creates the order in Firestore.
 * - InitiatePaymentInput - Input for initiatePayment flow.
 * - InitiatePaymentOutput - Output for initiatePayment flow.
 * - PlaceOrderInput - Input for placeOrderAfterPayment flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { addDoc, collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { Order, OrderItem, PointTransaction } from '@/lib/types';
import { format } from 'date-fns';

// Schema for initiating payment
export const InitiatePaymentInputSchema = z.object({
  amount: z.number().describe('The total amount for the payment.'),
});
export type InitiatePaymentInput = z.infer<typeof InitiatePaymentInputSchema>;

export const InitiatePaymentOutputSchema = z.object({
  paymentToken: z.string().describe('The secure token generated for this payment session.'),
  checkoutUrl: z.string().describe('The URL for the user to complete payment.'),
});
export type InitiatePaymentOutput = z.infer<typeof InitiatePaymentOutputSchema>;

// Flow to initiate payment
const initiatePaymentFlow = ai.defineFlow(
  {
    name: 'initiatePaymentFlow',
    inputSchema: InitiatePaymentInputSchema,
    outputSchema: InitiatePaymentOutputSchema,
  },
  async (input) => {
    console.log('Backend Bridge: Received request to generate payment token.');
    // In a real scenario, you would use secret credentials here to contact Genie.
    // const merchantId = process.env.GENIE_MERCHANT_ID;
    // const merchantSecret = process.env.GENIE_MERCHANT_SECRET;
    console.log('Backend Bridge: Sending secure request to Genie API...');

    // Simulate network delay for API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const paymentToken = `genie_token_${Date.now()}`;
    const checkoutUrl = `https://sandbox.genie.lk/checkout?token=${paymentToken}`;

    console.log(`Backend Bridge: Received token from Genie: ${paymentToken}`);

    return {
      paymentToken,
      checkoutUrl,
    };
  }
);

// Exported wrapper function
export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
  return initiatePaymentFlow(input);
}


// Schemas for placing the order after payment
const CartItemAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  categoryId: z.string(),
  imageUrl: z.string().optional(),
  isOutOfStock: z.boolean().optional(),
  addonGroups: z.array(z.object({
    addonCategoryId: z.string(),
    isRequired: z.boolean(),
    minSelection: z.number(),
    maxSelection: z.number(),
  })).optional(),
});

const CartItemSchema = z.object({
  id: z.string(),
  menuItem: MenuItemSchema,
  quantity: z.number(),
  addons: z.array(CartItemAddonSchema),
  totalPrice: z.number(),
  appliedDailyOfferId: z.string().optional(),
});

export const PlaceOrderInputSchema = z.object({
    userId: z.string(),
    checkoutData: z.object({
        cartTotal: z.number(),
        orderType: z.enum(['Dine-in', 'Takeaway']),
        loyaltyDiscount: z.number(),
        totalDiscount: z.number(),
        serviceCharge: z.number(),
        tableNumber: z.string().optional(),
        welcomeDiscountAmount: z.number(),
        birthdayDiscountAmount: z.number(),
        cart: z.array(CartItemSchema),
    }),
    transactionId: z.string().describe("The transaction ID from the payment gateway."),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;


// Flow to place order after successful payment
const placeOrderAfterPaymentFlow = ai.defineFlow(
  {
    name: 'placeOrderAfterPaymentFlow',
    inputSchema: PlaceOrderInputSchema,
    outputSchema: z.object({ orderId: z.string() }),
  },
  async ({ userId, checkoutData, transactionId }) => {
    console.log(`Backend Bridge: Received request to place order for user ${userId} with transaction ${transactionId}.`);
    // In a real scenario, you would call Genie's API again to verify the transactionId is valid and paid.
    console.log("Backend Bridge: Verifying payment transaction with Genie...");
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log("Backend Bridge: Payment verified.");

    const firestore = getFirestore();
    const userDocRef = doc(firestore, 'users', userId);
    const batch = writeBatch(firestore);
    const rootOrderRef = doc(collection(firestore, 'orders'));
    
    // Transform CartItem[] to OrderItem[]
    const orderItems: OrderItem[] = checkoutData.cart.map((cartItem: z.infer<typeof CartItemSchema>) => ({
      menuItemId: cartItem.menuItem.id,
      menuItemName: cartItem.menuItem.name,
      quantity: cartItem.quantity,
      basePrice: cartItem.menuItem.price,
      addons: cartItem.addons.map(addon => ({
          addonId: addon.id,
          addonName: addon.name,
          addonPrice: addon.price
      })),
      totalPrice: cartItem.totalPrice,
      ...(cartItem.appliedDailyOfferId && { appliedDailyOfferId: cartItem.appliedDailyOfferId }),
    }));

    let pointsToEarn = 0;
    if (checkoutData.cartTotal > 10000) {
        pointsToEarn = Math.floor(checkoutData.cartTotal / 100) * 2;
    } else if (checkoutData.cartTotal >= 5000) {
        pointsToEarn = Math.floor(checkoutData.cartTotal / 100);
    } else if (checkoutData.cartTotal >= 1000) {
        pointsToEarn = Math.floor(checkoutData.cartTotal / 200);
    } else if (checkoutData.cartTotal > 0) {
        pointsToEarn = Math.floor(checkoutData.cartTotal / 400);
    }

    const orderData: Omit<Order, 'id' | 'orderDate'> & { orderDate: any } = {
        customerId: userId,
        orderDate: serverTimestamp(),
        totalAmount: checkoutData.cartTotal,
        status: "Placed",
        paymentStatus: "Paid",
        orderItems: orderItems,
        orderType: checkoutData.orderType,
        pointsRedeemed: checkoutData.loyaltyDiscount,
        discountApplied: checkoutData.totalDiscount,
        serviceCharge: checkoutData.serviceCharge,
        pointsToEarn: pointsToEarn,
        ...(checkoutData.orderType === 'Dine-in' && checkoutData.tableNumber && { tableNumber: checkoutData.tableNumber }),
        ...(checkoutData.welcomeDiscountAmount > 0 && { welcomeOfferApplied: true }),
    };

    batch.set(rootOrderRef, orderData);
    const userOrderRef = doc(firestore, `users/${userId}/orders`, rootOrderRef.id);
    batch.set(userOrderRef, orderData);

    const updates: any = {};
    if (checkoutData.loyaltyDiscount > 0) {
        updates.loyaltyPoints = increment(-checkoutData.loyaltyDiscount);
        const transactionRef = doc(collection(firestore, `users/${userId}/point_transactions`));
        batch.set(transactionRef, {
            date: serverTimestamp(),
            description: `Redeemed on Order #${rootOrderRef.id.substring(0, 7).toUpperCase()}`,
            amount: -checkoutData.loyaltyDiscount,
            type: 'redeem'
        });
    }

    if (checkoutData.birthdayDiscountAmount > 0) {
        updates.birthdayDiscountValue = null;
        updates.birthdayDiscountType = null;
    }

    if (checkoutData.welcomeDiscountAmount > 0) {
        updates.orderCount = increment(1);
    }

    const redeemedDailyOffers = orderItems
        .map((item: any) => item.appliedDailyOfferId)
        .filter((id?: string): id is string => !!id);
    
    if (redeemedDailyOffers.length > 0) {
        const todayString = format(new Date(), 'yyyy-MM-dd');
        redeemedDailyOffers.forEach((offerId: string) => {
            updates[`dailyOffersRedeemed.${offerId}`] = todayString;
        });
    }

    if (Object.keys(updates).length > 0) {
        batch.update(userDocRef, updates);
    }
    
    await batch.commit();
    console.log(`Backend Bridge: Successfully created order ${rootOrderRef.id}.`);
    return { orderId: rootOrderRef.id };
  }
);

// Exported wrapper function
export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ orderId: string }> {
  return placeOrderAfterPaymentFlow(input);
}
