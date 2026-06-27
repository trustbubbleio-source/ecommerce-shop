import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider, useToast } from './toast.js';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe('useToast', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('throws when used outside a provider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/);
  });

  it('shows a toast and auto-dismisses after the duration', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.toast({ title: 'Saved', description: 'All good', variant: 'success' });
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('All good')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('dismisses programmatically by id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    let id = '';
    act(() => {
      id = result.current.toast({ title: 'Bye', variant: 'error' });
    });
    expect(screen.getByText('Bye')).toBeInTheDocument();
    act(() => {
      result.current.dismiss(id);
    });
    expect(screen.queryByText('Bye')).not.toBeInTheDocument();
  });
});

describe('toast dismiss button', () => {
  it('removes the toast when the close button is clicked', async () => {
    const user = userEvent.setup();
    function Trigger() {
      const { toast } = useToast();
      return (
        <button type="button" onClick={() => toast({ title: 'Hello' })}>
          notify
        </button>
      );
    }
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'notify' }));
    expect(screen.getByText('Hello')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });
});
