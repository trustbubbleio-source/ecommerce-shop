import { Link } from 'react-router-dom';
import { PageHeader } from './page-header';
import { SITE } from '../../config/site';

export interface PolicySection {
  id: string;
  title: string;
  body: string[];
}

export function PolicyDocument({
  title,
  description,
  updated,
  sections,
}: {
  title: string;
  description: string;
  updated: string;
  sections: PolicySection[];
}) {
  return (
    <div className="container max-w-3xl py-8">
      <PageHeader title={title} description={description} />
      <p className="text-muted-foreground mb-8 text-sm">Last updated: {updated}</p>

      <nav
        aria-label={`${title} sections`}
        className="border-border bg-card/40 mb-10 rounded-xl border p-4 sm:p-5"
      >
        <p className="text-foreground mb-3 text-sm font-semibold">On this page</p>
        <ol className="columns-1 gap-x-8 sm:columns-2">
          {sections.map((section) => (
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
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-foreground mb-3 text-xl font-bold tracking-tight">{section.title}</h2>
            <div className="flex flex-col gap-3">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 64)}
                  className="text-muted-foreground text-sm leading-relaxed sm:text-base"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="text-muted-foreground border-border mt-12 border-t pt-6 text-sm">
        Questions?{' '}
        <Link to="/contact" className="text-foreground font-medium hover:underline">
          Contact us
        </Link>{' '}
        or email{' '}
        <a
          href={`mailto:${SITE.emailContact}`}
          className="text-foreground font-medium hover:underline"
        >
          {SITE.emailContact}
        </a>
        .
      </p>
    </div>
  );
}
