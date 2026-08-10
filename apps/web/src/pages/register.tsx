import { Card, CardContent, CardHeader, CardTitle } from '@akknerds/ui';
import { Link } from 'react-router-dom';
import { AuthForm } from '../components/auth/auth-form';

export function RegisterPage() {
  return (
    <div className="container flex justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create your account</CardTitle>
          <p className="text-muted-foreground text-sm">
            Join One More Rip for faster checkout and order tracking.
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
