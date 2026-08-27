import {
  formatPrice,
  type ProductSeries,
  type ProductSet,
} from '@akknerds/shared';
import { Button, Input, Spinner, useToast, type InputProps } from '@akknerds/ui';
import { useMutation } from '@tanstack/react-query';
import { Wand2 } from 'lucide-react';
import type { ProductFormValues } from '../../pages/admin/product-form-common';
import { ApiError, api } from '@akknerds/api-client';

type PriceFetchContext = Pick<
  ProductFormValues,
  'category' | 'series' | 'set' | 'cardNumber' | 'language' | 'name'
>;

export function canAutoFetchCardPrice(context: PriceFetchContext): boolean {
  return (
    context.category === 'single-card' &&
    context.language === 'english' &&
    Boolean(context.series && context.set && context.cardNumber.trim())
  );
}

const AUTO_PRICE_TITLE = 'Load ungraded market price from PriceCharting';
const AUTO_PRICE_DISABLED_HINT =
  'Set series, set, card number and English language to auto-load price';

interface SingleCardPriceFieldProps {
  inputProps: InputProps;
  price: string;
  onPriceChange: (price: string) => void;
  context: PriceFetchContext;
}

export function SingleCardPriceField({
  inputProps,
  price,
  onPriceChange,
  context,
}: SingleCardPriceFieldProps) {
  const { toast } = useToast();
  const canFetch = canAutoFetchCardPrice(context);
  const showAutoButton = context.category === 'single-card';

  const fetchPrice = useMutation({
    mutationFn: () =>
      api.adminFetchCardPrice({
        category: 'single-card',
        series: context.series as ProductSeries,
        set: context.set as ProductSet,
        cardNumber: context.cardNumber.trim(),
        language: 'english',
      }),
    onSuccess: (result) => {
      onPriceChange((result.priceCents / 100).toFixed(2));
      toast({
        title: 'Price loaded',
        description: `${result.cardName} — ${formatPrice(result.priceCents)} ungraded`,
        variant: 'success',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not load price',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  if (!showAutoButton) {
    return (
      <Input
        {...inputProps}
        inputMode="decimal"
        value={price}
        onChange={(event) => onPriceChange(event.target.value)}
      />
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        {...inputProps}
        className="min-w-0 flex-1"
        inputMode="decimal"
        value={price}
        onChange={(event) => onPriceChange(event.target.value)}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-10 shrink-0"
        disabled={!canFetch || fetchPrice.isPending}
        title={canFetch ? AUTO_PRICE_TITLE : AUTO_PRICE_DISABLED_HINT}
        aria-label={AUTO_PRICE_TITLE}
        onClick={() => fetchPrice.mutate()}
      >
        {fetchPrice.isPending ? <Spinner /> : <Wand2 className="size-4" />}
      </Button>
    </div>
  );
}
