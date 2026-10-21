import { PolicyDocument, type PolicySection } from '../components/common/policy-document';
import { SITE } from '../config/site';

const UPDATED = '21 October 2026';

const SECTIONS: PolicySection[] = [
  {
    id: 'trader',
    title: '1. Trader identity',
    body: [
      `${SITE.legalName} is the seller behind onemorerip.cards and the physical shop in Båstad.`,
      `Legal form: ${SITE.legalForm} (enskild firma).`,
      `Organisation number (organisationsnummer): ${SITE.organisationNumber}.`,
      `VAT / momsregistreringsnummer: ${SITE.vatNumber}.`,
    ],
  },
  {
    id: 'address',
    title: '2. Business address',
    body: [
      SITE.store.line,
      `Map: ${SITE.store.mapsUrl}`,
    ],
  },
  {
    id: 'contact',
    title: '3. Contact',
    body: [
      `General: ${SITE.email.contact}`,
      `Customer support: ${SITE.email.support} (${SITE.supportHours})`,
      `Orders: ${SITE.email.orders}`,
      `Returns & withdrawals: ${SITE.email.returns}`,
      `Billing: ${SITE.email.billing}`,
      `Privacy: ${SITE.email.privacy}`,
    ],
  },
  {
    id: 'online',
    title: '4. Online store',
    body: [
      `Website: ${SITE.url}`,
      'Orders placed on the website are distance contracts under EU/Swedish consumer law. Mandatory consumer information also appears in Terms, Returns & Refunds, Shipping, Privacy, and Cookie Policy.',
    ],
  },
  {
    id: 'dispute',
    title: '5. Dispute resolution',
    body: [
      'EU consumers may use the European Commission Online Dispute Resolution (ODR) platform: https://ec.europa.eu/consumers/odr',
      `We prefer to resolve issues directly — email ${SITE.email.support} first.`,
    ],
  },
];

export function ImprintPage() {
  return (
    <PolicyDocument
      title="Company information"
      description="Legal identity, address, and contact details for One More Rip (imprint / företagsinformation)."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
