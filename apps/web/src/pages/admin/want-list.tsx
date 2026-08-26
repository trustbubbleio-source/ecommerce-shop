import {
  WANT_LIST_STATUSES,
  WANT_LIST_STATUS_LABELS,
  wantListPresetLabel,
  type WantListStatus,
} from '@akknerds/shared';
import { Badge, Button, Input, Select, Skeleton, useToast } from '@akknerds/ui';
import { ClipboardList, Mail, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminUpdateWantListItem, useAdminWantList } from '../../hooks/use-want-list';
import { ApiError } from '../../lib/api';

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'outline' | 'muted'> = {
  pending: 'secondary',
  reviewing: 'outline',
  accepted: 'success',
  rejected: 'destructive',
  found: 'success',
  contacted: 'muted',
};

export function AdminWantListPage() {
  const list = useAdminWantList();
  const update = useAdminUpdateWantListItem();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<WantListStatus | 'all'>('all');
  const items = list.data?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.user.name.toLowerCase().includes(q) ||
        wantListPresetLabel(item.preset).toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  const setStatus = (id: string, status: WantListStatus) => {
    update.mutate(
      { id, input: { status } },
      {
        onSuccess: () => {
          toast({ title: 'Status updated', variant: 'success' });
        },
        onError: (error) => {
          toast({
            title: 'Update failed',
            description: error instanceof ApiError ? error.message : 'Please try again.',
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Want list</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Member sourcing requests — accept, reject, mark found, or email them.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin">Products</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member, card, preset…"
            className="pl-9"
            aria-label="Search want list"
          />
        </div>
        <Select
          aria-label="Filter by status"
          className="sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as WantListStatus | 'all')}
          options={[
            { value: 'all', label: 'All statuses' },
            ...WANT_LIST_STATUSES.map((status) => ({
              value: status,
              label: WANT_LIST_STATUS_LABELS[status],
            })),
          ]}
        />
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="border-border text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-sm">
          <ClipboardList className="size-8 opacity-50" />
          No want list requests yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-2xl border border-dashed py-12 text-center text-sm">
          No matches for this filter.
        </div>
      ) : (
        <div className="border-border overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground border-b text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 font-semibold">Member</th>
                <th className="px-4 py-3 font-semibold">Looking for</th>
                <th className="px-4 py-3 font-semibold">Preset</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filtered.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.user.name}</p>
                    <a
                      href={`mailto:${item.user.email}?subject=${encodeURIComponent(`One More Rip — ${item.title}`)}`}
                      className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
                    >
                      {item.user.email}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.title}</p>
                    {item.notes ? (
                      <p className="text-muted-foreground mt-1 max-w-xs text-xs">{item.notes}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {wantListPresetLabel(item.preset)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[item.status] ?? 'secondary'}>
                      {WANT_LIST_STATUS_LABELS[item.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Select
                        aria-label={`Status for ${item.title}`}
                        value={item.status}
                        onChange={(e) => setStatus(item.id, e.target.value as WantListStatus)}
                        className="h-9 min-w-[8.5rem]"
                        disabled={update.isPending}
                        options={WANT_LIST_STATUSES.map((status) => ({
                          value: status,
                          label: WANT_LIST_STATUS_LABELS[status],
                        }))}
                      />
                      <div className="flex gap-1">
                        <Button asChild variant="outline" size="sm">
                          <a
                            href={`mailto:${item.user.email}?subject=${encodeURIComponent(`Re: ${item.title}`)}&body=${encodeURIComponent(`Hi ${item.user.name},\n\nRegarding your want list request (${wantListPresetLabel(item.preset)}): ${item.title}\n\n`)}`}
                          >
                            <Mail className="size-3.5" /> Email
                          </a>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/shop?search=${encodeURIComponent(item.title)}`}>
                            <Search className="size-3.5" /> Find
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
