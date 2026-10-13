import {
  RESTORATION_IMAGE_ACCEPT,
  RESTORATION_MAX_IMAGE_BYTES,
  RESTORATION_PACKAGE_IDS,
  RESTORATION_PACKAGE_LABELS,
  RESTORATION_PHOTO_SLOT_LABELS,
  RESTORATION_PHOTO_SLOTS,
  isSellImageMimeType,
  restorationSubmissionInputSchema,
  type RestorationPackageId,
  type RestorationPhotoSlot,
} from '@akknerds/shared';
import { ApiError } from '@akknerds/api-client';
import { Button, Field, Input, Select, Textarea, cn, useToast } from '@akknerds/ui';
import { Camera, Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { type ChangeEvent, useEffect, useId, useState } from 'react';
import { useSubmitRestoration } from '../../hooks/use-restoration';

type PhotoDraft = {
  file: File;
  previewUrl: string;
};

export function RestorationAssessmentForm() {
  const { toast } = useToast();
  const submit = useSubmitRestoration();
  const frontId = useId();
  const backId = useId();
  const closeupId = useId();
  const inputIds: Record<RestorationPhotoSlot, string> = {
    front: frontId,
    back: backId,
    closeup: closeupId,
  };

  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [packageInterest, setPackageInterest] = useState<RestorationPackageId>('unsure');
  const [photos, setPhotos] = useState<Partial<Record<RestorationPhotoSlot, PhotoDraft>>>({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    return () => {
      for (const draft of Object.values(photos)) {
        if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  const setSlotPhoto = (slot: RestorationPhotoSlot, fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!isSellImageMimeType(file.type)) {
      toast({
        title: 'Unsupported image',
        description: 'Only JPG, PNG, or WebP.',
        variant: 'error',
      });
      return;
    }
    if (file.size > RESTORATION_MAX_IMAGE_BYTES) {
      toast({
        title: 'Image too large',
        description: 'Each photo must be under 5 MB.',
        variant: 'error',
      });
      return;
    }

    setPhotos((prev) => {
      const existing = prev[slot];
      if (existing?.previewUrl) URL.revokeObjectURL(existing.previewUrl);
      return {
        ...prev,
        [slot]: { file, previewUrl: URL.createObjectURL(file) },
      };
    });
  };

  const clearSlot = (slot: RestorationPhotoSlot) => {
    setPhotos((prev) => {
      const existing = prev[slot];
      if (existing?.previewUrl) URL.revokeObjectURL(existing.previewUrl);
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const parsed = restorationSubmissionInputSchema.safeParse({
      email,
      notes,
      packageInterest,
    });
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors;
      const message =
        first.email?.[0] || first.notes?.[0] || first.packageInterest?.[0] || 'Check the form.';
      toast({ title: 'Almost there', description: message, variant: 'error' });
      return;
    }
    if (!photos.front) {
      toast({
        title: 'Front photo needed',
        description: 'Add at least a clear front photo of the card.',
        variant: 'error',
      });
      return;
    }

    const formData = new FormData();
    formData.set('payload', JSON.stringify(parsed.data));
    for (const slot of RESTORATION_PHOTO_SLOTS) {
      const draft = photos[slot];
      if (draft) formData.set(`photo_${slot}`, draft.file);
    }

    submit.mutate(formData, {
      onSuccess: () => {
        setDone(true);
        toast({
          title: 'Assessment sent',
          description: 'We will email you after we review the photos.',
          variant: 'success',
        });
      },
      onError: (error) => {
        toast({
          title: 'Could not send',
          description: error instanceof ApiError ? error.message : 'Please try again.',
          variant: 'error',
        });
      },
    });
  };

  if (done) {
    return (
      <div className="border-border bg-card flex flex-col items-start gap-3 rounded-2xl border p-6 sm:p-8">
        <span className="bg-success/15 text-success grid size-10 place-items-center rounded-full">
          <Check className="size-5" aria-hidden />
        </span>
        <h3 className="text-foreground text-lg font-bold">Photos received</h3>
        <p className="text-muted-foreground max-w-md text-sm leading-relaxed">
          Thanks! We will review your card and reply to <span className="text-foreground font-medium">{email}</span> with
          an honest assessment and quote.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDone(false);
            setNotes('');
            setPackageInterest('unsure');
            setPhotos((prev) => {
              for (const draft of Object.values(prev)) {
                if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
              }
              return {};
            });
          }}
        >
          Submit another card
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6 sm:p-8">
      <div>
        <h3 className="text-foreground text-lg font-bold tracking-tight">Free photo assessment</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Upload up to three photos (front required), add your email, and we will get back to you.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {RESTORATION_PHOTO_SLOTS.map((slot) => {
          const draft = photos[slot];
          const required = slot === 'front';
          return (
            <div key={slot} className="flex flex-col gap-2">
              <label htmlFor={inputIds[slot]} className="text-foreground text-sm font-semibold">
                {RESTORATION_PHOTO_SLOT_LABELS[slot]}
                {required ? <span className="text-destructive"> *</span> : null}
              </label>
              <div
                className={cn(
                  'border-border bg-secondary/30 relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-dashed',
                  draft && 'border-solid',
                )}
              >
                {draft ? (
                  <>
                    <img
                      src={draft.previewUrl}
                      alt={`${RESTORATION_PHOTO_SLOT_LABELS[slot]} preview`}
                      className="absolute inset-0 size-full object-cover"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      className="absolute right-2 top-2 size-8"
                      aria-label={`Remove ${RESTORATION_PHOTO_SLOT_LABELS[slot]} photo`}
                      onClick={() => clearSlot(slot)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : (
                  <label
                    htmlFor={inputIds[slot]}
                    className="text-muted-foreground hover:text-foreground flex cursor-pointer flex-col items-center gap-2 p-3 text-center text-xs"
                  >
                    {slot === 'closeup' ? (
                      <Camera className="size-6 opacity-70" aria-hidden />
                    ) : (
                      <ImagePlus className="size-6 opacity-70" aria-hidden />
                    )}
                    Add {RESTORATION_PHOTO_SLOT_LABELS[slot].toLowerCase()}
                  </label>
                )}
                <input
                  id={inputIds[slot]}
                  type="file"
                  accept={RESTORATION_IMAGE_ACCEPT}
                  capture={slot === 'closeup' ? 'environment' : undefined}
                  className="sr-only"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    setSlotPhoto(slot, event.target.files);
                    event.target.value = '';
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Field label="Email" required>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
          />
        )}
      </Field>

      <Field label="Package interest">
        {(props) => (
          <Select
            {...props}
            value={packageInterest}
            onChange={(e) => setPackageInterest(e.target.value as RestorationPackageId)}
            options={RESTORATION_PACKAGE_IDS.map((id) => ({
              value: id,
              label: RESTORATION_PACKAGE_LABELS[id],
            }))}
          />
        )}
      </Field>

      <Field label="Notes (optional)">
        {(props) => (
          <Textarea
            {...props}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What is wrong with the card? Display, trade, or grading?"
            rows={4}
          />
        )}
      </Field>

      <Button type="submit" size="lg" disabled={submit.isPending}>
        {submit.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Sending...
          </>
        ) : (
          'Send assessment'
        )}
      </Button>
    </form>
  );
}
