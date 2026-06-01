import { z } from 'zod';

export const addCartItemSchema = z.object({
  businessSlug: z.string().default('weaz'),
  productId: z.string().uuid(),
  quantity: z.number().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().positive(),
});

export const checkoutSchema = z.object({
  businessSlug: z.string().default('weaz'),
  delivery_address: z.string().optional(),
  customer_note: z.string().optional(),
});

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
