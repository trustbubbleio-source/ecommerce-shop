import { PolicyDocument, type PolicySection } from '../components/common/policy-document';
import { SITE } from '../config/site';

const UPDATED = '23 August 2026';

const SECTIONS: PolicySection[] = [
  {
    id: 'overview',
    title: '1. Overview',
    body: [
      `This Cookie Policy explains how ${SITE.legalName} uses cookies and similar technologies on onemorerip.cards.`,
      'It should be read together with our Privacy Policy. For privacy requests email ' +
        SITE.emailPrivacy +
        '.',
    ],
  },
  {
    id: 'what',
    title: '2. What are cookies?',
    body: [
      'Cookies are small text files stored on your device. Similar technologies include local storage and session storage used by modern web apps.',
      'They can be session-based (deleted when you close the browser) or persistent (kept until they expire or you delete them).',
    ],
  },
  {
    id: 'types',
    title: '3. Types we use',
    body: [
      'Strictly necessary: required for the shop to work — for example keeping you signed in, remembering your cart, securing checkout, and load balancing. These do not require consent under EU/Swedish e-privacy rules when strictly necessary to provide the service you requested.',
      'Functional: remember preferences such as UI state where used.',
      'Analytics / statistics (if enabled): help us understand traffic and improve the site. Non-essential analytics are only used with your consent where required by law.',
      'Marketing (if enabled): measure campaigns or remarketing. Not used without consent where required.',
    ],
  },
  {
    id: 'examples',
    title: '4. Examples on this site',
    body: [
      'Authentication tokens / session data for logged-in customers.',
      'Cart and checkout-related local storage so your basket persists between visits.',
      'Security and fraud-prevention signals used by our hosting and payment providers (for example Stripe) during checkout.',
    ],
  },
  {
    id: 'manage',
    title: '5. How you can manage cookies',
    body: [
      'You can delete or block cookies in your browser settings. Blocking strictly necessary storage may break sign-in, cart or checkout.',
      'Where we present a consent banner for non-essential cookies, you can accept or refuse those categories and change your mind later by clearing site data or contacting us.',
      'Most desktop browsers include cookie controls under Settings → Privacy.',
    ],
  },
  {
    id: 'third-parties',
    title: '6. Third-party cookies',
    body: [
      'Payment and infrastructure providers may set their own cookies or similar technologies when you use checkout or embedded services. Those providers are responsible for their own technologies; see Stripe’s and our hosts’ documentation for details.',
    ],
  },
  {
    id: 'updates',
    title: '7. Updates',
    body: [
      'We may update this Cookie Policy when our tools or the law change. The “Last updated” date at the top will change when we do.',
    ],
  },
  {
    id: 'contact',
    title: '8. Contact',
    body: [
      `Privacy: ${SITE.emailPrivacy}`,
      `General support: ${SITE.emailContact}`,
      `${SITE.legalName}, ${SITE.store.line}`,
    ],
  },
];

export function CookiesPage() {
  return (
    <PolicyDocument
      title="Cookie Policy"
      description="How One More Rip uses cookies and similar technologies — what is necessary for the shop, and how you can control the rest."
      updated={UPDATED}
      sections={SECTIONS}
    />
  );
}
