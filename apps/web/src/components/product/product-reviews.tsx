import type { ProductReview } from '@akknerds/shared';
import { Button, Label, Rating, Textarea, cn, useToast } from '@akknerds/ui';
import { Lock, MessageSquareText, Star } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCreateProductReview, useProductReviews } from '../../hooks/use-product-reviews';
import { ApiError } from '@akknerds/api-client';
import { useAuthStore } from '../../store/auth';

interface ProductReviewsSectionProps {
  productSlug: string;
}

function formatReviewDate(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function ReviewCard({ review }: { review: ProductReview }) {
  return (
    <article className="border-border border-b py-4 last:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold">{review.author.name}</p>
          <Rating value={review.rating} size={14} />
        </div>
        <time className="text-muted-foreground text-xs" dateTime={review.createdAt}>
          {formatReviewDate(review.createdAt)}
        </time>
      </div>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{review.body}</p>
    </article>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            className={cn(
              'rounded-md p-1 transition-colors',
              selected ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange(star)}
          >
            <Star className="size-5" fill={selected ? 'currentColor' : 'none'} />
          </button>
        );
      })}
    </div>
  );
}

function ReviewForm({ productSlug }: { productSlug: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const create = useCreateProductReview(productSlug);
  const { toast } = useToast();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    create.mutate(
      { rating, body },
      {
        onSuccess: () => {
          setBody('');
          toast({
            title: 'Review posted',
            description: 'Thanks for sharing your experience.',
            variant: 'success',
          });
        },
        onError: (error) => {
          toast({
            title: 'Could not post review',
            description: error instanceof ApiError ? error.message : 'Please try again.',
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <form onSubmit={onSubmit} className="border-border bg-muted/20 flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex flex-col gap-1.5">
        <Label>Your rating</Label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="review-body">Your comment</Label>
        <Textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="How was the product, packing, and delivery?"
          rows={4}
          required
          minLength={10}
          maxLength={1000}
        />
      </div>
      <Button type="submit" disabled={create.isPending || body.trim().length < 10}>
        {create.isPending ? 'Posting…' : 'Post review'}
      </Button>
    </form>
  );
}

export function ProductReviewsSection({ productSlug }: ProductReviewsSectionProps) {
  const token = useAuthStore((s) => s.token);
  const reviewsQuery = useProductReviews(token ? productSlug : undefined);

  return (
    <section className="mt-16" aria-labelledby="product-reviews-heading">
      <div className="mb-6 flex flex-col gap-1">
        <h2 id="product-reviews-heading" className="text-xl font-bold tracking-tight">
          Reviews & comments
        </h2>
        <p className="text-muted-foreground text-sm">
          Star ratings are public. Comments are for members — sign in to read them.
        </p>
      </div>

      {!token ? (
        <div className="border-border bg-muted/20 flex flex-col items-start gap-3 rounded-xl border p-6">
          <div className="flex items-center gap-3">
            <div className="bg-background text-foreground flex size-10 shrink-0 items-center justify-center rounded-full">
              <Lock className="size-4" />
            </div>
            <p className="font-semibold">Sign in to read comments</p>
          </div>
          <p className="text-muted-foreground text-sm">
            Aggregate stars stay visible above. Member comments unlock after you sign in.
          </p>
          <Button asChild>
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      ) : reviewsQuery.isLoading ? (
        <p className="text-muted-foreground text-sm">Loading comments…</p>
      ) : reviewsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load comments. Try again later.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {reviewsQuery.data?.canReview && <ReviewForm productSlug={productSlug} />}

          {!reviewsQuery.data?.canReview && !reviewsQuery.data?.myReview && (
            <p className="text-muted-foreground text-sm">
              Buy this product to leave a verified review and comment.
            </p>
          )}

          {reviewsQuery.data?.reviews.length ? (
            <div className="border-border rounded-xl border px-4">
              {reviewsQuery.data.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <MessageSquareText className="size-4" />
              No comments yet. Be the first after your purchase.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
