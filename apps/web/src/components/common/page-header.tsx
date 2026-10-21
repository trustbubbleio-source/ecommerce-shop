import type { DocumentMetaInput } from '../../hooks/use-document-meta';
import { DocumentMeta } from './document-meta';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** When false, skip document title / OG updates (nested headers). Default true. */
  seo?: boolean;
  /** Override SEO robots / path / image when needed. */
  seoOptions?: Omit<DocumentMetaInput, 'title' | 'description'>;
}

export function PageHeader({
  title,
  description,
  children,
  seo = true,
  seoOptions,
}: PageHeaderProps) {
  return (
    <>
      {seo ? <DocumentMeta title={title} description={description} {...seoOptions} /> : null}
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {description && <p className="text-muted-foreground max-w-2xl">{description}</p>}
        {children}
      </header>
    </>
  );
}
