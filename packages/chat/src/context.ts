import { FREE_SHIPPING_THRESHOLD, formatMoney } from '@akknerds/shared';

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
  /** Compact weekly hours for the physical store. */
  storeHoursSummary: string;
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
  storeHoursSummary?: string;
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
    freeShippingLabel: formatMoney(FREE_SHIPPING_THRESHOLD, 'sek'),
    storeLine: input.storeLine ?? 'Båstad, Sweden',
    storeHoursSummary:
      input.storeHoursSummary ??
      'Tue–Thu 13:00–19:00, Fri 13:00–20:00, Sat 11:00–15:00; closed Mon & Sun. Special times by appointment.',
    supportHours: input.supportHours ?? 'Monday–Friday, typically within one business day',
  };
}
