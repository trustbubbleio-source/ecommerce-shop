import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE, formatPrice } from '@akknerds/shared';
import { PolicyDocument, type PolicySection } from '../components/common/policy-document';
import { SITE } from '../config/site';

const UPDATED = '23 August 2026';
const fee = formatPrice(FLAT_SHIPPING_FEE);
const freeAt = formatPrice(FREE_SHIPPING_THRESHOLD);

const SECTIONS: PolicySection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    body: [
      `${SITE.legalName} ships sealed Pokémon TCG and related products from Sweden to customers in Sweden, the EU/EEA and selected other countries. This page explains delivery methods, costs, times and geographic notes before you place an order.`,
      'Shipping is calculated automatically at checkout based on your cart subtotal. We do not charge hidden fulfilment fees at payment.',
    ],
  },
  {
    id: 'methods',
    title: '2. Delivery methods',
    body: [
      'Standard tracked parcel delivery — all paid orders ship with tracking once the carrier accepts the parcel.',
      'We currently offer a single standard tracked service at checkout. Carrier assignment may vary by destination (for example PostNord or equivalent partners within Sweden/EU, and international postal/courier partners abroad).',
      'You will receive a dispatch email with tracking details when your order leaves us. Tracking can take a short time to activate after the label is created.',
    ],
  },
  {
    id: 'costs',
    title: '3. Delivery costs',
    body: [
      `Flat rate: ${fee} on orders with a subtotal below ${freeAt}.`,
      `Free shipping: standard tracked shipping is free when your order subtotal is ${freeAt} or more.`,
      'The exact shipping amount is shown in your cart and again at checkout before you pay.',
    ],
  },
  {
    id: 'times',
    title: '4. Dispatch & estimated delivery times',
    body: [
      'Dispatch: Orders placed before 14:00 (Europe/Stockholm) on business days (Monday–Friday, excluding Swedish public holidays) are usually dispatched the same business day when stock allows. Orders after that cut-off, or on weekends/holidays, are usually dispatched the next business day.',
      'Sweden (domestic): typically 2–4 business days after dispatch.',
      'EU/EEA: typically 3–7 business days after dispatch, depending on the destination country and carrier.',
      'Rest of world: typically 5–12 business days after dispatch. Customs clearance can add time beyond our control.',
      'These are normal estimates, not guaranteed delivery dates. Peak seasons, weather, strikes or customs checks may extend transit time.',
    ],
  },
  {
    id: 'geography',
    title: '5. Geographic coverage & restrictions',
    body: [
      'We ship to Sweden and most EU/EEA destinations, and to many countries worldwide where carriers and export rules allow.',
      'We may decline or cancel an order if we cannot legally or practically ship to your address (for example sanctioned destinations, carrier embargoes, or incomplete address data). If that happens we will contact you and refund any amount already charged.',
      'International orders may be subject to import VAT, duties and brokerage fees charged by the destination country. Those charges are the recipient’s responsibility unless local law says otherwise, and are not included in our checkout total.',
    ],
  },
  {
    id: 'address',
    title: '6. Delivery address accuracy',
    body: [
      'You are responsible for providing a complete and correct delivery address and contact details at checkout.',
      'If a parcel is delayed, returned, or incurs extra carrier fees because of an incorrect or incomplete address you provided, you may be asked to cover reasonable re-delivery or return-to-sender costs. See Returns & Refunds for how we handle lost, delayed and misrouted parcels.',
    ],
  },
  {
    id: 'contact',
    title: '7. Questions about shipping',
    body: [
      `Email ${SITE.email.support} or ${SITE.email.orders}, or use the Contact page. We aim to reply ${SITE.supportHours}.`,
      'For cancellation, returns and liability after dispatch, see Returns & Refunds.',
    ],
  },
];

export function ShippingPage() {
  return (
    <PolicyDocument
      title="Shipping & Delivery"
      description="How we ship, what it costs, and how long delivery normally takes — so you know before you order."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
