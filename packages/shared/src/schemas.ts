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
    artist: z
      .string()
      .trim()
      .max(80, 'Artist name is too long')
      .optional()
      .transform((v) => (v === '' || v === undefined ? undefined : v)),
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
  line2: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : v)),
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
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
});

export const resetPasswordInputSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const verifyEmailInputSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export const setPasswordInputSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

export const updateProfileInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80).optional(),
  phone: z
    .string()
    .trim()
    .max(40, 'Phone is too long')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  country: z
    .string()
    .trim()
    .max(80, 'Country is too long')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  city: z
    .string()
    .trim()
    .max(80, 'City is too long')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  bio: z
    .string()
    .trim()
    .max(280, 'Keep it under 280 characters')
    .optional()
    .nullable()
    .transform((v) => (v === '' ? null : v)),
  preferredCurrency: z.enum(['eur', 'sek']).optional(),
  marketingOptIn: z.boolean().optional(),
  /** Pass a full address to save, or null to clear the default shipping address. */
  shippingAddress: addressSchema.nullable().optional(),
  /**
   * Promo code to save on the profile (applied at checkout), or null/'' to clear.
   * Validity is checked against the shared discount catalogue.
   */
  discountCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(40, 'Code is too long')
    .nullable()
    .optional()
    .transform((v) => (v === '' || v == null ? null : v)),
});

export const googleAuthInputSchema = z.object({
  idToken: z.string().min(1, 'Google token is required'),
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

export const createProductReviewInputSchema = z.object({
  rating: z.number().int().min(1, 'Pick at least 1 star').max(5, 'Max 5 stars'),
  body: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters')
    .max(1000, 'Keep it under 1000 characters'),
});

export const sellRequestItemSchema = z.object({
  title: z.string().trim().min(1, 'Card name is required').max(120),
  notes: z.string().trim().max(500).optional().default(''),
  condition: z.string().trim().max(40).optional().default(''),
});

export const sellRequestInputSchema = z.object({
  notes: z.string().trim().max(2000).optional().default(''),
  items: z
    .array(sellRequestItemSchema)
    .min(1, 'Add at least one card')
    .max(8, 'Max 8 cards per submission'),
});

export const createWantListItemSchema = z.object({
  preset: z.enum([
    'singles-nm-en',
    'singles-nm-jp',
    'sealed-en',
    'sealed-jp',
    'graded-any',
    'custom',
  ]),
  title: z.string().trim().min(2, 'What are you looking for?').max(160),
  notes: z.string().trim().max(1000).optional().default(''),
});

export const updateWantListStatusSchema = z.object({
  status: z.enum(['pending', 'reviewing', 'accepted', 'rejected', 'found', 'contacted']),
  adminNote: z.string().trim().max(1000).nullable().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type CartLineInput = z.infer<typeof cartLineSchema>;
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordInputSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordInputSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthInputSchema>;
export type ContactInput = z.infer<typeof contactInputSchema>;
export type CreateProductReviewInput = z.infer<typeof createProductReviewInputSchema>;
export type SellRequestInput = z.infer<typeof sellRequestInputSchema>;
export type CreateWantListItemInput = z.infer<typeof createWantListItemSchema>;
export type UpdateWantListStatusInput = z.infer<typeof updateWantListStatusSchema>;
export type CreateProductInput = z.infer<typeof createProductInputSchema>;
export type UpdateProductInput = z.infer<typeof createProductInputSchema>;
export type FetchCardImageInput = z.infer<typeof fetchCardImageInputSchema>;

/** Admin product updates use the same shape as create. */
export const updateProductInputSchema = createProductInputSchema;
