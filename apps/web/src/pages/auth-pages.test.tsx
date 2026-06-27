import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../test/utils';

describe('auth pages', () => {
  it('renders the register page with a link to login', async () => {
    renderApp('/register');
    expect(await screen.findByText('Create your account')).toBeInTheDocument();
    const signInLinks = screen.getAllByRole('link', { name: 'Sign in' });
    expect(signInLinks.some((link) => link.getAttribute('href') === '/login')).toBe(true);
  });

  it('renders the login page with a link to register', async () => {
    renderApp('/login');
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create an account/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });
});
