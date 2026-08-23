import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/page-header';
import { SITE } from '../config/site';

const UPDATED = '23 August 2026';

const SECTIONS: { id: string; title: string; body: string[] }[] = [
  {
    id: 'overview',
    title: '1. Overview',
    body: [
      `${SITE.legalName} (“we”, “us”, “our”) operates the online store at onemorerip.cards and the physical store at ${SITE.store.line}. This Privacy Policy explains how we collect, use, store, and share personal data when you browse our website, create an account, place an order, subscribe to updates, or contact us.`,
      'We process personal data in accordance with the EU General Data Protection Regulation (GDPR) and applicable Swedish data protection law.',
    ],
  },
  {
    id: 'data-we-collect',
    title: '2. Data we collect',
    body: [
      'Account and profile data: name, email address, password (stored hashed), and optional account preferences.',
      'Order and fulfilment data: billing and shipping address, phone number (if provided), order contents, payment status, and delivery information.',
      'Communications: messages you send via our contact form, email, or chat, including any details you choose to share.',
      'Technical and usage data: IP address, browser type, device information, pages viewed, and approximate location derived from IP — used for security, analytics, and service improvement.',
      'Marketing preferences: whether you have opted in to receive drop alerts, restocks, or newsletter emails.',
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How we use your data',
    body: [
      'To process and fulfil orders, handle payments, shipping, returns, and customer support.',
      'To create and maintain your account, and to keep our shop secure (fraud prevention, abuse detection).',
      'To send transactional messages (order confirmations, shipping updates). Marketing emails are sent only with your consent, and you can unsubscribe at any time.',
      'To improve our website, catalogue, and operations using aggregated or anonymised analytics where possible.',
      'To comply with legal obligations (tax, accounting, consumer law) and to establish or defend legal claims.',
    ],
  },
  {
    id: 'legal-bases',
    title: '4. Legal bases (GDPR)',
    body: [
      'Contract: processing required to take steps prior to a contract or to perform a purchase with you.',
      'Legitimate interests: securing our services, improving the shop experience, and responding to enquiries — balanced against your rights.',
      'Consent: optional marketing communications and non-essential cookies or similar technologies, where required.',
      'Legal obligation: retaining invoices and records required under Swedish and EU law.',
    ],
  },
  {
    id: 'sharing',
    title: '5. Sharing with service providers',
    body: [
      'We do not sell your personal data. We share data only with trusted processors who help us run the business, under appropriate agreements, for example:',
      'Payment processors (e.g. Stripe) to handle card payments securely — we do not store full card numbers on our servers.',
      'Hosting, infrastructure, and email delivery providers that process data on our instructions.',
      'Shipping and logistics partners needed to deliver your order.',
      'Professional advisers (legal, accounting) when strictly necessary.',
      `We may disclose data if required by law, regulation, or valid legal process, or to protect the rights, property, or safety of ${SITE.legalName}, our customers, or the public.`,
    ],
  },
  {
    id: 'cookies',
    title: '6. Cookies and local storage',
    body: [
      'We use essential cookies and local storage for core shop functions such as keeping you signed in, remembering your cart, and securing checkout.',
      'Where we use analytics or similar tools that are not strictly necessary, we will request consent where required by law. You can control cookies through your browser settings; disabling essential storage may limit shop functionality. Full details are in our Cookie Policy.',
    ],
  },
  {
    id: 'retention',
    title: '7. Retention',
    body: [
      'We keep personal data only as long as needed for the purposes described above. Order and invoice records are retained for the periods required by Swedish bookkeeping and tax rules. Account data is kept while your account remains active and deleted or anonymised within a reasonable period after closure, unless we must retain it for legal reasons. Support correspondence is kept as long as needed to resolve your enquiry and for related compliance.',
    ],
  },
  {
    id: 'rights',
    title: '8. Your rights',
    body: [
      'Depending on applicable law, you may have the right to access, rectify, erase, or restrict processing of your personal data; to object to certain processing; to data portability; and to withdraw consent at any time (without affecting prior lawful processing).',
      `To exercise these rights, contact us at ${SITE.email.privacy}. You also have the right to lodge a complaint with the Swedish Authority for Privacy Protection (IMY) or another competent supervisory authority in the EU.`,
    ],
  },
  {
    id: 'international',
    title: '9. International transfers',
    body: [
      'Our primary operations are in Sweden (EU). If personal data is transferred outside the EEA, we use appropriate safeguards such as Standard Contractual Clauses or an adequacy decision, as required by GDPR.',
    ],
  },
  {
    id: 'children',
    title: '10. Children',
    body: [
      'Our shop is intended for adults and collectors with legal capacity to purchase. We do not knowingly collect personal data from children under 16. If you believe a child has provided us data, contact us and we will take appropriate steps to delete it.',
    ],
  },
  {
    id: 'changes',
    title: '11. Changes to this policy',
    body: [
      'We may update this Privacy Policy from time to time. The “Last updated” date at the top of this page will change when we do. Material changes may also be communicated by email or a notice on the website where appropriate.',
    ],
  },
  {
    id: 'contact',
    title: '12. Contact',
    body: [
      `Controller: ${SITE.legalName}, ${SITE.store.line}.`,
      `Privacy and data requests: ${SITE.email.privacy}.`,
      `General support: ${SITE.email.support}.`,
      'You can also use our Contact page for general enquiries.',
    ],
  },
];

export function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader
        title="Privacy Policy"
        description={`How ${SITE.legalName} collects, uses, and protects your personal data when you shop with us online or in store.`}
      />
      <p className="text-muted-foreground mb-4 text-sm">Last updated: {UPDATED}</p>
      <p className="text-muted-foreground mb-10 text-sm">
        See also our{' '}
        <Link to="/cookies" className="text-foreground font-medium hover:underline">
          Cookie Policy
        </Link>
        .
      </p>

      <nav
        aria-label="Privacy sections"
        className="border-border bg-card/40 mb-10 rounded-xl border p-4 sm:p-5"
      >
        <p className="text-foreground mb-3 text-sm font-semibold">On this page</p>
        <ol className="columns-1 gap-x-8 sm:columns-2">
          {SECTIONS.map((section) => (
            <li key={section.id} className="mb-1.5 break-inside-avoid">
              <a
                href={`#${section.id}`}
                className="text-muted-foreground hover:text-foreground text-sm hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex flex-col gap-10">
        {SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-foreground mb-3 text-xl font-bold tracking-tight">{section.title}</h2>
            <div className="flex flex-col gap-3">
              {section.body.map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="text-muted-foreground text-sm leading-relaxed sm:text-base">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground border-border mt-12 border-t pt-6 text-sm">
        Questions about privacy?{' '}
        <Link to="/contact" className="text-foreground font-medium hover:underline">
          Contact us
        </Link>{' '}
        or email{' '}
        <a href={`mailto:${SITE.email.privacy}`} className="text-foreground font-medium hover:underline">
          {SITE.email.privacy}
        </a>
        .
      </p>
    </div>
  );
}
