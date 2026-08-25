import { Button, cn, useToast } from '@akknerds/ui';
import { Heart } from 'lucide-react';
import { type MouseEvent } from 'react';
import { ApiError } from '../../lib/api';
import { useFavoriteIds, useToggleFavorite } from '../../hooks/use-favorites';
import { useAuthStore } from '../../store/auth';

interface FavoriteButtonProps {
  productId: string;
  productName: string;
  className?: string;
  /** Larger control for product detail. */
  size?: 'sm' | 'md';
}

export function FavoriteButton({
  productId,
  productName,
  className,
  size = 'sm',
}: FavoriteButtonProps) {
  const token = useAuthStore((s) => s.token);
  const ids = useFavoriteIds();
  const toggle = useToggleFavorite();
  const { toast } = useToast();
  const isFavorite = Boolean(token && ids.data?.has(productId));
  const iconClass = size === 'md' ? 'size-5' : 'size-4';

  const onClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!token) {
      toast({
        title: 'Sign in to save favorites',
        description: 'Create an account or sign in to keep products you love.',
      });
      return;
    }

    toggle.mutate(
      { productId, isFavorite },
      {
        onSuccess: (_data, variables) => {
          toast({
            title: variables.isFavorite ? 'Removed from favorites' : 'Saved to favorites',
            description: productName,
            variant: 'success',
          });
        },
        onError: (error) => {
          toast({
            title: 'Could not update favorites',
            description: error instanceof ApiError ? error.message : 'Please try again.',
            variant: 'error',
          });
        },
      },
    );
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        'border-border bg-background/90 shadow-sm backdrop-blur-sm',
        isFavorite && 'text-destructive hover:text-destructive',
        size === 'md' && 'size-11',
        className,
      )}
      aria-label={
        isFavorite ? `Remove ${productName} from favorites` : `Add ${productName} to favorites`
      }
      aria-pressed={isFavorite}
      disabled={toggle.isPending}
      onClick={onClick}
    >
      <Heart className={cn(iconClass, isFavorite && 'fill-current')} />
    </Button>
  );
}
