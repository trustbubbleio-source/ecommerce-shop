import type { RouteObject } from 'react-router-dom';
import { AdminGuard } from './components/admin/admin-guard';
import { AdminLayout } from './components/layout/admin-layout';
import { RootLayout } from './components/layout/root-layout';
import { AccountDiscountPage } from './pages/account/discount';
import { AccountFavoritesPage } from './pages/account/favorites';
import { AccountLayout } from './pages/account/layout';
import { AccountOrdersPage } from './pages/account/orders';
import { AccountProfilePage } from './pages/account/profile';
import { AccountSettingsPage } from './pages/account/settings';
import { BlogPage } from './pages/blog';
import { BlogPostPage } from './pages/blog-post';
import { AdminEditProductPage } from './pages/admin/edit-product';
import { AdminProductsPage } from './pages/admin/products';
import { AdminNewProductPage } from './pages/admin/new-product';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { CheckoutSuccessPage } from './pages/checkout-success';
import { ContactPage } from './pages/contact';
import { CookiesPage } from './pages/cookies';
import { FaqPage } from './pages/faq';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { PartnersPage } from './pages/partners';
import { PrivacyPage } from './pages/privacy';
import { ProductDetailPage } from './pages/product-detail';
import { RegisterPage } from './pages/register';
import { ForgotPasswordPage } from './pages/forgot-password';
import { ResetPasswordPage } from './pages/reset-password';
import { VerifyEmailPage } from './pages/verify-email';
import { ReturnsPage } from './pages/returns';
import { ShippingPage } from './pages/shipping';
import { ShopPage } from './pages/shop';
import { SellPage } from './pages/sell';
import { SocialsPage } from './pages/socials';
import { TermsPage } from './pages/terms';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'sell', element: <SellPage /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/success', element: <CheckoutSuccessPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      {
        path: 'account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountProfilePage /> },
          { path: 'orders', element: <AccountOrdersPage /> },
          { path: 'favorites', element: <AccountFavoritesPage /> },
          { path: 'discount', element: <AccountDiscountPage /> },
          { path: 'settings', element: <AccountSettingsPage /> },
        ],
      },
      { path: 'contact', element: <ContactPage /> },
      { path: 'shipping', element: <ShippingPage /> },
      { path: 'returns', element: <ReturnsPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'cookies', element: <CookiesPage /> },
      { path: 'partners', element: <PartnersPage /> },
      { path: 'socials', element: <SocialsPage /> },
      { path: 'blog', element: <BlogPage /> },
      { path: 'blog/:slug', element: <BlogPostPage /> },
      { path: 'faq', element: <FaqPage /> },
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
          { index: true, element: <AdminProductsPage /> },
          { path: 'new', element: <AdminNewProductPage /> },
          { path: 'products/:id', element: <AdminEditProductPage /> },
        ],
      },
    ],
  },
];
