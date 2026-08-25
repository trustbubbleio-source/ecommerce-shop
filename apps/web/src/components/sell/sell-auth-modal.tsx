import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@akknerds/ui';
import { Link } from 'react-router-dom';

interface SellAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Gate shown when a guest tries to send a sell request. */
export function SellAuthModal({ open, onOpenChange }: SellAuthModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create an account to send</DialogTitle>
          <DialogDescription>
            Build your lot for free — when you&apos;re ready to submit, sign in so we can reply to
            you about an offer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-stretch">
          <Button asChild className="w-full sm:flex-1">
            <Link to="/register" state={{ from: '/sell' }} onClick={() => onOpenChange(false)}>
              Create free account
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:flex-1">
            <Link to="/login" state={{ from: '/sell' }} onClick={() => onOpenChange(false)}>
              Sign in
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
