import { Card, CardContent, CardHeader, CardTitle } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/auth/auth-form';

export function LoginPage() {
  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome back</CardTitle>
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
