import {
  CURRENCY_LABELS,
  addressSchema,
  updateProfileInputSchema,
  type Address,
  type SupportedCurrency,
} from '@akknerds/shared';
import {
  Button,
  Card,
  CardContent,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
  useToast,
} from '@akknerds/ui';
import { MapPin, Package, UserRound } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '@akknerds/api-client';
import { useMyOrders } from '../../hooks/use-orders';
import { useUpdateProfile } from '../../hooks/use-auth';
import { useAuthStore } from '../../store/auth';
import { useCurrencyStore } from '../../store/currency';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

function buildShippingAddress(input: {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
}): Address | null | { error: true; issues: Record<string, string> } {
  const blank =
    !input.fullName.trim() &&
    !input.line1.trim() &&
    !input.line2.trim() &&
    !input.city.trim() &&
    !input.postalCode.trim() &&
    !input.country.trim();
  if (blank) return null;

  const parsed = addressSchema.safeParse({
    fullName: input.fullName,
    line1: input.line1,
    line2: input.line2,
    city: input.city,
    postalCode: input.postalCode,
    country: input.country,
  });
  if (!parsed.success) {
    const issues: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = `shipping.${String(issue.path[0] ?? 'form')}`;
      issues[key] ??= issue.message;
    }
    return { error: true, issues };
  }
  return parsed.data;
}

