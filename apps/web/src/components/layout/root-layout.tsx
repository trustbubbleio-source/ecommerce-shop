import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useInitAuth } from '../../hooks/use-auth';
import { SetPasswordDialog } from '../auth/set-password-dialog';
import { ChatWidget } from '../chat/chat-widget';
import { CookieNotice } from '../common/cookie-notice';
import { Footer } from './footer';
import { Header } from './header';

export function RootLayout() {
  useInitAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
      <CookieNotice />
      <SetPasswordDialog />
      <ScrollRestoration />
    </div>
  );
}
