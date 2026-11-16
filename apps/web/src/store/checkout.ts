import type { PaymentMethod } from '@akknerds/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CheckoutPhase =
  | 'idle'
  | 'creating'
  | 'ready'
  | 'submitting'
  | 'capturing'
  | 'error';

interface CheckoutState {
  orderId: string | null;
  paypalOrderId: string | null;
  method: PaymentMethod | null;
  phase: CheckoutPhase;
  error: string | null;
  /** Snapshot used to detect cart/address changes that require a fresh order. */
  fingerprint: string | null;
  setSession: (input: {
    orderId: string;
    paypalOrderId: string;
    method: PaymentMethod;
    fingerprint: string;
  }) => void;
  setPhase: (phase: CheckoutPhase) => void;
  setError: (error: string | null) => void;
  clear: () => void;
}

export const useCheckoutStore = create<CheckoutState>()(
  persist(
    (set) => ({
      orderId: null,
      paypalOrderId: null,
      method: null,
      phase: 'idle',
      error: null,
      fingerprint: null,
      setSession: ({ orderId, paypalOrderId, method, fingerprint }) =>
        set({
          orderId,
          paypalOrderId,
          method,
          fingerprint,
          phase: 'ready',
          error: null,
        }),
      setPhase: (phase) => set({ phase }),
      setError: (error) => set({ error, phase: error ? 'error' : 'ready' }),
      clear: () =>
        set({
          orderId: null,
          paypalOrderId: null,
          method: null,
          phase: 'idle',
          error: null,
          fingerprint: null,
        }),
    }),
    {
      name: 'omr-checkout',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        orderId: state.orderId,
        paypalOrderId: state.paypalOrderId,
        method: state.method,
        fingerprint: state.fingerprint,
      }),
    },
  ),
);

export function checkoutFingerprint(input: {
  email: string;
  items: Array<{ productId: string; quantity: number }>;
  deliveryMethod?: string;
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
  };
}): string {
  return JSON.stringify({
    email: input.email.trim().toLowerCase(),
    items: input.items,
    deliveryMethod: input.deliveryMethod ?? 'shipping',
    shippingAddress: input.shippingAddress,
  });
}
