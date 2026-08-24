import { setPasswordInputSchema } from '@akknerds/shared';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Spinner,
  useToast,
} from '@akknerds/ui';
import { type FormEvent, useState } from 'react';
import { ApiError } from '../../lib/api';
import { useSetPassword } from '../../hooks/use-auth';
import { useAuthStore } from '../../store/auth';

export function SetPasswordDialog() {
  const open = useAuthStore((s) => s.mustSetPassword && Boolean(s.user));
  const setPassword = useSetPassword();
  const { toast } = useToast();
  const [password, setPasswordValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    const parsed = setPasswordInputSchema.safeParse({ password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid password');
      return;
    }
    setError(undefined);
    try {
      await setPassword.mutateAsync(parsed.data.password);
      toast({ title: 'Password saved', description: 'You are all set.', variant: 'success' });
      setPasswordValue('');
      setConfirm('');
    } catch (err) {
      toast({
        title: 'Could not save password',
        description: err instanceof ApiError ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent hideClose className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Choose a password</DialogTitle>
          <DialogDescription>
            Your email is confirmed. Set a password so you can sign in next time.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Field label="Password" error={error} hint="At least 8 characters" required>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(ev) => setPasswordValue(ev.target.value)}
              />
            )}
          </Field>
          <Field label="Confirm password" required>
            {(props) => (
              <Input
                {...props}
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(ev) => setConfirm(ev.target.value)}
              />
            )}
          </Field>
          <DialogFooter>
            <Button type="submit" size="lg" block disabled={setPassword.isPending}>
              {setPassword.isPending && <Spinner className="text-primary-foreground" />}
              Save password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
