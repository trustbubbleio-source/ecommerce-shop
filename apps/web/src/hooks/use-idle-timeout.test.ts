import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIdleTimeout } from './use-idle-timeout';

describe('useIdleTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onIdle after the timeout with no activity', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimeout(onIdle, 1_000));

    expect(onIdle).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(onIdle).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on pointer activity', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimeout(onIdle, 1_000));

    act(() => {
      vi.advanceTimersByTime(800);
      window.dispatchEvent(new Event('pointerdown'));
      vi.advanceTimersByTime(800);
    });
    expect(onIdle).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('does nothing when disabled', () => {
    const onIdle = vi.fn();
    renderHook(() => useIdleTimeout(onIdle, 1_000, false));

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(onIdle).not.toHaveBeenCalled();
  });
});
