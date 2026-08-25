import {
  CARD_CONDITIONS,
  CARD_RARITIES,
  PRODUCT_CATEGORIES,
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_LANGUAGES,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_SERIES,
  categoryLabel,
  conditionLabel,
  createProductInputSchema,
  isCardStyleCategory,
  languageLabel,
  productImageUrls,
  rarityLabel,
  setsForSeries,
  type CardCondition,
  type CardRarity,
  type CreateProductInput,
  type Product,
  type ProductCategory,
  type ProductLanguage,
  type ProductSeries,
  type ProductSet,
} from '@akknerds/shared';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Skeleton,
  Spinner,
  Textarea,
  useToast,
} from '@akknerds/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Sparkles, X } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSingleCardAutoCopy } from '../../hooks/use-single-card-auto-copy';
import { ApiError, api } from '../../lib/api';
import { ProductTagPicker, normalizeProductTags } from '../../components/admin/product-tag-picker';
import { ProductVisibilityFields } from '../../components/admin/product-visibility-fields';
import { SingleCardPriceField } from '../../components/admin/single-card-price-field';
import {
  PRODUCT_NAME_GUIDE,
  buildProductDraft,
  collectImageKeys,
  defaultProductFormValues,
  type ImageDraft,
  type ProductFormValues,
} from './product-form-common';

function productToFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    category: product.category,
    series: product.series,
    set: product.set,
    price: (product.price / 100).toFixed(2),
    stock: String(product.stock),
    accent: product.accent,
    releaseDate: product.releaseDate,
    cardNumber: product.cardNumber ?? '',
    artist: product.artist ?? '',
    rarity: product.rarity ?? '',
    condition: product.condition ?? '',
    language: product.language,
    tags: normalizeProductTags(product.tags),
    featured: product.featured,
    isNew: product.isNew,
  };
}

function productToImageDrafts(product: Product, cdn?: string): ImageDraft[] {
  return productImageUrls(product, cdn).map((previewUrl, index) => ({
    previewUrl,
    s3Key: product.images[index],
  }));
}

