import { Spinner } from '@akknerds/ui';
import { lazy, Suspense, type ComponentType } from 'react';
import type { RouteObject } from 'react-router-dom';
import { AdminGuard } from './components/admin/admin-guard';
import { AdminLayout } from './components/layout/admin-layout';
import { RootLayout } from './components/layout/root-layout';
/** Eager: first-paint routes (home + shop + cart/checkout + auth). */
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { CheckoutSuccessPage } from './pages/checkout-success';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { RegisterPage } from './pages/register';
import { ShopPage } from './pages/shop';

function lazyNamed(loader: () => Promise<Record<string, unknown>>, exportName: string) {
  const Page = lazy(async () => {
    const mod = await loader();
    const Comp = mod[exportName];
    if (typeof Comp !== 'function' && (typeof Comp !== 'object' || Comp === null)) {
      throw new Error(`Missing page export "${exportName}"`);
    }
    return { default: Comp as ComponentType };
  });
  return (
    <Suspense
      fallback={
        <div className="container flex justify-center py-24">
          <Spinner className="size-8" label="Loading page" />
        </div>
      }
    >
      <Page />
    </Suspense>
  );
}

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'sell', element: lazyNamed(() => import('./pages/sell'), 'SellPage') },
      {
        path: 'product/:slug',
        element: lazyNamed(() => import('./pages/product-detail'), 'ProductDetailPage'),
      },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/success', element: <CheckoutSuccessPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      {
        path: 'forgot-password',
        element: lazyNamed(() => import('./pages/forgot-password'), 'ForgotPasswordPage'),
      },
      {
        path: 'reset-password',
        element: lazyNamed(() => import('./pages/reset-password'), 'ResetPasswordPage'),
      },
      {
        path: 'verify-email',
        element: lazyNamed(() => import('./pages/verify-email'), 'VerifyEmailPage'),
      },
      {
        path: 'account',
        element: lazyNamed(() => import('./pages/account/layout'), 'AccountLayout'),
        children: [
          {
            index: true,
            element: lazyNamed(() => import('./pages/account/profile'), 'AccountProfilePage'),
          },
          {
            path: 'orders',
            element: lazyNamed(() => import('./pages/account/orders'), 'AccountOrdersPage'),
          },
          {
            path: 'orders/:orderId',
            element: lazyNamed(
              () => import('./pages/account/order-detail'),
              'AccountOrderDetailPage',
            ),
          },
          {
            path: 'favorites',
            element: lazyNamed(() => import('./pages/account/favorites'), 'AccountFavoritesPage'),
          },
          {
            path: 'want-list',
            element: lazyNamed(() => import('./pages/account/want-list'), 'AccountWantListPage'),
          },
          {
            path: 'discount',
            element: lazyNamed(() => import('./pages/account/discount'), 'AccountDiscountPage'),
          },
          {
            path: 'settings',
            element: lazyNamed(() => import('./pages/account/settings'), 'AccountSettingsPage'),
          },
        ],
      },
      { path: 'contact', element: lazyNamed(() => import('./pages/contact'), 'ContactPage') },
      { path: 'shipping', element: lazyNamed(() => import('./pages/shipping'), 'ShippingPage') },
      { path: 'returns', element: lazyNamed(() => import('./pages/returns'), 'ReturnsPage') },
      { path: 'terms', element: lazyNamed(() => import('./pages/terms'), 'TermsPage') },
      { path: 'privacy', element: lazyNamed(() => import('./pages/privacy'), 'PrivacyPage') },
      { path: 'cookies', element: lazyNamed(() => import('./pages/cookies'), 'CookiesPage') },
      { path: 'partners', element: lazyNamed(() => import('./pages/partners'), 'PartnersPage') },
      { path: 'socials', element: lazyNamed(() => import('./pages/socials'), 'SocialsPage') },
      { path: 'blog', element: lazyNamed(() => import('./pages/blog'), 'BlogPage') },
      {
        path: 'blog/:slug',
        element: lazyNamed(() => import('./pages/blog-post'), 'BlogPostPage'),
      },
      {
        path: 'services/grading-submission',
        element: lazyNamed(
          () => import('./pages/services/grading-submission'),
          'GradingSubmissionPage',
        ),
      },
      {
        path: 'services/card-restoration',
        element: lazyNamed(
          () => import('./pages/services/card-restoration'),
          'CardRestorationPage',
        ),
      },
      { path: 'faq', element: lazyNamed(() => import('./pages/faq'), 'FaqPage') },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        element: <AdminGuard />,
        children: [
          {
            index: true,
            element: lazyNamed(() => import('./pages/admin/products'), 'AdminProductsPage'),
          },
          {
            path: 'orders',
            element: lazyNamed(() => import('./pages/admin/orders'), 'AdminOrdersPage'),
          },
          {
            path: 'orders/:orderId',
            element: lazyNamed(() => import('./pages/admin/order-detail'), 'AdminOrderDetailPage'),
          },
          {
            path: 'want-list',
            element: lazyNamed(() => import('./pages/admin/want-list'), 'AdminWantListPage'),
          },
          {
            path: 'submissions',
            element: lazyNamed(() => import('./pages/admin/submissions'), 'AdminSubmissionsPage'),
          },
          {
            path: 'new',
            element: lazyNamed(() => import('./pages/admin/new-product'), 'AdminNewProductPage'),
          },
          {
            path: 'products/:id',
            element: lazyNamed(() => import('./pages/admin/edit-product'), 'AdminEditProductPage'),
          },
        ],
      },
    ],
  },
];
