'use server';

/**
 * @fileOverview Secure Backend Bridge for Payment and Order Finalization.
 */

import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PlaceOrderInput,
} from './payment-schemas';
import { firestore as db } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import type { Order, OrderItem } from '@/lib/types';
import { format } from 'date-fns';

// --- EXPORTED SERVER ACTIONS ---

/**
 * Initiates a payment session with Genie.
 */
export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    console.log('Backend Bridge: Initiating live payment with Genie...');

    const apiKey = process.env.GENIE_API_KEY;

    if (!apiKey) {
      throw new Error("Genie API key is not configured in environment variables.");
    }

    // Following Genie V2 Documentation: https://api.geniebiz.lk/public/v2/transactions
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

    try {
      const response = await fetch('https://api.geniebiz.lk/public/v2/transactions', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Genie API Error:", errorText);
        throw new Error(`Failed to initiate payment with Genie: ${response.statusText}`);
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

/**
 * Finalizes an order in Firestore using Admin SDK privileges.
 */
export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ orderId: string }> {
    const { userId, checkoutData, transactionId } = input;
    const batch = db.batch();

    const rootOrderRef = db.collection('orders').doc();
    const userOrderRef = db.collection('users').doc(userId).collection('orders').doc(rootOrderRef.id);
    const userProfileRef = db.collection('users').doc(userId);

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

    // Calculate loyalty points based on business rules
    let pointsToEarn = 0;
    const total = checkoutData.cartTotal;
    if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
    else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
    else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
    else pointsToEarn = Math.floor(total / 400);

    const orderData: Omit<Order, 'id'> = {
      customerId: userId,
      orderDate: FieldValue.serverTimestamp() as any,
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

    // Update user stats and loyalty
    const userUpdates: any = {
      loyaltyPoints: FieldValue.increment(pointsToEarn - (checkoutData.loyaltyDiscount || 0)),
      lifetimePoints: FieldValue.increment(pointsToEarn),
      orderCount: FieldValue.increment(1),
    };

    // Track redeemed daily offers
    const today = format(new Date(), 'yyyy-MM-dd');
    const redeemedOffers: Record<string, string> = {};
    orderItems.forEach(item => {
      if (item.appliedDailyOfferId) {
        redeemedOffers[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
      }
    });

    if (Object.keys(redeemedOffers).length > 0) {
        Object.assign(userUpdates, redeemedOffers);
    }
    batch.update(userProfileRef, userUpdates);

    await batch.commit();
    return { orderId: rootOrderRef.id };
}

/**
 * Requests a refund for a transaction.
 */
export async function requestRefund(
  transactionId: string,
  amount: number
): Promise<{ success: boolean; message: string }> {
  const apiKey = process.env.GENIE_API_KEY;

  if (!apiKey) {
    throw new Error("Genie API key is not configured.");
  }

  const requestBody = {
    refundAmount: amount * 100, // Genie expects cents
    refundReason: "Order rejected by staff.",
  };

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': apiKey,
  };

  // Documentation specifies /public/transactions/{id}/refunds without V2 prefix for refunds
  const url = `https://api.geniebiz.lk/public/transactions/${transactionId}/refunds`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Genie Refund Error:", errorText);
      throw new Error(`Refund failed: ${response.statusText}`);
    }

    return { success: true, message: "Refund requested successfully." };

  } catch (error: any) {
    console.error("Error during refund:", error);
    throw new Error(`Could not process refund. ${error.message}`);
  }
}
