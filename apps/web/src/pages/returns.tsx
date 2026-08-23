import { PolicyDocument, type PolicySection } from '../components/common/policy-document';
import { SITE } from '../config/site';

const UPDATED = '23 August 2026';

const SECTIONS: PolicySection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    body: [
      `This Returns & Refunds policy explains how ${SITE.legalName} handles cancellations, amendments, returns and refunds for orders placed at onemorerip.cards.`,
      'It is designed for consumers under EU and Swedish distance-selling rules, including the statutory 14-day right of withdrawal (ångerrätt) where it applies. Your mandatory consumer rights are never limited by this policy.',
    ],
  },
  {
    id: 'before-dispatch',
    title: '2. Cancel or amend before dispatch',
    body: [
      `Contact us as soon as possible at ${SITE.emailContact} (or via the Contact page) with your order number if you need to cancel, change the delivery address, or amend line items.`,
      'If the order has not yet been packed or handed to the carrier, we will normally cancel or amend it free of charge and refund any amount already paid for cancelled items (including related shipping if the whole order is cancelled and nothing has shipped).',
      'We aim to confirm cancellations and amendments within one business day during support hours.',
    ],
  },
  {
    id: 'after-dispatch',
    title: '3. After the order has been dispatched',
    body: [
      'Once an order has been packed and handed to the carrier, we cannot change the destination address or cancel the shipment in transit through our warehouse process.',
      'You may still have a statutory right of withdrawal after you receive the goods (see section 4), or a right to a remedy if goods are faulty or not as described (see section 6).',
      'If you refuse delivery or the parcel is returned to us because of an error in the address you provided, see section 7 regarding supplementary costs.',
    ],
  },
  {
    id: 'withdrawal',
    title: '4. 14-day right of withdrawal (ångerrätt)',
    body: [
      'If you are a consumer in the EU/EEA buying at a distance, you generally have 14 days from the day you receive the goods to withdraw from the purchase without giving a reason, in line with the EU Consumer Rights Directive and Swedish law.',
      'How to withdraw: email us within the 14-day period at ' +
        SITE.emailContact +
        ' with your order number and a clear statement that you want to withdraw. You may use a standard withdrawal form if you prefer, but it is not required.',
      'You must then return the goods without undue delay and no later than 14 days after telling us you withdraw. Goods should be unused and in original condition suitable for resale. Factory-sealed products should remain sealed.',
      'Exceptions: the right of withdrawal may not apply (or may be lost) for sealed goods that are unsealed after delivery where those goods are not suitable for return for health or hygiene reasons or similar statutory exceptions, and for goods made to your specifications. Opened booster packs and similar opened sealed product are typically not returnable under withdrawal once opened. Singles listed as final sale remain final sale unless faulty or not as described.',
      'Refunds after a valid withdrawal: we refund the price paid for the returned goods, and the cheapest standard outbound shipping you paid, within 14 days of receiving the returned goods or proof of return — whichever is earlier. We may withhold the refund until we have received the goods or adequate evidence of return.',
      'Return shipping cost for a withdrawal: unless we agree otherwise or the goods are faulty/not as described, you normally pay the cost of returning the goods. We will tell you how to send them back when you contact us.',
    ],
  },
  {
    id: 'process',
    title: '5. How to start a return',
    body: [
      `Email ${SITE.emailContact} with your order number, what you want to return, and whether it is a withdrawal, a fault, or a wrong item.`,
      'We will confirm eligibility and give return instructions. For eligible domestic returns of faulty or incorrectly sent goods, we typically provide a prepaid label. For withdrawals of non-faulty goods, return postage is usually paid by you unless stated otherwise.',
      'Please pack items securely. Keep proof of postage until the refund is complete.',
    ],
  },
  {
    id: 'faulty',
    title: '6. Faulty, damaged or not as described',
    body: [
      'If goods arrive damaged, incomplete, or not as described, contact us as soon as possible — ideally within 48 hours of delivery — with photos of the outer packaging and the product.',
      'Under Swedish consumer sales rules you have remedies for faulty goods (repair, replacement, price reduction or refund, as applicable). We will not ask you to cover return shipping for a valid fault or packing error claim.',
      'Missing items: email your order number and a photo of what you received. We will ship the missing item or refund it after verification.',
    ],
  },
  {
    id: 'liability',
    title: '7. Delayed, lost or misrouted orders — costs & responsibility',
    body: [
      'We distinguish between problems caused by incorrect information you provided, problems caused by us, and problems caused by the carrier while the parcel is in transit.',
      'Your responsibility: if delay, loss, return-to-sender, or extra carrier fees are caused by an incorrect, incomplete or inaccessible delivery address or contact details you provided, you may be charged reasonable supplementary costs for re-delivery or the return shipment. We will tell you the amount before charging where possible.',
      'Our responsibility: if we send the wrong address from our side, pack incorrectly, or otherwise cause a misroute or loss before handing the parcel to the carrier, we cover the cost of putting it right (re-ship or refund) and you do not pay those supplementary shipping costs.',
      'Carrier responsibility / in transit: once tracked dispatch has occurred, investigation of delay, loss or misrouting follows the carrier’s process. Contact us with your order number and tracking ID. We will open a claim where appropriate. If the parcel is confirmed lost or undeliverable due to carrier failure (and not due to your address error), we will re-ship or refund the goods. You are not automatically liable for all shipping risk merely because a parcel is late.',
      'Customs delays on international orders are often outside our and the carrier’s direct control; we will still help you interpret tracking and advise next steps.',
      'Nothing in this section limits mandatory consumer rights under Swedish or EU law.',
    ],
  },
  {
    id: 'refunds',
    title: '8. How refunds are paid',
    body: [
      'Refunds are issued to the original payment method used at checkout (for example the card charged via Stripe), unless we agree another method with you.',
      'Bank/card issuers may take several business days to show the credit on your statement after we submit the refund.',
    ],
  },
  {
    id: 'contact',
    title: '9. Contact for returns',
    body: [
      `Customer service: ${SITE.emailContact}`,
      `Business address: ${SITE.legalName}, ${SITE.store.line}`,
      `We aim to reply ${SITE.supportHours}.`,
    ],
  },
];

export function ReturnsPage() {
  return (
    <PolicyDocument
      title="Returns & Refunds"
      description="Cancel or amend before dispatch, withdraw after delivery, and how we handle damaged, lost or misrouted orders under EU/Swedish consumer rules."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
