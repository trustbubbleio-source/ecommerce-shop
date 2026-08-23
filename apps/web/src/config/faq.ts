import type { LucideIcon } from 'lucide-react';
import { CreditCard, HelpCircle, Package, RotateCcw, Truck } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: FaqItem[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    icon: Truck,
    items: [
      {
        question: 'How long does delivery take?',
        answer:
          'Orders placed before 14:00 (Europe/Stockholm) on business days are usually dispatched the same day when stock allows. Sweden: typically 2–4 business days after dispatch. EU/EEA: typically 3–7 business days. Rest of world: typically 5–12 business days. Full details are on our Shipping & Delivery page.',
      },
      {
        question: 'What delivery options do you offer?',
        answer:
          'We offer standard tracked parcel delivery at checkout. All paid shipments include tracking once the carrier accepts the parcel. See Shipping & Delivery for carriers, geography and times.',
      },
      {
        question: 'Do you offer free shipping?',
        answer:
          'Yes — standard shipping is free on orders with a subtotal of $75 or more. Below that, a flat shipping fee of $5.99 applies. The amount is shown in your cart and at checkout before you pay.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'We ship to Sweden, most EU/EEA destinations, and many countries worldwide where carriers allow. International orders may be subject to import duties and taxes paid by the recipient. See Shipping & Delivery for details.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'Once dispatched, you will receive an email with a tracking link. You can also view tracking on your order confirmation page and in your account under My orders. Tracking may take a few hours to activate after the label is created.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure checkout. Apple Pay and Google Pay are available on supported devices. Local payment methods may appear at checkout depending on your region.',
      },
      {
        question: 'Is checkout secure?',
        answer:
          'Yes. Payments are processed by Stripe, a PCI Level 1 certified provider. We never store your full card number on our servers. All traffic is encrypted over HTTPS, and 3D Secure authentication is used where supported by your bank.',
      },
      {
        question: 'When am I charged?',
        answer:
          'Your card is authorised at checkout and captured when your order is confirmed. For pre-orders, you are charged upfront to reserve your allocation; we will email you before any item ships.',
      },
      {
        question: 'Can I use a different billing address?',
        answer:
          'Yes. Billing and shipping addresses can differ at checkout. If your bank flags the transaction, ensure the billing address matches what your card issuer has on file.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: Package,
    items: [
      {
        question: 'How do I know my order went through?',
        answer:
          'You will see an order confirmation screen immediately after payment, followed by a confirmation email with your order number. If you created an account, the order also appears under My account within a few minutes.',
      },
      {
        question: 'Can I change or cancel my order?',
        answer:
          'Contact us as soon as possible with your order number. Before dispatch we can usually cancel or amend free of charge. After dispatch we cannot change the address in transit — you may still use your 14-day withdrawal right after delivery where it applies. Full details: Returns & Refunds.',
      },
      {
        question: 'I did not receive a confirmation email',
        answer:
          'Check your spam or promotions folder first. If nothing arrives within 30 minutes, email us with your name and checkout email address and we will resend the confirmation or look up your order manually.',
      },
      {
        question: 'Do you offer pre-orders?',
        answer:
          'Selected high-demand sets are available for pre-order. The product page and checkout will clearly state the expected ship date. Pre-order items may ship separately from in-stock products in the same cart.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products & authenticity',
    icon: HelpCircle,
    items: [
      {
        question: 'Are your products authentic?',
        answer:
          'Every sealed product is sourced from authorised distributors and arrives factory-sealed. We never sell resealed or tampered product. Singles are inspected by our team before listing.',
      },
      {
        question: 'What condition are single cards in?',
        answer:
          'Singles are graded in-house as Mint, Near Mint, Lightly Played, or Moderately Played. The condition is shown on the product page and in your order details. We aim for Near Mint or better on all chase cards unless stated otherwise.',
      },
      {
        question: 'Will my booster box be shipped with outer shrink?',
        answer:
          'Yes — booster boxes and Elite Trainer Boxes ship in their original factory shrink where the manufacturer provides it. ETBs may ship in an outer cardboard shipper for protection.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & issues',
    icon: RotateCcw,
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'EU/Swedish consumers generally have a 14-day right of withdrawal for distance purchases. Unopened sealed product in original condition can be returned within 14 days of delivery. Singles and opened sealed product are typically final sale unless faulty or not as described. See Returns & Refunds for cancel-before-dispatch, after-dispatch, and lost/delayed parcel rules.',
      },
      {
        question: 'What if my package arrives damaged?',
        answer:
          'Photograph the outer packaging and product damage, then contact us within 48 hours of delivery. We will arrange a replacement or refund for valid claims. Keeping the original packaging helps with carrier claims.',
      },
      {
        question: 'What if an item is missing from my order?',
        answer:
          'Email us your order number and a photo of everything received. We will ship the missing item or refund it — usually within one business day of verification.',
      },
      {
        question: 'What if my order is delayed, lost or sent to the wrong place?',
        answer:
          'Contact us with your order number and tracking ID. If the issue is caused by an incorrect address you provided, you may need to cover reasonable re-delivery costs. If we or the carrier are at fault, we cover putting it right (re-ship or refund). Details are on Returns & Refunds §7.',
      },
    ],
  },
];
