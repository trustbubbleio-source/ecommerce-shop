import { z } from 'zod';

export const addressSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  line1: z.string().trim().min(1, 'Address is required').max(120),
  line2: z.string().trim().max(120).optional(),
  city: z.string().trim().min(1, 'City is required').max(80),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
  country: z.string().trim().min(2, 'Country is required').max(60),
});

export const cartLineSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutInputSchema = z.object({
  items: z.array(cartLineSchema).min(1, 'Your cart is empty'),
  email: z.string().trim().email('A valid email is required'),
  shippingAddress: addressSchema.optional(),
});

export const registerInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email: z.string().trim().email('A valid email is required'),
  subject: z.string().trim().min(1, 'Subject is required').max(120),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters')
    .max(2000, 'Message is too long'),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
