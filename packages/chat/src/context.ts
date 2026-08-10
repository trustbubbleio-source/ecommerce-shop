import { FREE_SHIPPING_THRESHOLD, formatPrice } from '@akknerds/shared';

export interface ChatLink {
  label: string;
  href: string;
}

export interface ChatContext {
  brandName: string;
  supportEmail: string;
  freeShippingLabel: string;
}

export function createChatContext(input: {
  brandName: string;
  supportEmail: string;
}): ChatContext {
  return {
    brandName: input.brandName,
    supportEmail: input.supportEmail,
    freeShippingLabel: formatPrice(FREE_SHIPPING_THRESHOLD),
  };
}
