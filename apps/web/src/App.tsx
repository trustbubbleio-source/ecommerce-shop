import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { AppProviders } from './providers/app-providers';
import { routes } from './router';

const router = createBrowserRouter(routes);

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
