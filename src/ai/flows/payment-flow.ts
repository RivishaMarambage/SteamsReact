'use server';

/**
 * @fileOverview Payment processing flows that act as a secure backend bridge.
 *
 * - initiatePayment - Generates a mock payment token and checkout URL.
 * - placeOrderAfterPayment - Verifies a mock payment and creates the order in Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  InitiatePaymentInput,
  InitiatePaymentInputSchema,
  InitiatePaymentOutput,
  InitiatePaymentOutputSchema,
  PlaceOrderInput,
  PlaceOrderInputSchema,
} from './payment-schemas';
import { addDoc, collection, doc, writeBatch, serverTimestamp, increment } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import type { Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';

// Flow to initiate payment
const initiatePaymentFlow = ai.defineFlow(
  {
    name: 'initiatePaymentFlow',
    inputSchema: InitiatePaymentInputSchema,
    outputSchema: InitiatePaymentOutputSchema,
  },
  async (input) => {
    console.log('Backend Bridge: Received request to generate payment token.');
    
    // In a real scenario, you would use your secret credentials from .env here to contact Genie.
    const merchantId = process.env.GENIE_MARCHANT_ID;
    const apiKey = process.env.GENIE_API_KEY;

    // This is where you would make a real `fetch` call to the Genie API.
    // const genieResponse = await fetch('https://api.genie.lk/v1/payment/request', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apiKey}`
    //   },
    //   body: JSON.stringify({
    //     merchantId: merchantId,
    //     amount: input.amount,
    //     // ... other required Genie parameters
    //   })
    // });
    // const genieData = await genieResponse.json();
    // const { paymentToken, checkoutUrl } = genieData;
    
    console.log('Backend Bridge: Sending secure request to Genie API (currently simulated)...');
    
    // For now, we are simulating the response from Genie.
    await new Promise(resolve => setTimeout(resolve, 1000));

    const paymentToken = `genie_token_${Date.now()}`;
    const checkoutUrl = `https://sandbox.genie.lk/checkout?token=${paymentToken}`;

    console.log(`Backend Bridge: Received mock token from Genie: ${paymentToken}`);

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
    const orderItems: OrderItem[] = checkoutData.cart.map((cartItem) => ({
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
