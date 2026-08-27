/** Warehouse progress after payment. `received` is implied by a paid order. */
export const FULFILLMENT_STEPS = [
  'packing',
  'awaiting_pickup',
  'handed_to_carrier',
  'in_transit',
  'delivered',
] as const;

export type FulfillmentStep = (typeof FULFILLMENT_STEPS)[number];

export const FULFILLMENT_STEP_LABELS: Record<FulfillmentStep, string> = {
  packing: 'Packing',
  awaiting_pickup: 'Awaiting pickup',
  handed_to_carrier: 'Handed to carrier',
  in_transit: 'In transit',
  delivered: 'Delivered',
};

export function isFulfillmentStep(value: string): value is FulfillmentStep {
  return (FULFILLMENT_STEPS as readonly string[]).includes(value);
}

/** Paid orders start in packing; fulfilled orders are delivered. */
export function defaultFulfillmentStep(status: string): FulfillmentStep | null {
  if (status === 'fulfilled') return 'delivered';
  if (status === 'paid') return 'packing';
  return null;
}
