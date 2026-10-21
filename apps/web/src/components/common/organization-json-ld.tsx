import { SITE } from '../../config/site';

/** Organization + OnlineStore structured data for search engines. */
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.legalName,
    url: SITE.url,
    logo: SITE.ogImage,
    email: SITE.email.contact,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE.store.street,
      postalCode: SITE.store.postalCode,
      addressLocality: SITE.store.city,
      addressCountry: 'SE',
    },
    sameAs: Object.values(SITE.social),
  };

  return (
    <script
      type="application/ld+json"
      // JSON-LD must be raw text in the document head/body for crawlers.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
