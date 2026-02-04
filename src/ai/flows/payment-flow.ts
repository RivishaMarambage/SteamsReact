
'use server';

/**
 * @fileOverview Secure Backend Bridge for Genie Payment gateway interactions and order finalization.
 */

import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  PlaceOrderInput,
} from './payment-schemas';
import { adminDb } from '@/firebase/server-init';
import { FieldValue } from 'firebase-admin/firestore';
import { format } from 'date-fns';

/**
 * Initiates a payment session with Genie.
 */
export async function initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    console.log('--- Genie Payment Request Initiated ---');
    
    const apiKey = process.env.GENIE_API_KEY;

    if (!apiKey) {
      throw new Error("Genie API key is not configured in environment variables.");
    }

    // Convert amount to cents and round to avoid floating point issues
    const amountInCents = Math.round(input.amount * 100);

    const requestBody = {
      amount: amountInCents,
      currency: 'LKR',
      localId: `order_${Date.now()}`,
      redirectUrl: `${input.origin}/dashboard/order-success`,
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
        console.error("Genie API Error Response:", errorText);
        throw new Error(`Failed to initiate payment with Genie: ${response.statusText} (${response.status})`);
      }

      const responseData = await response.json();
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

  // Correct endpoint for refund creation according to Genie docs
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

/**
 * Finalizes an order in the database after a successful payment.
 * This is a secure server-side operation using the Admin SDK.
 */
export async function placeOrderAfterPayment(input: PlaceOrderInput): Promise<{ success: boolean; orderId: string }> {
    console.log("--- Finalizing Order on Server ---", input.transactionId);
    
    try {
        const { userId, checkoutData, transactionId } = input;
        const batch = adminDb.batch();

        const rootOrderRef = adminDb.collection('orders').doc();
        const userOrderRef = adminDb.collection('users').doc(userId).collection('orders').doc(rootOrderRef.id);
        const userProfileRef = adminDb.collection('users').doc(userId);

        // Map cart items to the database OrderItem schema
        const orderItems = checkoutData.cart.map((item: any) => ({
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
        }));

        // Calculate points to earn (Business logic stays on server)
        let pointsToEarn = 0;
        const total = checkoutData.cartTotal;
        if (total > 10000) pointsToEarn = Math.floor(total / 100) * 2;
        else if (total >= 5000) pointsToEarn = Math.floor(total / 100);
        else if (total >= 1000) pointsToEarn = Math.floor(total / 200);
        else pointsToEarn = Math.floor(total / 400);

        const orderData = {
            id: rootOrderRef.id,
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

        // Update user stats
        const userUpdates: any = {
            loyaltyPoints: FieldValue.increment(-(checkoutData.loyaltyDiscount || 0)),
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

        // Record point redemption if applicable
        if (checkoutData.loyaltyDiscount > 0) {
            const transactionRef = userProfileRef.collection('point_transactions').doc();
            batch.set(transactionRef, {
                date: FieldValue.serverTimestamp(),
                description: `Redeemed for Order #${rootOrderRef.id.substring(0, 7).toUpperCase()}`,
                amount: -checkoutData.loyaltyDiscount,
                type: 'redeem'
            });
        }

        await batch.commit();
        console.log("Order finalized successfully:", rootOrderRef.id);
        
        return { success: true, orderId: rootOrderRef.id };

    } catch (error: any) {
        console.error("CRITICAL ERROR during placeOrderAfterPayment:", error);
        throw new Error(`Failed to finalize order: ${error.message}`);
    }
}
