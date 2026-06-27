import { Button } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { Pokeball } from '../components/common/pokeball';

export function NotFoundPage() {
  return (
    <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <Pokeball className="text-primary/40 size-20" />
      <p className="text-5xl font-extrabold tracking-tight">404</p>
      <h1 className="text-xl font-semibold">This page got away</h1>
      <p className="text-muted-foreground max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  );
}
