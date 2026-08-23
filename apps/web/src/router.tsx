import type { RouteObject } from 'react-router-dom';
import { AdminGuard } from './components/admin/admin-guard';
import { AdminLayout } from './components/layout/admin-layout';
import { RootLayout } from './components/layout/root-layout';
import { AccountPage } from './pages/account';
import { BlogPage } from './pages/blog';
import { BlogPostPage } from './pages/blog-post';
import { AdminEditProductPage } from './pages/admin/edit-product';
import { AdminProductsPage } from './pages/admin/products';
import { AdminNewProductPage } from './pages/admin/new-product';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { CheckoutSuccessPage } from './pages/checkout-success';
import { ContactPage } from './pages/contact';
import { FaqPage } from './pages/faq';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { PartnersPage } from './pages/partners';
import { PrivacyPage } from './pages/privacy';
import { ProductDetailPage } from './pages/product-detail';
import { RegisterPage } from './pages/register';
import { ShopPage } from './pages/shop';
import { SocialsPage } from './pages/socials';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'product/:slug', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/success', element: <CheckoutSuccessPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
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
