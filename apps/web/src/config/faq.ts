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
          'Orders placed before 2pm (Mon–Fri) are dispatched the same business day. Standard domestic delivery typically arrives in 2–4 business days. Express options reach most addresses in 1–2 business days. International delivery varies by destination — usually 5–12 business days.',
      },
      {
        question: 'What delivery options do you offer?',
        answer:
          'We offer Standard (tracked), Express (priority tracked), and Click & Collect where available. At checkout you can choose the option that fits your timeline. All shipments include tracking once the parcel leaves our warehouse.',
      },
      {
        question: 'Do you offer free shipping?',
        answer:
          'Yes — standard shipping is free on domestic orders over $75. Below that threshold, rates are calculated at checkout based on weight and destination. Promotional free-shipping windows are announced on the homepage and via email.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'We ship to most countries worldwide. International orders may be subject to import duties and taxes, which are the responsibility of the recipient. Delivery times and carriers are shown at checkout before you pay.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'Once dispatched, you will receive an email with a tracking link. You can also view tracking details on your order confirmation page and in your account under My orders. Tracking may take a few hours to activate after the label is created.',
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
          'Contact us as soon as possible if you need to change an address or cancel. We can usually amend orders that have not yet been packed. Once dispatched, changes are not possible — but we can help with returns if needed.',
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
          'Unopened sealed product in original condition can be returned within 14 days of delivery for a refund or store credit. Singles and opened product are final sale unless they arrive not as described. Contact us to start a return — we will provide a prepaid label for eligible domestic returns.',
      },
      {
        question: 'What if my package arrives damaged?',
        answer:
          'Photograph the outer packaging and product damage, then contact us within 48 hours of delivery. We will arrange a replacement or refund. Keeping the original packaging helps us file a claim with the carrier.',
      },
      {
        question: 'What if an item is missing from my order?',
        answer:
          'Rare packing errors can happen. Email us your order number and a photo of everything received. We will ship the missing item or refund it — usually within one business day of verification.',
      },
    ],
  },
];