export function AccountProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const setCurrency = useCurrencyStore((s) => s.setCurrency);
  const orders = useMyOrders();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState<SupportedCurrency>('eur');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [shipFullName, setShipFullName] = useState('');
  const [shipLine1, setShipLine1] = useState('');
  const [shipLine2, setShipLine2] = useState('');
  const [shipCity, setShipCity] = useState('');
  const [shipPostalCode, setShipPostalCode] = useState('');
  const [shipCountry, setShipCountry] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.profile.phone ?? '');
    setCountry(user.profile.country ?? '');
    setCity(user.profile.city ?? '');
    setBio(user.profile.bio ?? '');
    setPreferredCurrency(user.profile.preferredCurrency);
    setMarketingOptIn(user.profile.marketingOptIn);
    const ship = user.profile.shippingAddress;
    setShipFullName(ship?.fullName ?? '');
    setShipLine1(ship?.line1 ?? '');
    setShipLine2(ship?.line2 ?? '');
    setShipCity(ship?.city ?? '');
    setShipPostalCode(ship?.postalCode ?? '');
    setShipCountry(ship?.country ?? '');
  }, [user]);

  if (!user) return null;

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
  const orderCount = orders.data?.orders.length ?? 0;
  const locationLabel = user.profile.shippingAddress
    ? [user.profile.shippingAddress.city, user.profile.shippingAddress.country]
        .filter(Boolean)
        .join(', ')
    : [user.profile.city, user.profile.country].filter(Boolean).join(', ');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const shipping = buildShippingAddress({
      fullName: shipFullName,
      line1: shipLine1,
      line2: shipLine2,
      city: shipCity,
      postalCode: shipPostalCode,
      country: shipCountry,
    });
    if (shipping && 'error' in shipping) {
      setErrors(shipping.issues);
      return;
    }

    const parsed = updateProfileInputSchema.safeParse({
      name,
      phone,
      country,
      city,
      bio,
      preferredCurrency,
      marketingOptIn,
      shippingAddress: shipping,
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      const { user: next } = await updateProfile.mutateAsync(parsed.data);
      setCurrency(next.profile.preferredCurrency);
      toast({ title: 'Profile saved', variant: 'success' });
    } catch (err) {
      toast({
        title: 'Could not save profile',
        description: err instanceof ApiError ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <div className="from-primary/25 via-secondary to-background relative h-24 bg-gradient-to-br" />
        <CardContent className="relative -mt-10 flex flex-col gap-5 pb-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div
              aria-hidden
              className="border-background bg-primary text-primary-foreground flex size-20 shrink-0 items-center justify-center rounded-2xl border-4 text-xl font-bold shadow-lg"
            >
              {initials(user.name)}
            </div>
            <div className="pb-1">
              <h2 className="text-foreground text-xl font-bold tracking-tight">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="size-4" />
              Joined {memberSince}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Package className="size-4" />
              {orders.isLoading ? '…' : `${orderCount} order${orderCount === 1 ? '' : 's'}`}
            </span>
            {locationLabel && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" />
                {locationLabel}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {user.profile.bio && (
        <p className="text-muted-foreground border-border border-l-2 pl-4 text-sm leading-relaxed italic">
          {user.profile.bio}
        </p>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
            <section className="flex flex-col gap-5">
              <div>
                <h3 className="text-foreground text-base font-semibold">Your details</h3>
                <p className="text-muted-foreground text-sm">
                  Display name and preferences for your account.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name" error={errors.name} required className="sm:col-span-2">
                  {(props) => (
                    <Input
                      {...props}
                      value={name}
                      onChange={(ev) => setName(ev.target.value)}
                      autoComplete="name"
                    />
                  )}
                </Field>
                <Field label="Phone" error={errors.phone}>
                  {(props) => (
                    <Input
                      {...props}
                      type="tel"
                      value={phone}
                      onChange={(ev) => setPhone(ev.target.value)}
                      autoComplete="tel"
                      placeholder="+46 …"
                    />
                  )}
                </Field>
                <Field label="Preferred currency" error={errors.preferredCurrency}>
                  {(props) => (
                    <Select
                      {...props}
                      value={preferredCurrency}
                      onChange={(ev) => setPreferredCurrency(ev.target.value as SupportedCurrency)}
                      options={[
                        { value: 'eur', label: CURRENCY_LABELS.eur },
                        { value: 'sek', label: CURRENCY_LABELS.sek },
                      ]}
                    />
                  )}
                </Field>
                <Field label="City" error={errors.city}>
                  {(props) => (
                    <Input
                      {...props}
                      value={city}
                      onChange={(ev) => setCity(ev.target.value)}
                      autoComplete="address-level2"
                    />
                  )}
                </Field>
                <Field label="Country" error={errors.country}>
                  {(props) => (
                    <Input
                      {...props}
                      value={country}
                      onChange={(ev) => setCountry(ev.target.value)}
                      autoComplete="country-name"
                      placeholder="Sweden"
                    />
                  )}
                </Field>
                <Field
                  label="Collector note"
                  error={errors.bio}
                  hint="Optional — up to 280 characters"
                  className="sm:col-span-2"
                >
                  {(props) => (
                    <Textarea
                      {...props}
                      value={bio}
                      onChange={(ev) => setBio(ev.target.value)}
                      rows={3}
                      placeholder="Chasing PSA 10s, sealed product, or that one chase card…"
                    />
                  )}
                </Field>
              </div>
            </section>

            <section className="border-border flex flex-col gap-5 border-t pt-6">
              <div>
                <h3 className="text-foreground text-base font-semibold">Default shipping address</h3>
                <p className="text-muted-foreground text-sm">
                  Saved for faster checkout. Leave blank to clear. You can still edit it per order.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Full name"
                  error={errors['shipping.fullName']}
                  className="sm:col-span-2"
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={shipFullName}
                      onChange={(ev) => setShipFullName(ev.target.value)}
                      autoComplete="shipping name"
                      placeholder="Ash Ketchum"
                    />
                  )}
                </Field>
                <Field label="Address" error={errors['shipping.line1']} className="sm:col-span-2">
                  {(props) => (
                    <Input
                      {...props}
                      value={shipLine1}
                      onChange={(ev) => setShipLine1(ev.target.value)}
                      autoComplete="shipping address-line1"
                      placeholder="Street and number"
                    />
                  )}
                </Field>
                <Field
                  label="Apartment, suite, etc. (optional)"
                  error={errors['shipping.line2']}
                  className="sm:col-span-2"
                >
                  {(props) => (
                    <Input
                      {...props}
                      value={shipLine2}
                      onChange={(ev) => setShipLine2(ev.target.value)}
                      autoComplete="shipping address-line2"
                    />
                  )}
                </Field>
                <Field label="City" error={errors['shipping.city']}>
                  {(props) => (
                    <Input
                      {...props}
                      value={shipCity}
                      onChange={(ev) => setShipCity(ev.target.value)}
                      autoComplete="shipping address-level2"
                    />
                  )}
                </Field>
                <Field label="Postal code" error={errors['shipping.postalCode']}>
                  {(props) => (
                    <Input
                      {...props}
                      value={shipPostalCode}
                      onChange={(ev) => setShipPostalCode(ev.target.value)}
                      autoComplete="shipping postal-code"
                    />
                  )}
                </Field>
                <Field label="Country" error={errors['shipping.country']} className="sm:col-span-2">
                  {(props) => (
                    <Input
                      {...props}
                      value={shipCountry}
                      onChange={(ev) => setShipCountry(ev.target.value)}
                      autoComplete="shipping country-name"
                      placeholder="Sweden"
                    />
                  )}
                </Field>
              </div>
            </section>

            <label className="border-border bg-secondary/40 flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm">
              <input
                type="checkbox"
                className="border-input text-primary mt-0.5 size-4 rounded"
                checked={marketingOptIn}
                onChange={(ev) => setMarketingOptIn(ev.target.checked)}
              />
              <span>
                <span className="text-foreground font-medium">Email me drops & restocks</span>
                <span className="text-muted-foreground mt-0.5 block">
                  Occasional product news from One More Rip. Unsubscribe anytime.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updateProfile.isPending}>
                {updateProfile.isPending && <Spinner className="text-primary-foreground" />}
                Save profile
              </Button>
              <Button asChild type="button" variant="outline">
                <Link to="/account/orders">View orders</Link>
              </Button>
              <Button asChild type="button" variant="ghost">
                <Link to="/account/settings">Settings</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
