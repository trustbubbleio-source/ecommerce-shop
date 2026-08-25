import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@akknerds/shared';

export interface ChatLink {
  label: string;
  href: string;
}

export interface ChatContext {
  brandName: string;
  supportEmail: string;
  contactEmail: string;
  ordersEmail: string;
  returnsEmail: string;
  privacyEmail: string;
  partnerEmail: string;
  tradeEmail: string;
  freeShippingLabel: string;
  storeLine: string;
  /** Human-readable launch / store opening date, e.g. "October 15, 2026". */
  launchDateLabel: string;
  supportHours: string;
}

export function createChatContext(input: {
  brandName: string;
  supportEmail: string;
  contactEmail?: string;
  ordersEmail?: string;
  returnsEmail?: string;
  privacyEmail?: string;
  partnerEmail?: string;
  tradeEmail?: string;
  storeLine?: string;
  launchDateLabel?: string;
  supportHours?: string;
}): ChatContext {
  return {
    brandName: input.brandName,
    supportEmail: input.supportEmail,
    contactEmail: input.contactEmail ?? input.supportEmail,
    ordersEmail: input.ordersEmail ?? input.supportEmail,
    returnsEmail: input.returnsEmail ?? input.supportEmail,
    privacyEmail: input.privacyEmail ?? input.supportEmail,
    partnerEmail: input.partnerEmail ?? input.supportEmail,
    tradeEmail: input.tradeEmail ?? input.supportEmail,
    freeShippingLabel: formatPrice(FREE_SHIPPING_THRESHOLD),
    storeLine: input.storeLine ?? 'Båstad, Sweden',
    launchDateLabel: input.launchDateLabel ?? 'October 15, 2026',
    supportHours: input.supportHours ?? 'Monday–Friday, typically within one business day',
  };
}
