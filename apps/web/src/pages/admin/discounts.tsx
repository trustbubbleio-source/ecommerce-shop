import {
  createDiscountCodeInputSchema,
  type CreateDiscountCodeInput,
  type DiscountKind,
} from '@akknerds/shared';
import { ApiError, type AdminUserSummary } from '@akknerds/api-client';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Skeleton,
  useToast,
} from '@akknerds/ui';
import { Percent, Search, TicketPercent, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  useAdminCreateDiscount,
  useAdminDeleteDiscount,
  useAdminDiscounts,
  useAdminSearchUsers,
  useAdminSetDiscountActive,
} from '../../hooks/use-admin-discounts';

type Scope = 'general' | 'user';

const emptyForm = {
  code: 'THANKYOU5',
  label: '5% thank-you for understanding',
  kind: 'percent' as DiscountKind,
  value: 5,
  scope: 'user' as Scope,
  userQuery: '',
  selectedUser: null as AdminUserSummary | null,
  assignToUser: true,
};

function formatValue(kind: DiscountKind, value: number): string {
  if (kind === 'percent') return `${value}%`;
  if (kind === 'free_shipping') return 'Free shipping';
  return `${(value / 100).toFixed(2)} EUR`;
}

export function AdminDiscountsPage() {
  const list = useAdminDiscounts();
  const create = useAdminCreateDiscount();
  const setActive = useAdminSetDiscountActive();
  const remove = useAdminDeleteDiscount();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string>();
  const usersQuery = useAdminSearchUsers(form.scope === 'user' ? form.userQuery : '');

  useEffect(() => {
    if (form.scope === 'general') {
      setForm((prev) => ({ ...prev, selectedUser: null, assignToUser: false }));
    }
  }, [form.scope]);

  const custom = list.data?.custom ?? [];
  const builtin = list.data?.builtin ?? [];

  const userHits = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);

  const onCreate = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    if (form.scope === 'user' && !form.selectedUser) {
      setFormError('Pick a customer for a personal discount.');
      return;
    }

    const payload: CreateDiscountCodeInput = {
      code: form.code,
      label: form.label,
      kind: form.kind,
      value: form.kind === 'free_shipping' ? 0 : form.value,
      allowedEmail: form.scope === 'user' ? form.selectedUser!.email : null,
      allowedUserId: form.scope === 'user' ? form.selectedUser!.id : null,
      assignToUser: form.scope === 'user' ? form.assignToUser : false,
    };

    const parsed = createDiscountCodeInputSchema.safeParse(payload);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Invalid discount');
      return;
    }

    create.mutate(parsed.data, {
      onSuccess: (result) => {
        toast({
          title: 'Discount created',
          description: result.assigned
            ? `${result.discount.code} saved on the customer profile.`
            : `${result.discount.code} is ready to use.`,
          variant: 'success',
        });
        setForm({
          ...emptyForm,
          code: '',
          label: '',
          scope: form.scope,
          assignToUser: form.scope === 'user',
        });
      },
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : 'Could not create discount.');
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Discounts</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create shop-wide promos or a personal thank-you code for one customer.
          Personal codes deactivate automatically after their first paid order.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TicketPercent className="size-4" />
              New discount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={onCreate} noValidate>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={form.scope === 'general' ? 'primary' : 'outline'}
                  onClick={() => setForm((f) => ({ ...f, scope: 'general' }))}
                >
                  General
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={form.scope === 'user' ? 'primary' : 'outline'}
                  onClick={() => setForm((f) => ({ ...f, scope: 'user', assignToUser: true }))}
                >
                  Specific user
                </Button>
              </div>

              <Field label="Code">
                {(props) => (
                  <Input
                    {...props}
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="THANKYOU5"
                    className="font-mono uppercase tracking-wide"
                    autoComplete="off"
                  />
                )}
              </Field>

              <Field label="Label">
                {(props) => (
                  <Input
                    {...props}
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="5% thank-you for understanding"
                  />
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Type">
                  {(props) => (
                    <Select
                      {...props}
                      value={form.kind}
                      onChange={(e) => {
                        const kind = e.target.value as DiscountKind;
                        setForm((f) => ({
                          ...f,
                          kind,
                          value: kind === 'percent' ? 5 : kind === 'fixed' ? 500 : 0,
                        }));
                      }}
                      options={[
                        { value: 'percent', label: 'Percent off' },
                        { value: 'fixed', label: 'Fixed EUR amount' },
                        { value: 'free_shipping', label: 'Free shipping' },
                      ]}
                    />
                  )}
                </Field>
                {form.kind !== 'free_shipping' ? (
                  <Field label={form.kind === 'percent' ? 'Percent' : 'Amount (EUR cents)'}>
                    {(props) => (
                      <Input
                        {...props}
                        type="number"
                        min={1}
                        max={form.kind === 'percent' ? 100 : 100_000}
                        value={form.value}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))
                        }
                      />
                    )}
                  </Field>
                ) : null}
              </div>

              {form.scope === 'user' ? (
                <div className="flex flex-col gap-2">
                  <Field label="Find customer">
                    {(props) => (
                      <div className="relative">
                        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                        <Input
                          {...props}
                          value={form.userQuery}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              userQuery: e.target.value,
                              selectedUser: null,
                            }))
                          }
                          placeholder="Search email or name"
                          className="pl-9"
                        />
                      </div>
                    )}
                  </Field>
                  {form.selectedUser ? (
                    <p className="text-foreground inline-flex items-center gap-2 text-sm">
                      <UserRound className="size-4" />
                      {form.selectedUser.name} · {form.selectedUser.email}
                    </p>
                  ) : null}
                  {!form.selectedUser && form.userQuery.trim().length >= 2 ? (
                    <ul className="border-border max-h-40 overflow-y-auto rounded-lg border">
                      {usersQuery.isLoading ? (
                        <li className="text-muted-foreground px-3 py-2 text-sm">Searching…</li>
                      ) : userHits.length === 0 ? (
                        <li className="text-muted-foreground px-3 py-2 text-sm">No users found</li>
                      ) : (
                        userHits.map((user) => (
                          <li key={user.id}>
                            <button
                              type="button"
                              className="hover:bg-secondary w-full px-3 py-2 text-left text-sm"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  selectedUser: user,
                                  userQuery: user.email,
                                }))
                              }
                            >
                              <span className="font-medium">{user.name}</span>
                              <span className="text-muted-foreground block text-xs">
                                {user.email}
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : null}
                  <label className="text-muted-foreground flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.assignToUser}
                      onChange={(e) => setForm((f) => ({ ...f, assignToUser: e.target.checked }))}
                    />
                    Save on their account (auto-applies at checkout)
                  </label>
                </div>
              ) : null}

              {formError ? (
                <p className="text-destructive text-sm" role="alert">
                  {formError}
                </p>
              ) : null}

              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Creating…' : 'Create discount'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Your codes</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {list.isLoading ? <Skeleton className="h-24 w-full" /> : null}
              {!list.isLoading && custom.length === 0 ? (
                <p className="text-muted-foreground text-sm">No custom codes yet.</p>
              ) : null}
              {custom.map((discount) => (
                <div
                  key={discount.id}
                  className="border-border flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold tracking-wide">{discount.code}</p>
                      <Badge variant={discount.active ? 'success' : 'muted'}>
                        {discount.active ? 'Active' : 'Off'}
                      </Badge>
                      {discount.allowedEmail ? (
                        <Badge variant="secondary">Personal</Badge>
                      ) : (
                        <Badge variant="outline">General</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {discount.label} · {formatValue(discount.kind, discount.value)}
                      {discount.allowedEmail ? ` · ${discount.allowedEmail}` : null}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={setActive.isPending}
                      onClick={() =>
                        setActive.mutate({ id: discount.id, active: !discount.active })
                      }
                    >
                      {discount.active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (!window.confirm(`Delete ${discount.code}?`)) return;
                        remove.mutate(discount.id, {
                          onSuccess: () =>
                            toast({ title: 'Discount deleted', variant: 'success' }),
                        });
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Percent className="size-4" />
                Built-in codes
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {builtin.map((discount) => (
                <div
                  key={discount.code}
                  className="border-border flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-mono font-semibold tracking-wide">{discount.code}</p>
                    <p className="text-muted-foreground text-xs">{discount.label}</p>
                  </div>
                  <Badge variant="muted">System</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
