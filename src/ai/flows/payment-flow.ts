'use server';

/**
 * @fileOverview Secure Backend Bridge for Genie Payment gateway interactions.
 * Mutation logic has been moved to the client-side to ensure reliable authentication 
 * and compliance with client-side mutation guidelines.
 */

import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
} from './payment-schemas';

/**
 * Initiates a payment session with Genie.
 * Must remain on the server to protect the GENIE_API_KEY.
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
 * Must remain on the server to protect the GENIE_API_KEY.
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
