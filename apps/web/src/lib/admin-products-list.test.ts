import { describe, expect, it } from 'vitest';
import {
  ADMIN_PRODUCTS_LIST_STATE_KEY,
  adminProductsListPath,
  adminProductsListState,
  adminProductsReturnPath,
} from './admin-products-list';

describe('adminProductsListPath', () => {
  it('returns /admin without a query', () => {
    expect(adminProductsListPath()).toBe('/admin');
    expect(adminProductsListPath('')).toBe('/admin');
  });

  it('keeps a leading ? and adds one when missing', () => {
    expect(adminProductsListPath('?q=mew&sort=price')).toBe('/admin?q=mew&sort=price');
    expect(adminProductsListPath('q=mew')).toBe('/admin?q=mew');
  });
});

describe('adminProductsReturnPath', () => {
  it('reads list search from location state', () => {
    expect(
      adminProductsReturnPath(adminProductsListState('?q=charizard&page=2')),
    ).toBe('/admin?q=charizard&page=2');
  });

  it('falls back to /admin when state is missing', () => {
    expect(adminProductsReturnPath(null)).toBe('/admin');
    expect(adminProductsReturnPath({})).toBe('/admin');
  });

  it('uses the state key constant', () => {
    expect(adminProductsListState('?q=x')[ADMIN_PRODUCTS_LIST_STATE_KEY]).toBe('?q=x');
  });
});