export function AdminEditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cdn = import.meta.env.VITE_ASSET_CDN_URL;

  const productQuery = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => api.adminGetProduct(id!),
    enabled: Boolean(id),
  });

  const [values, setValues] = useState<ProductFormValues>(defaultProductFormValues);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const { applyFetchedCard, setDescription } = useSingleCardAutoCopy(values, setValues);

  useEffect(() => {
    const product = productQuery.data?.product;
    if (!product || hydratedId === product.id) return;
    setValues(productToFormValues(product));
    setImages(productToImageDrafts(product, cdn));
    setHydratedId(product.id);
  }, [productQuery.data, hydratedId, cdn]);

  const updateProduct = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error('missing id');
      const keys = await collectImageKeys(images, api.adminUploadImages);

      const input: CreateProductInput = {
        ...buildProductDraft(values, keys.length),
        images: keys,
      };

      const parsed = createProductInputSchema.safeParse(input);
      if (!parsed.success) {
        const next: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? 'form');
          next[key] ??= issue.message;
        }
        setErrors(next);
        throw new Error('validation');
      }

      return api.adminUpdateProduct(id, parsed.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product updated', variant: 'success' });
      navigate('/admin');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'validation') return;
      toast({
        title: 'Could not update product',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const canSave = useMemo(
    () => createProductInputSchema.safeParse(buildProductDraft(values, images.length)).success,
    [values, images.length],
  );

  const canFetchCardImage =
    isCardStyleCategory(values.category) &&
    Boolean(values.series && values.set && values.cardNumber.trim()) &&
    (values.language === 'english' || values.language === 'japanese');

  const fetchCardImage = useMutation({
    mutationFn: () =>
      api.adminFetchCardImage({
        category: values.category as 'single-card' | 'graded-slab',
        series: values.series as ProductSeries,
        set: values.set as ProductSet,
        cardNumber: values.cardNumber.trim(),
        language: values.language as 'english' | 'japanese',
      }),
    onSuccess: (result) => {
      setImages((current) => {
        if (current.length >= 12) return current;
        const previewUrl = result.previewUrl ?? '';
        if (!previewUrl) return current;
        return [...current, { previewUrl, s3Key: result.key }];
      });
      toast({
        title: result.cached ? 'Card image ready' : 'Card image fetched',
        description: result.cardName,
        variant: 'success',
      });
      if (result.cardName) {
        applyFetchedCard(result.cardName);
      }
    },
    onError: (error) => {
      toast({
        title: 'Could not fetch card image',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const onPickImages = (fileList: FileList | null) => {
    if (!fileList) return;
    const next = [...images];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/')) continue;
      next.push({ file, previewUrl: URL.createObjectURL(file) });
    }
    setImages(next.slice(0, 12));
  };

  const removeImage = (index: number) => {
    setImages((current) => {
      const target = current[index];
      if (target?.file) URL.revokeObjectURL(target.previewUrl);
      return current.filter((_, i) => i !== index);
    });
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrors({});
    updateProduct.mutate();
  };

  const nameGuide = PRODUCT_NAME_GUIDE[values.category];

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (productQuery.isError || !productQuery.data?.product) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-extrabold tracking-tight">Product not found</h1>
        <Button variant="outline" asChild>
          <Link to="/admin">Back to products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Edit product</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Update price, stock, images and other catalog details.
        </p>
        <p className="text-muted-foreground mt-1 font-mono text-xs">{productQuery.data.product.id}</p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {errors.images && (
              <p className="text-destructive text-sm" role="alert">
                {errors.images}
              </p>
            )}
            <label className="border-border hover:bg-muted/40 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center transition-colors">
              <ImagePlus className="text-muted-foreground size-8" />
              <span className="text-sm font-medium">Choose images</span>
              <span className="text-muted-foreground text-xs">JPEG, PNG, WebP or GIF · up to 12 · 5 MB each</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => onPickImages(e.target.files)}
              />
            </label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.previewUrl}-${index}`}
                    className="bg-muted/50 border-border relative w-full max-w-[220px] overflow-hidden rounded-xl border sm:max-w-[280px]"
                  >
                    <div className="aspect-[5/7] w-full">
                      <img src={image.previewUrl} alt="" className="size-full object-contain p-3" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                      onClick={() => removeImage(index)}
                      aria-label="Remove image"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field
              label="Card number"
              error={errors.cardNumber}
              hint={
                isCardStyleCategory(values.category)
                  ? 'For singles and slabs, e.g. 178/165 or 286. Fetch needs series, set and EN/JP language too.'
                  : 'For singles, e.g. 178/165'
              }
            >
              {(props) => (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Input
                    {...props}
                    className="flex-1"
                    value={values.cardNumber}
                    onChange={(e) => setValues((v) => ({ ...v, cardNumber: e.target.value }))}
                    placeholder="178/165"
                  />
                  {isCardStyleCategory(values.category) && (
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0"
                      disabled={!canFetchCardImage || fetchCardImage.isPending || images.length >= 12}
                      onClick={() => fetchCardImage.mutate()}
                    >
                      {fetchCardImage.isPending ? <Spinner /> : <Sparkles className="size-4" />}
                      Fetch card image
                    </Button>
                  )}
                </div>
              )}
            </Field>
            <Field
              label="Artist"
              error={errors.artist}
              hint="Illustrator name — customers can search by artist once set."
            >
              {(props) => (
                <Input
                  {...props}
                  value={values.artist}
                  onChange={(e) => setValues((v) => ({ ...v, artist: e.target.value }))}
                  placeholder="e.g. Mitsuhiro Arita"
                />
              )}
            </Field>
            <Field label="Product name" error={errors.name} hint={nameGuide.hint} required>
              {(props) => (
                <Input
                  {...props}
                  maxLength={PRODUCT_NAME_MAX_LENGTH}
                  value={values.name}
                  placeholder={nameGuide.placeholder}
                  onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
                />
              )}
            </Field>
            <Field
              label="Description"
              error={errors.description}
              hint={
                isCardStyleCategory(values.category)
                  ? 'Filled automatically after image fetch when condition (and rarity for singles) is set. Edit to override.'
                  : `Up to ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters`
              }
              required
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
                  value={values.description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
            </Field>
            <ProductTagPicker
              value={values.tags}
              onChange={(tags) => setValues((v) => ({ ...v, tags }))}
              error={errors.tags}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" error={errors.category} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.category}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, category: e.target.value as ProductCategory }))
                    }
                    options={PRODUCT_CATEGORIES.map((category) => ({
                      value: category,
                      label: categoryLabel(category),
                    }))}
                  />
                )}
              </Field>
              <Field label="Accent colour" error={errors.accent} required>
                {(props) => (
                  <Input
                    {...props}
                    value={values.accent}
                    onChange={(e) => setValues((v) => ({ ...v, accent: e.target.value }))}
                  />
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Series" error={errors.series} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.series}
                    onChange={(e) => {
                      const series = e.target.value as ProductSeries | '';
                      setValues((v) => {
                        const nextSets = setsForSeries(series);
                        const keepSet =
                          series && v.set && nextSets.includes(v.set as ProductSet) ? v.set : '';
                        return { ...v, series, set: keepSet };
                      });
                    }}
                    options={[
                      { value: '', label: 'Select a series' },
                      ...PRODUCT_SERIES.map((series) => ({ value: series, label: series })),
                    ]}
                  />
                )}
              </Field>
              <Field label="Set" error={errors.set} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.set}
                    disabled={!values.series}
                    onChange={(e) => setValues((v) => ({ ...v, set: e.target.value as ProductSet }))}
                    options={[
                      { value: '', label: values.series ? 'Select a set' : 'Choose series first' },
                      ...setsForSeries(values.series).map((set) => ({ value: set, label: set })),
                    ]}
                  />
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Language" error={errors.language} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.language}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, language: e.target.value as ProductLanguage }))
                    }
                    options={PRODUCT_LANGUAGES.map((language) => ({
                      value: language,
                      label: languageLabel(language),
                    }))}
                  />
                )}
              </Field>
              <Field label="Rarity" error={errors.rarity} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.rarity}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, rarity: e.target.value as CardRarity | '' }))
                    }
                    options={[
                      { value: '', label: 'Select rarity' },
                      ...CARD_RARITIES.map((rarity) => ({
                        value: rarity,
                        label: rarityLabel(rarity),
                      })),
                    ]}
                  />
                )}
              </Field>
              <Field label="Condition" error={errors.condition} required>
                {(props) => (
                  <Select
                    {...props}
                    value={values.condition}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, condition: e.target.value as CardCondition | '' }))
                    }
                    options={[
                      { value: '', label: 'Select condition' },
                      ...CARD_CONDITIONS.map((condition) => ({
                        value: condition,
                        label: conditionLabel(condition),
                      })),
                    ]}
                  />
                )}
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="Price (EUR)"
                error={errors.price}
                required
                hint={
                  values.category === 'single-card'
                    ? 'Use the wand to load today’s ungraded PriceCharting price (English sets).'
                    : undefined
                }
              >
                {(props) => (
                  <SingleCardPriceField
                    inputProps={props}
                    price={values.price}
                    onPriceChange={(price) => setValues((v) => ({ ...v, price }))}
                    context={values}
                  />
                )}
              </Field>
              <Field label="Stock" error={errors.stock} hint="Must be at least 1" required>
                {(props) => (
                  <Input
                    {...props}
                    inputMode="numeric"
                    value={values.stock}
                    onChange={(e) => setValues((v) => ({ ...v, stock: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Release date" error={errors.releaseDate} required>
                {(props) => (
                  <Input
                    {...props}
                    type="date"
                    value={values.releaseDate}
                    onChange={(e) => setValues((v) => ({ ...v, releaseDate: e.target.value }))}
                  />
                )}
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Homepage</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductVisibilityFields
              value={values}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={!canSave || updateProduct.isPending}>
            {updateProduct.isPending && <Spinner className="text-primary-foreground" />}
            Save changes
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
