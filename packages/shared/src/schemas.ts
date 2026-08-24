import { z } from 'zod';
import {
  CARD_CONDITIONS,
  CARD_RARITIES,
  PRODUCT_CATEGORIES,
  PRODUCT_LANGUAGES,
  PRODUCT_SERIES,
  PRODUCT_SETS,
  PRODUCT_TAGS,
  isSetInSeries,
} from './enums.js';

export const PRODUCT_NAME_MAX_LENGTH = 50;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 1500;

/** Collector number: plain (208) or fraction (208/325). */
export const CARD_NUMBER_PATTERN = /^\d+(?:\/\d+)?$/;

export const createProductInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(PRODUCT_NAME_MAX_LENGTH, `Name must be ${PRODUCT_NAME_MAX_LENGTH} characters or fewer`),
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .max(
        PRODUCT_DESCRIPTION_MAX_LENGTH,
        `Description must be ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters or fewer`,
      ),
    category: z.enum(PRODUCT_CATEGORIES),
    set: z.enum(PRODUCT_SETS),
    series: z.enum(PRODUCT_SERIES),
    /** Price in cents. */
    price: z.number().int().positive('Price must be greater than zero'),
    compareAtPrice: z.number().int().positive().optional(),
    stock: z.number().int().min(1, 'Stock must be at least 1'),
    accent: z
      .string()
      .trim()
      .regex(/^#[0-9a-f]{6}$/i, 'Accent must be a hex colour like #a855f7'),
    images: z
      .array(z.string().min(1))
      .min(1, 'At least one image is required')
      .max(12),
    featured: z.boolean().optional(),
    isNew: z.boolean().optional(),
    tags: z.array(z.enum(PRODUCT_TAGS)).max(12).optional(),
    cardNumber: z
      .string()
      .trim()
      .regex(CARD_NUMBER_PATTERN, 'Use a card number like 208 or 208/325')
      .optional(),
    rarity: z.enum(CARD_RARITIES, { required_error: 'Rarity is required' }),
    condition: z.enum(CARD_CONDITIONS, { required_error: 'Condition is required' }),
    language: z.enum(PRODUCT_LANGUAGES),
    releaseDate: z.string().trim().min(1, 'Release date is required'),
  })
  .superRefine((data, ctx) => {
    if (!isSetInSeries(data.set, data.series)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['set'],
        message: 'Set does not belong to the selected series',
      });
    }
  });

export const fetchCardImageInputSchema = z
  .object({
    category: z.enum(['single-card', 'graded-slab'], {
      errorMap: () => ({ message: 'Card fetch is only available for singles and graded slabs' }),
    }),
    set: z.enum(PRODUCT_SETS),
    series: z.enum(PRODUCT_SERIES),
    cardNumber: z.string().trim().min(1, 'Card number is required'),
    language: z.enum(['english', 'japanese'], {
      errorMap: () => ({ message: 'Card fetch supports English or Japanese only' }),
    }),
  })
  .superRefine((data, ctx) => {
    if (!isSetInSeries(data.set, data.series)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['set'],
        message: 'Set does not belong to the selected series',
      });
    }
  });

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
  /** Preferred charge/display currency. Catalog is EUR; SEK is converted server-side. */
  currency: z.enum(['eur', 'sek']).optional(),
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
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof createProductInputSchema>;
export type FetchCardImageInput = z.infer<typeof fetchCardImageInputSchema>;

/** Admin product updates use the same shape as create. */
export const updateProductInputSchema = createProductInputSchema;
