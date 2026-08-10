import { isCardStyleCategory } from '@akknerds/shared';
import { useEffect, useRef } from 'react';
import {
  type ProductFormValues,
  cardListingDescriptionFor,
} from '../pages/admin/product-form-common';

export function useSingleCardAutoCopy(
  values: ProductFormValues,
  setValues: React.Dispatch<React.SetStateAction<ProductFormValues>>,
) {
  const descriptionIsAuto = useRef(false);

  useEffect(() => {
    if (!isCardStyleCategory(values.category)) return;
    const auto = cardListingDescriptionFor(values);
    if (!auto) return;
    if (!descriptionIsAuto.current && values.description.trim()) return;
    if (values.description === auto) return;
    descriptionIsAuto.current = true;
    setValues((current) =>
      current.description === auto ? current : { ...current, description: auto },
    );
  }, [values.category, values.name, values.rarity, values.condition, setValues, values.description]);

  const applyFetchedCard = (cardName?: string | null) => {
    descriptionIsAuto.current = true;
    setValues((current) => ({
      ...current,
      name: cardName?.trim() && !current.name.trim() ? cardName.trim() : current.name,
    }));
  };

  const setDescription = (description: string) => {
    descriptionIsAuto.current = description.trim() === '';
    setValues((current) => ({ ...current, description }));
  };

  return { applyFetchedCard, setDescription };
}
