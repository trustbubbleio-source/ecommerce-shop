import {
  RESTORATION_PACKAGE_LABELS,
  RESTORATION_PHOTO_SLOT_LABELS,
  RESTORATION_STATUSES,
  RESTORATION_STATUS_LABELS,
  type RestorationSubmissionStatus,
} from '@akknerds/shared';
import { ApiError } from '@akknerds/api-client';
import { Badge, Button, Input, Select, Skeleton, useToast } from '@akknerds/ui';
import { ImageIcon, Mail, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminRestorationSubmissions,
  useAdminUpdateRestorationSubmission,
} from '../../hooks/use-restoration';

const statusVariant: Record<
  RestorationSubmissionStatus,
  'secondary' | 'success' | 'destructive' | 'outline' | 'muted'
> = {
  new: 'secondary',
  reviewing: 'outline',
  quoted: 'success',
  closed: 'muted',
};

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function AdminSubmissionsPage() {
  const list = useAdminRestorationSubmissions();
  const update = useAdminUpdateRestorationSubmission();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RestorationSubmissionStatus | 'all'>('all');
  const items = list.data?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.email.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q) ||
        RESTORATION_PACKAGE_LABELS[item.packageInterest].toLowerCase().includes(q)
      );
    });
  }, [items, query, statusFilter]);

  const setStatus = (id: string, status: RestorationSubmissionStatus) => {
    update.mutate(
      { id, input: { status } },
      {
        onSuccess: () => toast({ title: 'Status updated', variant: 'success' }),
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
          <h1 className="text-2xl font-extrabold tracking-tight">Submissions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Card restoration photo assessments. Review the images, then reply by email.
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
            placeholder="Search email, notes, package…"
            className="pl-9"
            aria-label="Search submissions"
          />
        </div>
        <Select
          aria-label="Filter by status"
          className="sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RestorationSubmissionStatus | 'all')}
          options={[
            { value: 'all', label: 'All statuses' },
            ...RESTORATION_STATUSES.map((status) => ({
              value: status,
              label: RESTORATION_STATUS_LABELS[status],
            })),
          ]}
        />
      </div>

      {list.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      ) : items.length === 0 ? (
        <div className="border-border text-muted-foreground flex flex-col items-center gap-2 rounded-2xl border border-dashed py-16 text-sm">
          <Sparkles className="size-8 opacity-50" />
          No restoration submissions yet.
        </div>
      ) : filtered.length === 0 ? (
        <div className="border-border text-muted-foreground rounded-2xl border border-dashed py-12 text-center text-sm">
          No matches for this filter.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((item) => (
            <li key={item.id} className="border-border bg-card overflow-hidden rounded-2xl border">
              <div className="flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(
                        'One More Rip - Card restoration assessment',
                      )}`}
                      className="text-foreground inline-flex items-center gap-1.5 font-semibold hover:underline"
                    >
                      <Mail className="size-4 opacity-70" aria-hidden />
                      {item.email}
                    </a>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatWhen(item.createdAt)} · {RESTORATION_PACKAGE_LABELS[item.packageInterest]}
                    </p>
                  </div>
                  <Badge variant={statusVariant[item.status]}>
                    {RESTORATION_STATUS_LABELS[item.status]}
                  </Badge>
                </div>

                {item.notes ? (
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                    {item.notes}
                  </p>
                ) : null}

                <div className="grid grid-cols-3 gap-2 sm:max-w-md">
                  {item.photos.map((photo) => (
                    <a
                      key={`${item.id}-${photo.slot}`}
                      href={photo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="border-border bg-secondary/40 group relative aspect-[3/4] overflow-hidden rounded-lg border"
                    >
                      <img
                        src={photo.url}
                        alt={RESTORATION_PHOTO_SLOT_LABELS[photo.slot]}
                        className="size-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                        {RESTORATION_PHOTO_SLOT_LABELS[photo.slot]}
                      </span>
                    </a>
                  ))}
                  {item.photos.length === 0 ? (
                    <div className="text-muted-foreground col-span-3 flex items-center gap-2 text-xs">
                      <ImageIcon className="size-4" /> No photos stored
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    aria-label={`Status for ${item.email}`}
                    className="w-40"
                    value={item.status}
                    onChange={(e) =>
                      setStatus(item.id, e.target.value as RestorationSubmissionStatus)
                    }
                    options={RESTORATION_STATUSES.map((status) => ({
                      value: status,
                      label: RESTORATION_STATUS_LABELS[status],
                    }))}
                  />
                  <Button asChild size="sm" variant="outline">
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(
                        'One More Rip - Card restoration assessment',
                      )}&body=${encodeURIComponent(
                        `Hi,\n\nThanks for sending photos for card restoration.\n\n`,
                      )}`}
                    >
                      <Mail className="size-3.5" />
                      Reply by email
                    </a>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
