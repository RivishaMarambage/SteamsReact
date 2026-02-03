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
    console.log('--- Genie Payment Request Initiated ---');
    console.log('Amount:', input.amount);
    console.log('Origin:', input.origin);

    const apiKey = process.env.GENIE_API_KEY;

    if (!apiKey) {
      throw new Error("Genie API key is not configured in environment variables.");
    }

    // Following Genie V2 Documentation
    // Amount must be in cents (integer)
    const amountInCents = Math.round(input.amount * 100);

    const requestBody = {
      amount: amountInCents,
      currency: 'LKR',
      localId: `order_${Date.now()}`,
      // Use the origin passed from the client to build the dynamic redirect URL
      redirectUrl: `${input.origin}/dashboard/order-success`,
    };

    console.log('Request Body:', JSON.stringify(requestBody));

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
        console.error("Genie API Error Response:", errorText);
        throw new Error(`Failed to initiate payment with Genie: ${response.statusText} (${response.status})`);
      }

      const responseData = await response.json();
      console.log('Genie API Success Response:', JSON.stringify(responseData));
      
      const checkoutUrl = responseData.url;

      if (!checkoutUrl) {
           throw new Error("Invalid response from Genie: missing checkout 'url'.");
      }

      return { checkoutUrl };

    } catch (error: any) {
      console.error("Connection Error to Genie:", error);
      throw new Error(`Could not connect to the payment gateway. Reason: ${error.message}`);
    }
}

/**
 * Finalizes an order in Firestore using Admin SDK privileges.
 */
export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ orderId: string }> {
    const { userId, checkoutData, transactionId } = input;
    
    console.log(`--- Finalizing Order for User: ${userId} ---`);
    console.log(`Transaction ID: ${transactionId}`);

    try {
        const batch = db.batch();

        const rootOrderRef = db.collection('orders').doc();
        const userOrderRef = db.collection('users').doc(userId).collection('orders').doc(rootOrderRef.id);
        const userProfileRef = db.collection('users').doc(userId);

        // Map cart items to the database OrderItem schema
        const orderItems: OrderItem[] = checkoutData.cart.map((item: any) => {
          return {
            menuItemId: item.menuItem.id,
            menuItemName: item.menuItem.name,
            quantity: item.quantity,
            basePrice: item.menuItem.price,
            totalPrice: item.totalPrice,
            addons: item.addons?.map((a: any) => ({
              addonId: a.id,
              addonName: a.name,
              addonPrice: a.price
            })) || [],
            appliedDailyOfferId: item.appliedDailyOfferId || null
          };
        });

        // Calculate loyalty points based on business rules
        let pointsToEarn = 0;
        const total = checkoutData.cartTotal;
        if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
        else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
        else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
        else pointsToEarn = Math.floor(total / 400);

        const orderData: any = {
          id: rootOrderRef.id, // Explicitly store the ID inside the document
          customerId: userId,
          orderDate: FieldValue.serverTimestamp(),
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
          // We increment orderCount here only if it was a welcome offer or if we want to track total lifetime orders
          orderCount: FieldValue.increment(1),
        };

        // Track redeemed daily offers
        const today = format(new Date(), 'yyyy-MM-dd');
        orderItems.forEach(item => {
          if (item.appliedDailyOfferId) {
            userUpdates[`dailyOffersRedeemed.${item.appliedDailyOfferId}`] = today;
          }
        });

        batch.update(userProfileRef, userUpdates);

        console.log("Committing batch write to Firestore...");
        await batch.commit();
        console.log("Batch write successful. Order ID:", rootOrderRef.id);
        
        return { orderId: rootOrderRef.id };

    } catch (error: any) {
        console.error("CRITICAL ERROR during placeOrderAfterPayment:", error);
        throw new Error(`Failed to finalize order: ${error.message}`);
    }
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

  const amountInCents = Math.round(amount * 100);

  const requestBody = {
    refundAmount: amountInCents,
    refundReason: "Order rejected by staff.",
  };

  const requestHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': apiKey,
  };

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
