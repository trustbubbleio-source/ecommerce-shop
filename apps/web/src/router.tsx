import type { RouteObject } from 'react-router-dom';
import { RootLayout } from './components/layout/root-layout';
import { AccountPage } from './pages/account';
import { CartPage } from './pages/cart';
import { CheckoutPage } from './pages/checkout';
import { CheckoutSuccessPage } from './pages/checkout-success';
import { ContactPage } from './pages/contact';
import { HomePage } from './pages/home';
import { LoginPage } from './pages/login';
import { NotFoundPage } from './pages/not-found';
import { ProductDetailPage } from './pages/product-detail';
import { RegisterPage } from './pages/register';
import { ShopPage } from './pages/shop';

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
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
