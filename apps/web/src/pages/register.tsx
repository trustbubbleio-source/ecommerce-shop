import { Card, CardContent, CardHeader } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/auth/auth-form';
import { usePageTitle } from '../hooks/use-page-title';

export function RegisterPage() {
  usePageTitle('Create account');

  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-tight">Create your account</h1>
          <p className="text-muted-foreground text-sm">
            Continue with Google, or sign up with your email.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <AuthForm mode="register" />
          <p className="text-muted-foreground text-center text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
