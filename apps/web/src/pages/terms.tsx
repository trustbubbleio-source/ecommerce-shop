import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING_FEE, formatPrice } from '@akknerds/shared';
import { PolicyDocument, type PolicySection } from '../components/common/policy-document';
import { SITE } from '../config/site';

const UPDATED = '23 August 2026';
const fee = formatPrice(FLAT_SHIPPING_FEE);
const freeAt = formatPrice(FREE_SHIPPING_THRESHOLD);

const SECTIONS: PolicySection[] = [
  {
    id: 'agreement',
    title: '1. Agreement',
    body: [
      `These Terms & Conditions (“Terms”) govern purchases from ${SITE.legalName} (“we”, “us”) via onemorerip.cards and related customer services.`,
      `Merchant: ${SITE.legalName}. Place of business: ${SITE.store.line}. Customer service: ${SITE.emailContact}.`,
      'By placing an order you confirm that you are at least 18 years old (or have parental/guardian consent where required) and that you accept these Terms. If you shop as a consumer in the EU/EEA, mandatory consumer protection rules apply in addition to these Terms and prevail if there is a conflict.',
    ],
  },
  {
    id: 'products',
    title: '2. Products & authenticity',
    body: [
      'We sell sealed Pokémon TCG products, singles, graded slabs and accessories. Product images are illustrative; minor packaging differences can occur between print runs.',
      'Sealed product is sourced as factory-sealed stock. Singles are described by condition on the product page. Stock counts can change; if an item cannot be fulfilled we will contact you and refund that line.',
    ],
  },
  {
    id: 'orders',
    title: '3. Orders & pricing',
    body: [
      'An order is an offer to buy. We accept the order when we confirm it (confirmation page/email) and process payment. We may refuse or cancel an order in cases such as pricing errors, suspected fraud, export restrictions, or inability to deliver.',
      'Prices are shown in the currency indicated at checkout and include applicable VAT where required for the destination, unless stated otherwise. Shipping is added as described on Shipping & Delivery.',
      `Current standard shipping: ${fee} below ${freeAt} subtotal; free standard shipping at or above ${freeAt}.`,
    ],
  },
  {
    id: 'payment',
    title: '4. Payment',
    body: [
      'Payment is processed by Stripe or other providers shown at checkout. We do not store full card numbers on our servers.',
      'You authorise us (and our payment provider) to charge the selected payment method for the order total including shipping.',
    ],
  },
  {
    id: 'shipping',
    title: '5. Shipping & delivery',
    body: [
      'Delivery methods, costs, times and geographic notes are set out on the Shipping & Delivery page, which forms part of these Terms.',
      'Risk of loss or damage to goods in transit follows applicable Swedish/EU consumer sales rules. See also Returns & Refunds regarding delayed, lost or misrouted parcels.',
    ],
  },
  {
    id: 'withdrawal',
    title: '6. Withdrawal, cancellations & returns',
    body: [
      'Consumer withdrawal rights, cancellations before/after dispatch, returns and refunds are described on the Returns & Refunds page, which forms part of these Terms.',
      'EU/EEA consumers generally have a 14-day right of withdrawal for distance contracts, subject to statutory exceptions (including certain sealed goods unsealed after delivery).',
    ],
  },
  {
    id: 'liability',
    title: '7. Liability',
    body: [
      'We are liable for faults according to mandatory Swedish consumer sales law when you buy as a consumer.',
      'To the extent permitted by law for non-consumers, we are not liable for indirect loss. Nothing in these Terms excludes liability for death or personal injury caused by negligence, fraud, or other liability that cannot be limited under applicable law.',
    ],
  },
  {
    id: 'ip',
    title: '8. Intellectual property',
    body: [
      'Pokémon and related marks are trademarks of their respective owners (including Nintendo / The Pokémon Company). We are an independent retailer and are not endorsed by those rights holders unless expressly stated.',
      'Website content, branding and product photography owned by us may not be reused for commercial purposes without permission.',
    ],
  },
  {
    id: 'law',
    title: '9. Governing law & disputes',
    body: [
      'These Terms are governed by Swedish law, without prejudice to mandatory consumer protections in your country of residence within the EU/EEA.',
      'Consumers may use the EU Online Dispute Resolution platform or contact the Swedish National Board for Consumer Disputes (ARN) where applicable. You may also bring proceedings in your local courts as allowed by EU consumer rules.',
    ],
  },
  {
    id: 'changes',
    title: '10. Changes',
    body: [
      'We may update these Terms from time to time. The version published on this page when you place an order applies to that order. Material changes will show a new “Last updated” date.',
    ],
  },
];

export function TermsPage() {
  return (
    <PolicyDocument
      title="Terms & Conditions"
      description="The rules for shopping with One More Rip — orders, payment, shipping, withdrawal rights and Swedish/EU consumer protections."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
