import {
  SELL_IMAGE_ACCEPT,
  SELL_MAX_CARDS,
  SELL_MAX_IMAGE_BYTES,
  SELL_MAX_TOTAL_IMAGE_BYTES,
  isSellCsvFile,
  isSellImageMimeType,
  sellRequestInputSchema,
} from '@akknerds/shared';
import { Button, Field, Input, Textarea, cn, useToast } from '@akknerds/ui';
import {
  Camera,
  Check,
  ChevronRight,
  FileSpreadsheet,
  ImagePlus,
  Plus,
  Send,
  Trash2,
  Upload,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SellAuthModal } from '../components/sell/sell-auth-modal';
import {
  createEmptySellCard,
  parseSellCsv,
  type SellCardDraft,
  type SellStep,
} from '../components/sell/sell-types';
import { SITE } from '../config/site';
import { ApiError, api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import bulkCardsHero from '../assets/rarity/bulkcards.jpg';

const STEPS: { id: SellStep; label: string }[] = [
  { id: 'build', label: 'Add cards' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Sent' },
];

const MAX_CARDS = SELL_MAX_CARDS;
const MAX_IMAGE_BYTES = SELL_MAX_IMAGE_BYTES;

export function SellPage() {
  const token = useAuthStore((s) => s.token);
  const { toast } = useToast();
  const galleryInputId = useId();
  const cameraInputId = useId();
  const csvInputId = useId();

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<SellStep>('build');
  const [cards, setCards] = useState<SellCardDraft[]>([]);
  const [notes, setNotes] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    return () => {
      for (const card of cards) {
        if (card.previewUrl) URL.revokeObjectURL(card.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only revoke on unmount
  }, []);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const remaining = MAX_CARDS - cards.length;
    if (remaining <= 0) {
      toast({
        title: 'Lot is full',
        description: `Max ${MAX_CARDS} cards per submission.`,
        variant: 'error',
      });
      return;
    }

    const next: SellCardDraft[] = [];
    for (const file of Array.from(fileList).slice(0, remaining)) {
      if (!isSellImageMimeType(file.type)) {
        toast({
          title: 'Unsupported image',
          description: `${file.name}: only JPG, PNG, or WebP.`,
          variant: 'error',
        });
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast({
          title: 'Image too large',
          description: `${file.name} must be under 5 MB.`,
          variant: 'error',
        });
        continue;
      }
      const base = file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ');
      next.push(
        createEmptySellCard({
          previewUrl: URL.createObjectURL(file),
          file,
          fileName: file.name,
          title: base.slice(0, 120),
        }),
      );
    }
    if (next.length) setCards((prev) => [...prev, ...next]);
  };

  const onCsv = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!isSellCsvFile(file)) {
      toast({
        title: 'CSV only',
        description: 'Import accepts .csv files only.',
        variant: 'error',
      });
      return;
    }
    try {
      const text = await file.text();
      const rows = parseSellCsv(text);
      if (!rows.length) {
        toast({ title: 'Empty CSV', description: 'No card rows found.', variant: 'error' });
        return;
      }
      const remaining = MAX_CARDS - cards.length;
      const sliced = rows.slice(0, remaining).map((row) => createEmptySellCard(row));
      setCards((prev) => [...prev, ...sliced]);
      toast({
        title: 'CSV imported',
        description: `Added ${sliced.length} card${sliced.length === 1 ? '' : 's'}.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Could not read CSV',
        description: 'Try again with a plain .csv file.',
        variant: 'error',
      });
    }
  };

  const updateCard = (id: string, patch: Partial<SellCardDraft>) => {
    setCards((prev) => prev.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  };

  const removeCard = (id: string) => {
    setCards((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((c) => c.id !== id);
    });
  };

  const goReview = () => {
    if (cards.length === 0) {
      toast({
        title: 'Add at least one card',
        description: 'Upload photos or import a CSV first.',
      });
      return;
    }
    const missing = cards.some((c) => !c.title.trim());
    if (missing) {
      toast({
        title: 'Name your cards',
        description: 'Every card needs a title before review.',
        variant: 'error',
      });
      return;
    }
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendRequest = async () => {
    if (!token) {
      setAuthOpen(true);
      return;
    }

    const payload = {
      notes,
      items: cards.map((card) => ({
        title: card.title,
        notes: card.notes,
        condition: card.condition,
      })),
    };
    const parsed = sellRequestInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast({
        title: 'Check your lot',
        description: parsed.error.issues[0]?.message ?? 'Invalid submission.',
        variant: 'error',
      });
      return;
    }

    const photoBytes = cards.reduce((sum, card) => sum + (card.file?.size ?? 0), 0);
    if (photoBytes > SELL_MAX_TOTAL_IMAGE_BYTES) {
      toast({
        title: 'Photos too large',
        description: 'Total photo size must stay under 25 MB.',
        variant: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.append('payload', JSON.stringify(parsed.data));
    cards.forEach((card, index) => {
      if (card.file) formData.append(`photo_${index}`, card.file, card.file.name);
    });

    setSending(true);
    try {
      const result = await api.submitSellRequest(formData);
      setStep('done');
      toast({ title: 'Request sent', description: result.message, variant: 'success' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Could not send',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setSending(false);
    }
  };

  const resetLot = () => {
    for (const card of cards) {
      if (card.previewUrl) URL.revokeObjectURL(card.previewUrl);
    }
    setCards([]);
    setNotes('');
    setStep('build');
  };

  return (
    <div>
      <section className="border-border relative isolate overflow-hidden border-b">
        <img
          src={bulkCardsHero}
          alt="Bulk cards"
          className="pointer-events-none absolute size-full object-cover object-center"
          aria-hidden="true"
        />
        {/* Dark wash so type stays sharp over the card pile */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55"
          aria-hidden="true"
        />
        <div
          className="from-background via-background/40 md:via-background/60 pointer-events-none absolute inset-0 bg-gradient-to-t to-black/50"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.85)]"
          aria-hidden="true"
        />
        <div
          className="aurora pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light"
          aria-hidden="true"
        />

        <div className="container relative py-16 sm:py-24">
          <p className="text-foreground/70 mb-3 text-xs font-semibold uppercase tracking-[0.18em]">
            We buy Pokémon cards
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold tracking-tight drop-shadow-[0_2px_24px_rgba(0,0,0,0.85)] sm:text-5xl lg:text-6xl">
            Want to <span className="text-gradient">sell</span> your cards?
          </h1>
          <p className="text-foreground/75 mt-4 max-w-xl text-lg leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.8)]">
            Build a lot with photos or a CSV, review it, then send it our way.
          </p>
          <p className="text-foreground/75 max-w-xl text-lg leading-relaxed drop-shadow-[0_1px_12px_rgba(0,0,0,0.8)]">
            We scan every submission and reply if we want to buy.
          </p>
        </div>
      </section>

      <div className="container max-w-4xl py-10">
        <ol className="mb-10 flex flex-wrap gap-2">
          {STEPS.map((item, index) => {
            const active = step === item.id;
            const done =
              (item.id === 'build' && (step === 'review' || step === 'done')) ||
              (item.id === 'review' && step === 'done');
            return (
              <li
                key={item.id}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold',
                  active && 'border-primary/40 bg-primary/10 text-foreground',
                  done && !active && 'border-border text-muted-foreground',
                  !active && !done && 'border-border text-muted-foreground/70',
                )}
              >
                <span
                  className={cn(
                    'grid size-5 place-items-center rounded-full text-[10px]',
                    active || done ? 'bg-primary text-primary-foreground' : 'bg-secondary',
                  )}
                >
                  {done ? <Check className="size-3" /> : index + 1}
                </span>
                {item.label}
              </li>
            );
          })}
        </ol>

        {step === 'build' && (
          <div className="flex flex-col gap-8">
            <div
              className="border-border from-card/80 to-background group relative overflow-hidden rounded-2xl border border-dashed bg-gradient-to-b p-6 sm:p-8"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Add photos</h2>
                  <p className="text-muted-foreground mt-1 max-w-md text-sm">
                    Drop images here, pick from your gallery, or snap with the camera. Each photo
                    becomes a card in your lot.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => galleryRef.current?.click()}
                  >
                    <ImagePlus className="size-4" /> Gallery
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => cameraRef.current?.click()}
                  >
                    <Camera className="size-4" /> Camera
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => csvRef.current?.click()}>
                    <FileSpreadsheet className="size-4" /> Import CSV
                  </Button>
                </div>
              </div>

              <input
                id={galleryInputId}
                ref={galleryRef}
                type="file"
                accept={SELL_IMAGE_ACCEPT}
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                id={cameraInputId}
                ref={cameraRef}
                type="file"
                accept={SELL_IMAGE_ACCEPT}
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                id={csvInputId}
                ref={csvRef}
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={onCsv}
              />

              {cards.length === 0 && (
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  className="border-border text-muted-foreground hover:border-primary/40 hover:text-foreground mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-14 transition-colors"
                >
                  <Upload className="size-8 opacity-70" />
                  <span className="text-sm font-medium">Drop photos or click to upload</span>
                </button>
              )}
            </div>

            {cards.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">
                    Your lot{' '}
                    <span className="text-muted-foreground font-medium">({cards.length})</span>
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCards((prev) => [...prev, createEmptySellCard()])}
                    disabled={cards.length >= MAX_CARDS}
                  >
                    <Plus className="size-4" /> Add blank card
                  </Button>
                </div>

                <ul className="flex flex-col gap-4">
                  {cards.map((card, index) => (
                    <li
                      key={card.id}
                      className="border-border bg-card/40 grid gap-4 rounded-2xl border p-4 sm:grid-cols-[7rem_1fr]"
                    >
                      <div className="bg-muted/30 border-border relative aspect-[5/7] overflow-hidden rounded-xl border">
                        {card.previewUrl ? (
                          <img src={card.previewUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <div className="text-muted-foreground flex size-full flex-col items-center justify-center gap-1 text-xs">
                            <ImagePlus className="size-5 opacity-60" />
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                            Card {index + 1}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove card ${index + 1}`}
                            onClick={() => removeCard(card.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <Field label="Card name" required>
                          {(props) => (
                            <Input
                              {...props}
                              value={card.title}
                              onChange={(e) => updateCard(card.id, { title: e.target.value })}
                              placeholder="e.g. Charizard ex SIR"
                            />
                          )}
                        </Field>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Condition">
                            {(props) => (
                              <Input
                                {...props}
                                value={card.condition}
                                onChange={(e) => updateCard(card.id, { condition: e.target.value })}
                                placeholder="NM / LP / …"
                              />
                            )}
                          </Field>
                          <Field label="Notes">
                            {(props) => (
                              <Input
                                {...props}
                                value={card.notes}
                                onChange={(e) => updateCard(card.id, { notes: e.target.value })}
                                placeholder="Set, language, extras"
                              />
                            )}
                          </Field>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Field label="Message to us (optional)">
              {(props) => (
                <Textarea
                  {...props}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Anything we should know — bulk lot, asking price, shipping from…"
                  maxLength={2000}
                />
              )}
            </Field>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-sm">
                Photos: JPG / PNG / WebP · CSV:{' '}
                <code className="text-foreground">title, condition, notes</code>
              </p>
              <Button type="button" size="lg" onClick={goReview} disabled={cards.length === 0}>
                Review lot <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'review' && (
          <div className="flex flex-col gap-8">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Review before you send</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Double-check names and photos. Sending requires a free member account.
              </p>
            </div>

            <ul className="border-border divide-border divide-y overflow-hidden rounded-2xl border">
              {cards.map((card) => (
                <li key={card.id} className="flex gap-4 p-4">
                  <div className="bg-muted/30 border-border size-16 shrink-0 overflow-hidden rounded-lg border sm:size-20">
                    {card.previewUrl ? (
                      <img src={card.previewUrl} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="text-muted-foreground flex size-full items-center justify-center text-[10px]">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{card.title}</p>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      {[card.condition, card.notes].filter(Boolean).join(' · ') ||
                        'No extra details'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {notes.trim() && (
              <div className="border-border bg-muted/20 rounded-xl border p-4">
                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                  Your message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{notes}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={() => setStep('build')}>
                Back to edit
              </Button>
              <Button type="button" size="lg" onClick={() => void sendRequest()} disabled={sending}>
                <Send className="size-4" />
                {sending ? 'Sending…' : 'Send sell request'}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="border-border from-card to-background flex flex-col items-start gap-4 rounded-2xl border bg-gradient-to-b p-8">
            <span className="bg-primary/15 text-primary grid size-12 place-items-center rounded-full">
              <Check className="size-6" />
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight">Request received</h2>
            <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
              We&apos;ll review your lot and email you at your account address if we want to make an
              offer. Questions meanwhile?{' '}
              <a href={`mailto:${SITE.email.trade}`} className="text-foreground underline">
                {SITE.email.trade}
              </a>
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="button" onClick={resetLot}>
                Submit another lot
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">Back to Buy</Link>
              </Button>
            </div>
          </div>
        )}
      </div>

      <SellAuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </div>
  );
}
