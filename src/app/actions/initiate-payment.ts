'use server';

import { initiatePayment } from '@/ai/flows/payment-flow';

export async function initiatePaymentAction(input: { amount: number, origin: string }) {
  return initiatePayment(input);
}
