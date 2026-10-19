import { Card, CardContent, CardHeader } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/auth/auth-form';
import { usePageTitle } from '../hooks/use-page-title';

export function LoginPage() {
  usePageTitle('Sign in');

  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-tight">Welcome back</h1>
          <p className="text-muted-foreground text-sm">Sign in to your One More Rip account.</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="login" />
          <p className="text-muted-foreground text-center text-sm">
            <Link to="/forgot-password" className="text-primary font-semibold hover:underline">
              Forgot password?
            </Link>
          </p>
          <p className="text-muted-foreground text-center text-sm">
            New here?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
