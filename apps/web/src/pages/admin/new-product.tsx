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
  rarityLabel,
  setsForSeries,
  type CardCondition,
  type CardRarity,
  type CreateProductInput,
  type ProductCategory,
  type ProductLanguage,
  type ProductSeries,
  type ProductSet,
  type ProductTag,
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
  Spinner,
  Textarea,
  useToast,
} from '@akknerds/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Sparkles, X } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ProductTagPicker } from '../../components/admin/product-tag-picker';
import { ProductVisibilityFields } from '../../components/admin/product-visibility-fields';
import { SingleCardPriceField } from '../../components/admin/single-card-price-field';
import { useSingleCardAutoCopy } from '../../hooks/use-single-card-auto-copy';
import { ApiError, api } from '../../lib/api';

interface ImageDraft {
  previewUrl: string;
  file?: File;
  s3Key?: string;
}

const PRODUCT_NAME_GUIDE: Record<
  ProductCategory,
  { hint: string; placeholder: string }
> = {
  'single-card': {
    hint: 'Card title on the product page — include Pokémon, set and rarity if you like.',
    placeholder: 'Charizard ex — 151 (Special Illustration Rare)',
  },
  'graded-slab': {
    hint: 'Slab title — include Pokémon, grading company and score.',
    placeholder: 'Charizard ex PSA 10 — Phantasmal Flames',
  },
  'booster-box': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Booster Box',
  },
  'elite-trainer-box': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Elite Trainer Box',
  },
  'booster-pack': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Booster Pack',
  },
  bundle: {
    hint: 'Name of the bundle as shown on the product page.',
    placeholder: '151 Booster Bundle (6 packs)',
  },
  accessory: {
    hint: 'Product name as shown on the product page.',
    placeholder: 'Ultra Pro Eclipse Deck Box',
  },
};

const defaultValues = {
  name: '',
  description: '',
  category: 'booster-pack' as ProductCategory,
  series: '' as ProductSeries | '',
  set: '' as ProductSet | '',
  price: '',
  stock: '10',
  accent: '#a855f7',
  releaseDate: new Date().toISOString().slice(0, 10),
  cardNumber: '',
  rarity: '' as CardRarity | '',
  condition: '' as CardCondition | '',
  language: 'english' as ProductLanguage,
  tags: [] as ProductTag[],
  featured: false,
  isNew: true,
};

function buildCreateProductDraft(
  values: typeof defaultValues,
  imageCount: number,
): CreateProductInput {
  const price = Number.parseFloat(values.price);
  const stock = Number.parseInt(values.stock, 10);
  return {
    name: values.name,
    description: values.description,
    category: values.category,
    series: values.series as ProductSeries,
    set: values.set as ProductSet,
    price: Number.isFinite(price) ? Math.round(price * 100) : 0,
    stock: Number.isFinite(stock) ? stock : -1,
    accent: values.accent,
    images: imageCount > 0 ? Array.from({ length: imageCount }, () => 'pending') : [],
    isNew: values.isNew,
    featured: values.featured,
    releaseDate: values.releaseDate,
    cardNumber: values.cardNumber.trim() || undefined,
    rarity: values.rarity as CardRarity,
    condition: values.condition as CardCondition,
    language: values.language,
    tags: values.tags.length > 0 ? values.tags : undefined,
  };
}

export function AdminNewProductPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [values, setValues] = useState(defaultValues);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { applyFetchedCard, setDescription } = useSingleCardAutoCopy(values, setValues);

  const createProduct = useMutation({
    mutationFn: async () => {
      const keys: string[] = [];
      const filesToUpload: File[] = [];
      for (const image of images) {
        if (image.s3Key) keys.push(image.s3Key);
        else if (image.file) filesToUpload.push(image.file);
      }
      if (filesToUpload.length > 0) {
        const upload = await api.adminUploadImages(filesToUpload);
        keys.push(...upload.keys);
      }

      const input: CreateProductInput = {
        name: values.name,
        description: values.description,
        category: values.category,
        series: values.series as ProductSeries,
        set: values.set as ProductSet,
        price: Math.round(Number.parseFloat(values.price) * 100),
        stock: Number.parseInt(values.stock, 10),
        accent: values.accent,
        images: keys,
        isNew: values.isNew,
        featured: values.featured,
        releaseDate: values.releaseDate,
        cardNumber: values.cardNumber.trim() || undefined,
        rarity: values.rarity as CardRarity,
        condition: values.condition as CardCondition,
        language: values.language,
        tags: values.tags.length > 0 ? values.tags : undefined,
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

      return api.adminCreateProduct(parsed.data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({ title: 'Product created', variant: 'success' });
      navigate('/admin');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'validation') return;
      toast({
        title: 'Could not create product',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    },
  });

  const canCreateProduct = useMemo(
    () => createProductInputSchema.safeParse(buildCreateProductDraft(values, images.length)).success,
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
        return [
          ...current,
          {
            previewUrl,
            s3Key: result.key,
          },
        ];
      });
      if (result.cardName) {
        applyFetchedCard(result.cardName);
      }
      toast({
        title: result.cached ? 'Card image ready' : 'Card image fetched',
        description: result.cardName,
        variant: 'success',
      });
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
    createProduct.mutate();
  };

  const nameGuide = PRODUCT_NAME_GUIDE[values.category];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Add product</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Upload images manually, or fetch a single card from Pokellector when category, series, set,
          card number and language (EN/JP) are set.
        </p>
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
                      <img
                        src={image.previewUrl}
                        alt=""
                        className="size-full object-contain p-3"
                      />
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
                      title={
                        canFetchCardImage
                          ? 'Fetch card image from Pokellector'
                          : 'Select series, set, card number and English or Japanese language'
                      }
                      onClick={() => fetchCardImage.mutate()}
                    >
                      {fetchCardImage.isPending ? (
                        <Spinner />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      Fetch card image
                    </Button>
                  )}
                </div>
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
                  : `Up to ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters — condition, language, what’s included, etc.`
              }
              required
            >
              {(props) => (
                <Textarea
                  {...props}
                  rows={4}
                  maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
                  placeholder="Factory-sealed booster pack from the 151 set. Ships in protective packaging."
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
                    placeholder="#a855f7"
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
                          series && v.set && nextSets.includes(v.set as ProductSet)
                            ? v.set
                            : '';
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
                      {
                        value: '',
                        label: values.series ? 'Select a set' : 'Choose series first',
                      },
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
                label="Price (USD)"
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
                    inputProps={{ ...props, placeholder: '19.99' }}
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
          <Button type="submit" disabled={!canCreateProduct || createProduct.isPending}>
            {createProduct.isPending && <Spinner className="text-primary-foreground" />}
            Create product
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link to="/admin">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
