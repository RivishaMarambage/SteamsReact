'use server';

/**
 * @fileOverview Secure Backend Bridge for Payment and Order Finalization.
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
import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp, 
  increment, 
  getFirestore 
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import type { Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';
import { initializeFirebase } from '@/firebase';

// --- INITIALIZATION ---
// This block ensures Firebase is initialized for server-side execution.
const { firestore: db, auth } = initializeFirebase();

// --- AUTHENTICATION ---
/**
 * Ensures the backend process is authenticated as an admin before running flows.
 */
async function ensureAuthenticated() {
  if (auth.currentUser && (await auth.currentUser.getIdTokenResult()).claims.role === 'admin') {
    return auth.currentUser;
  }
  
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'password123';

  try {
    const userCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    return userCred.user;
  } catch (error) {
    console.error("Failed to authenticate backend admin:", error);
    throw new Error("Backend authentication failed. Check ADMIN_EMAIL and ADMIN_PASSWORD.");
  }
}


// --- GENKIT FLOWS ---

/**
 * Flow: initiatePaymentFlow
 * Connects to a payment gateway to generate a checkout session.
 */
const initiatePaymentFlow = ai.defineFlow(
  {
    name: 'initiatePaymentFlow',
    inputSchema: InitiatePaymentInputSchema,
    outputSchema: InitiatePaymentOutputSchema,
  },
  async (input) => {
    // This section is configured for SIMULATION.
    // Replace with a real fetch call to your payment provider (e.g., Genie) when ready.
    console.log('Backend Bridge: Simulating payment token generation...');
    await new Promise(resolve => setTimeout(resolve, 800));

    const paymentToken = `sim_token_${Date.now()}`;
    const checkoutUrl = `/dashboard/checkout?token=${paymentToken}`;

    return { paymentToken, checkoutUrl };
  }
);


/**
 * Flow: placeOrderAfterPaymentFlow
 * Finalizes the order in Firestore after a successful payment.
 */
const placeOrderAfterPaymentFlow = ai.defineFlow(
  {
    name: 'placeOrderAfterPaymentFlow',
    inputSchema: PlaceOrderInputSchema,
    outputSchema: z.object({ orderId: z.string() }),
  },
  async ({ userId, checkoutData, transactionId }) => {
    await ensureAuthenticated();
    const batch = writeBatch(db);
    
    const rootOrderRef = doc(collection(db, 'orders'));
    const userOrderRef = doc(db, 'users', userId, 'orders', rootOrderRef.id);
    const userProfileRef = doc(db, 'users', userId);

    const orderItems: OrderItem[] = checkoutData.cart.map((item: any) => {
      const orderItem: OrderItem = {
        menuItemId: item.menuItem.id,
        menuItemName: item.menuItem.name,
        quantity: item.quantity,
        basePrice: item.menuItem.price,
        totalPrice: item.totalPrice,
        addons: item.addons || [],
      };
      if (item.appliedDailyOfferId) {
        orderItem.appliedDailyOfferId = item.appliedDailyOfferId;
      }
      return orderItem;
    });

    let pointsToEarn = 0;
    const total = checkoutData.cartTotal;
    if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
    else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
    else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
    else pointsToEarn = Math.floor(total / 400);

    const orderData: Omit<Order, 'id'> = {
      customerId: userId,
      orderDate: serverTimestamp() as any,
      totalAmount: total,
      status: "Placed",
      paymentStatus: "Paid",
      transactionId: transactionId,
      orderItems: orderItems,
      orderType: checkoutData.orderType,
      tableNumber: checkoutData.tableNumber || '',
      pointsToEarn: pointsToEarn,
      pointsRedeemed: checkoutData.loyaltyDiscount || 0,
      discountApplied: checkoutData.totalDiscount || 0,
      serviceCharge: checkoutData.serviceCharge || 0,
      welcomeOfferApplied: (checkoutData.welcomeDiscountAmount || 0) > 0,
    };
    
    batch.set(rootOrderRef, orderData);
    batch.set(userOrderRef, orderData);

    const userUpdates: any = {
      loyaltyPoints: increment(pointsToEarn - (checkoutData.loyaltyDiscount || 0)),
      lifetimePoints: increment(pointsToEarn),
      orderCount: increment(1),
    };

    const today = format(new Date(), 'yyyy-MM-dd');
    const redeemedOffers: Record<string, string> = {};
    orderItems.forEach(item => {
      if (item.appliedDailyOfferId) {
        redeemedOffers[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
      }
    });

    if (Object.keys(redeemedOffers).length > 0) {
        batch.update(userProfileRef, redeemedOffers);
    }
    batch.update(userProfileRef, userUpdates);

    await batch.commit();
    return { orderId: rootOrderRef.id };
  }
);

// --- EXPORTED SERVER ACTIONS ---

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
  return initiatePaymentFlow(input);
}

export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ orderId: string }> {
  return placeOrderAfterPaymentFlow(input);
}
