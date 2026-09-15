import { describe, expect, it } from 'vitest';

import { findProduct, formatPrice, products } from './catalog';

describe('demo catalog', () => {
  it('retains the authored sample item IDs and integer-cent prices', () => {
    expect(products.map(({ id, priceCents }) => ({ id, priceCents }))).toEqual([
      { id: 'item-a', priceCents: 10000 },
      { id: 'item-b', priceCents: 5000 },
    ]);
  });

  it('finds only known products', () => {
    expect(findProduct('item-b')?.name).toBe('Item B');
    expect(findProduct('unknown')).toBeUndefined();
  });

  it('formats integer cents as en-US currency', () => {
    expect(formatPrice(9000)).toBe('$90.00');
  });
});
