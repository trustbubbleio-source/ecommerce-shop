import { useDocumentMeta, type DocumentMetaInput } from '../../hooks/use-document-meta';

/** Declarative document head updates for the current route. */
export function DocumentMeta(props: DocumentMetaInput) {
  useDocumentMeta(props);
  return null;
}
