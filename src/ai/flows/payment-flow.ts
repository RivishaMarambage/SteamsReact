'use server';

/**
 * @fileOverview Secure Backend Bridge for Payment and Order Finalization.
 * Handles Firebase initialization, Genie Gateway simulation, and mandatory path structuring.
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
  getFirestore, 
} from 'firebase/firestore';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import type { Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';

// --- INITIALIZATION CONFIG ---
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Initialize Firebase only if no apps exist to avoid "Duplicate App" errors
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Ensures the backend process is authenticated before Firestore operations.
 */
async function ensureAuthenticated() {
  if (auth.currentUser) return auth.currentUser;
  if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
    const userCred = await signInWithCustomToken(auth, __initial_auth_token);
    return userCred.user;
  } else {
    const userCred = await signInAnonymously(auth);
    return userCred.user;
  }
}

// --- GENKIT FLOWS ---

/**
 * Flow: initiatePaymentFlow
 * Connects to the Genie Gateway to generate a checkout session.
 */
const initiatePaymentFlow = ai.defineFlow(
  {
    name: 'initiatePaymentFlow',
    inputSchema: InitiatePaymentInputSchema,
    outputSchema: InitiatePaymentOutputSchema,
  },
  async (input) => {
    console.log('Backend Bridge: Generating Genie Payment Token...');
    
    // Use credentials from .env
    const merchantId = process.env.GENIE_MERCHANT_ID;
    const apiKey = process.env.GENIE_API_KEY; // This should be the Merchant Secret

    if (!merchantId || !apiKey) {
      throw new Error('Genie Merchant ID or API Key is not configured in .env file.');
    }

    // This is a placeholder for the actual Genie API endpoint.
    // Refer to the official Genie documentation for the correct URL.
    const GENIE_TOKEN_ENDPOINT = "https://sandbox.genie.lk/api/v2/payment/token";

    // This is a sample payload. You must adjust this based on Genie's API requirements.
    const payload = {
      amount: input.amount,
      // You may need to generate a unique order ID here to pass to Genie
      orderId: `order_${Date.now()}`, 
      // The URL Genie will redirect to after payment
      returnUrl: 'https://' + (process.env.NEXT_PUBLIC_APP_ID || 'your-app-id') + '.web.app/dashboard',
      // The URL Genie will send a server-to-server confirmation to.
      callbackUrl: 'https://' + (process.env.NEXT_PUBLIC_APP_ID || 'your-app-id') + '.web.app/api/payment-callback'
    };

    try {
      // NOTE: This is an example of how to make the API call.
      // You will need to consult the Genie documentation for the exact details of the request and response.
      const response = await fetch(GENIE_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Genie API Error:', errorBody);
        throw new Error(`Genie API request failed with status ${response.status}`);
      }

      const genieResponse = await response.json();
      
      // Assuming the response from Genie has this structure.
      // Adjust based on the actual API response.
      const paymentToken = genieResponse.token;
      const checkoutUrl = genieResponse.checkoutUrl;

      if (!paymentToken || !checkoutUrl) {
          throw new Error('Invalid response from Genie API. Missing token or checkoutUrl.');
      }

      return { paymentToken, checkoutUrl };

    } catch (error) {
      console.error("Error contacting Genie API:", error);
      // Fallback to simulation on error for development purposes.
      // In production, you would want to throw the error.
      const paymentToken = `sim_error_token_${Date.now()}`;
      const checkoutUrl = `https://sandbox.genie.lk/checkout?token=${paymentToken}&mch=${merchantId}`;
      return { paymentToken, checkoutUrl };
    }
  }
);

/**
 * Flow: placeOrderAfterPaymentFlow
 * Finalizes the order in Firestore using mandatory path structures.
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
    const userProfileRef = doc(db, 'users', userId);
    const userOrderRef = doc(db, 'users', userId, 'orders', rootOrderRef.id);

    // 1. Map Cart Items to Order Items
    const orderItems: OrderItem[] = checkoutData.cart.map((item: any) => ({
      menuItemId: item.menuItem.id,
      menuItemName: item.menuItem.name,
      quantity: item.quantity,
      basePrice: item.menuItem.price,
      totalPrice: item.totalPrice,
      addons: item.addons || []
    }));

    // 2. Calculate Loyalty Points
    let pointsToEarn = 0;
    const total = checkoutData.cartTotal;
    if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
    else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
    else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
    else pointsToEarn = Math.floor(total / 400);

    const orderData: Partial<Order> & { customerId: string, orderItems: OrderItem[] } = {
      customerId: userId,
      orderDate: serverTimestamp(),
      totalAmount: total,
      status: "Placed",
      paymentStatus: "Paid",
      transactionId: transactionId,
      orderItems: orderItems,
      orderType: checkoutData.orderType,
      pointsToEarn: pointsToEarn,
      pointsRedeemed: checkoutData.loyaltyDiscount || 0,
      discountApplied: checkoutData.totalDiscount || 0,
      serviceCharge: checkoutData.serviceCharge || 0,
      welcomeOfferApplied: (checkoutData.welcomeDiscountAmount || 0) > 0,
    };
    
    if (checkoutData.orderType === 'Dine-in' && checkoutData.tableNumber) {
        orderData.tableNumber = checkoutData.tableNumber;
    }

    // 3. Batch Writes
    batch.set(rootOrderRef, orderData); // Save to global order tracker
    batch.set(userOrderRef, orderData); // Save to user's order history

    let netPointChange = pointsToEarn;

    // Handle point deduction if redeemed
    if (checkoutData.loyaltyDiscount > 0) {
      netPointChange -= checkoutData.loyaltyDiscount; // loyaltyDiscount IS the number of points
      const logRef = doc(collection(db, 'users', userId, 'point_transactions'));
      batch.set(logRef, {
        date: serverTimestamp(),
        amount: -checkoutData.loyaltyDiscount,
        type: 'redeem',
        description: `Order #${rootOrderRef.id.substring(0, 5)}`
      });
    }

    const userUpdates: any = {
      orderCount: increment(1), // Increment for every completed order
      loyaltyPoints: increment(netPointChange),
    };
    
    // Only increment lifetime points if points were earned
    if (pointsToEarn > 0) {
      userUpdates.lifetimePoints = increment(pointsToEarn);
    }

    // Handle daily offer tracking
    const today = format(new Date(), 'yyyy-MM-dd');
    orderItems.forEach((item: any) => {
      if (item.appliedDailyOfferId) {
        userUpdates[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
      }
    });

    // If birthday discount was used, clear it from the profile so it can't be used again
    if (checkoutData.birthdayDiscountAmount > 0) {
        userUpdates.birthdayDiscountValue = null;
        userUpdates.birthdayDiscountType = null;
        userUpdates.birthdayFreebieMenuItemIds = [];
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
