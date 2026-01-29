'use server';
/**
 * @fileOverview Schemas for Payment and Order Finalization.
 */

import { z } from 'genkit';

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


// Schemas for placing the order after payment
const CartItemAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

const MenuItemAddonGroupSchema = z.object({
  addonCategoryId: z.string(),
  isRequired: z.boolean(),
  minSelection: z.number().nonnegative(),
  maxSelection: z.number().nonnegative(),
});

const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  categoryId: z.string(),
  imageUrl: z.string().optional(),
  isOutOfStock: z.boolean().optional(),
  addonGroups: z.array(MenuItemAddonGroupSchema).optional(),
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
        welcomeDiscountAmount: z.number(),
        birthdayDiscountAmount: z.number(),
        totalDiscount: z.number(),
        serviceCharge: z.number(),
        tableNumber: z.string().optional(),
        cart: z.array(CartItemSchema),
    }),
    transactionId: z.string().describe("The transaction ID from the payment gateway."),
});
export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
