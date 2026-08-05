import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('devrait renvoyer la valeur initiale immédiatement', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 300));
    expect(result.current).toBe('a');
  });

  it('ne devrait pas mettre à jour la valeur avant le délai', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a');
  });

  it('devrait mettre à jour la valeur une fois le délai écoulé', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe('ab');
  });

  it('devrait réinitialiser le minuteur à chaque nouvelle frappe', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    });

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(200));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(200));
    expect(result.current).toBe('a'); // toujours pas mis à jour, le minuteur a été relancé

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('abc');
  });
});
