import {
  WANT_LIST_PRESETS,
  WANT_LIST_STATUS_LABELS,
  type WantListPresetId,
  createWantListItemSchema,
} from '@akknerds/shared';
import { Badge, Button, Field, Input, Textarea, cn, useToast } from '@akknerds/ui';
import { ClipboardList, Trash2 } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { EmptyState } from '../../components/common/empty-state';
import {
  useCreateWantListItem,
  useRemoveWantListItem,
  useWantList,
} from '../../hooks/use-want-list';
import { ApiError } from '@akknerds/api-client';

const statusVariant: Record<string, 'secondary' | 'success' | 'destructive' | 'outline' | 'muted'> = {
  pending: 'secondary',
  reviewing: 'outline',
  accepted: 'success',
  rejected: 'destructive',
  found: 'success',
  contacted: 'muted',
};

export function AccountWantListPage() {
  const list = useWantList();
  const create = useCreateWantListItem();
  const remove = useRemoveWantListItem();
  const { toast } = useToast();

  const [preset, setPreset] = useState<WantListPresetId>('singles-nm-en');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const parsed = createWantListItemSchema.safeParse({ preset, title, notes });
    if (!parsed.success) {
      toast({
        title: 'Check your request',
        description: parsed.error.issues[0]?.message ?? 'Invalid request',
        variant: 'error',
      });
      return;
    }
    create.mutate(parsed.data, {
      onSuccess: () => {
        setTitle('');
        setNotes('');
        toast({
          title: 'Added to want list',
          description: 'We’ll review it and reach out if we can help.',
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: 'Could not save',
          description: error instanceof ApiError ? error.message : 'Please try again.',
          variant: 'error',
        });
      },
    });
  };

  const items = list.data?.items ?? [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-lg font-bold tracking-tight">Want list</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Tell us what you&apos;re hunting — sealed JP, Singles NM EN, graded slabs, or a custom ask.
          We review every request and can email you with an offer.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="border-border bg-card/40 flex flex-col gap-4 rounded-2xl border p-4 sm:p-5"
      >
        <div>
          <p className="mb-2 text-sm font-semibold">Shopping mode</p>
          <div className="flex flex-wrap gap-2">
            {WANT_LIST_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setPreset(option.id)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                  preset === option.id
                    ? 'border-primary/50 bg-primary/15 text-foreground'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {option.shortLabel}
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            {WANT_LIST_PRESETS.find((p) => p.id === preset)?.description}
          </p>
        </div>

        <Field label="What are you looking for?" required>
          {(props) => (
            <Input
              {...props}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prismatic Evolutions ETB, or Umbreon SIR"
            />
          )}
        </Field>

        <Field label="Notes (optional)">
          {(props) => (
            <Textarea
              {...props}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Budget, condition details, set, language…"
              maxLength={1000}
            />
          )}
        </Field>

        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Add to want list'}
        </Button>
      </form>

      {list.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading your want list…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title="Nothing on your want list yet"
          description="Pick a preset above and tell us what to source."
        />
      ) : (
        <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.title}</p>
                  <Badge variant={statusVariant[item.status] ?? 'secondary'}>
                    {WANT_LIST_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1 text-sm">
                  {WANT_LIST_PRESETS.find((p) => p.id === item.preset)?.shortLabel ?? item.preset}
                  {item.notes ? ` · ${item.notes}` : ''}
                </p>
                {item.adminNote && (
                  <p className="text-foreground/80 mt-2 text-sm">
                    <span className="font-medium">From us:</span> {item.adminNote}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove want list item"
                disabled={remove.isPending}
                onClick={() =>
                  remove.mutate(item.id, {
                    onError: (error) => {
                      toast({
                        title: 'Could not remove',
                        description: error instanceof ApiError ? error.message : 'Try again.',
                        variant: 'error',
                      });
                    },
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
