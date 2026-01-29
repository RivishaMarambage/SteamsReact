'use server';

/**
 * @fileOverview Secure Backend Bridge for Payment and Order Finalization.
 */

import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PlaceOrderInput,
} from './payment-schemas';
import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { initializeFirebaseAdmin } from '@/firebase/server-init';
import type { Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';

// --- INITIALIZATION ---
// This block ensures Firebase is initialized for server-side execution.
const { firestore: db } = initializeFirebaseAdmin();


// --- EXPORTED SERVER ACTIONS ---

export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    console.log('Backend Bridge: Initiating live payment with Genie...');

    const apiKey = process.env.GENIE_API_KEY;

    if (!apiKey) {
      throw new Error("Genie API key is not configured in environment variables.");
    }

    const requestBody = {
      amount: input.amount * 100, // Genie expects amount in cents
      currency: 'LKR',
      localId: `order_${Date.now()}`,
      redirectUrl: 'https://9000-firebase-studio-1763987265209.cluster-52r6vzs3ujeoctkkxpjif3x34a.cloudworkstations.dev/dashboard/order-success',
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': apiKey,
    };

    console.log("--- Genie Payment Request ---");
    console.log("Endpoint: POST https://api.geniebiz.lk/public/v2/transactions");
    console.log("Headers:", JSON.stringify(requestHeaders, null, 2));
    console.log("Request Body:", JSON.stringify(requestBody, null, 2));
    console.log("---------------------------");

    try {
      const response = await fetch('https://api.geniebiz.lk/public/v2/transactions', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Genie API Raw Error Response:", errorText);
        let errorMessage = `Status ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(`Failed to initiate payment with Genie: ${errorMessage}`);
      }

      const responseData = await response.json();

      const checkoutUrl = responseData.url;

      if (!checkoutUrl) {
           throw new Error("Invalid response from Genie: missing checkout 'url'.");
      }

      return { checkoutUrl };

    } catch (error: any) {
      console.error("Error connecting to Genie:", error);
      throw new Error(`Could not connect to the payment gateway. Reason: ${error.message}`);
    }
}

export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ orderId: string }> {
    const { userId, checkoutData, transactionId } = input;
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


export async function requestRefund(
  transactionId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  console.log(`Backend Bridge: Initiating refund for transaction ${transactionId}...`);

  const apiKey = process.env.GENIE_API_KEY;

  if (!apiKey) {
    throw new Error("Genie API key is not configured in environment variables.");
  }

  const requestBody = {
    refundAmount: amount * 100, // Genie expects amount in cents
    refundReason: "Order rejected by staff.",
  };

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': apiKey,
  };

  const url = `https://api.geniebiz.lk/public/v2/transactions/${transactionId}/refunds`;

  console.log("--- Genie Refund Request ---");
  console.log(`Endpoint: POST ${url}`);
  console.log("Headers:", JSON.stringify(requestHeaders, null, 2));
  console.log("Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("---------------------------");

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Genie API Raw Error Response:", errorText);
      let errorMessage = `Status ${response.status}: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Failed to process refund with Genie: ${errorMessage}`);
    }

    const responseData = await response.json();
    console.log("Genie Refund Response:", responseData);
    return { success: true, message: "Refund requested successfully." };

  } catch (error: any) {
    console.error("Error connecting to Genie for refund:", error);
    throw new Error(`Could not connect to the payment gateway for refund. Reason: ${error.message}`);
  }
}
