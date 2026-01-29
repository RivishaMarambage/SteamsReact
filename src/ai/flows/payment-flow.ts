import { z } from 'genkit';

/**
 * =========================
 * Initiate Payment Schemas
 * =========================
 */

export const InitiatePaymentInputSchema = z.object({
  amount: z
    .number()
    .positive()
    .describe('The total amount for the payment. Must be greater than 0.'),
});

export type InitiatePaymentInput = z.infer<typeof InitiatePaymentInputSchema>;

export const InitiatePaymentOutputSchema = z.object({
  paymentToken: z
    .string()
    .min(1)
    .describe('The secure token generated for this payment session.'),

  checkoutUrl: z
    .string()
    .url()
    .describe('The URL for the user to complete payment.'),
});

export type InitiatePaymentOutput = z.infer<typeof InitiatePaymentOutputSchema>;

/**
 * =========================
 * Order Placement Schemas
 * =========================
 */

const CartItemAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().nonnegative(),
});

const MenuItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number().nonnegative(),
  categoryId: z.string(),
  imageUrl: z.string().optional(),
  isOutOfStock: z.boolean().optional(),

  addonGroups: z
    .array(
      z.object({
        addonCategoryId: z.string(),
        isRequired: z.boolean(),
        minSelection: z.number().nonnegative(),
        maxSelection: z.number().nonnegative(),
      })
    )
    .optional(),
});

const CartItemSchema = z.object({
  id: z.string(),
  menuItem: MenuItemSchema,
  quantity: z.number().min(1),
  addons: z.array(CartItemAddonSchema).optional(),
  totalPrice: z.number().nonnegative(),
  appliedDailyOfferId: z.string().optional(),
});

export const PlaceOrderInputSchema = z.object({
  userId: z.string(),

  checkoutData: z.object({
    cartTotal: z.number().nonnegative(),

    orderType: z.enum(['Dine-in', 'Takeaway']),

    loyaltyDiscount: z.number().nonnegative(),
    totalDiscount: z.number().nonnegative(),
    serviceCharge: z.number().nonnegative(),

    tableNumber: z.string().optional(),

    welcomeDiscountAmount: z.number().nonnegative(),
    birthdayDiscountAmount: z.number().nonnegative(),

    cart: z.array(CartItemSchema).min(1),
  }),

  transactionId: z
    .string()
    .min(1)
    .describe('The transaction ID from the payment gateway.'),
});

export type PlaceOrderInput = z.infer<typeof PlaceOrderInputSchema>;
