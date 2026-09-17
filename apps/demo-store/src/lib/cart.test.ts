import { describe, expect, it } from 'vitest';

import { applyCoupon, createSampleCart, getCartTotals, removeCartItem } from './cart';
import { resolveCartVariant } from './cart-variant';

function applySampleCoupon() {
  const result = applyCoupon(createSampleCart(), 'SAVE10');

  if (!result.accepted) {
    throw new Error('The sample coupon should be accepted.');
  }

  return result.cart;
}

describe('sample cart fixture', () => {
  it('starts with the documented seeded subtotal and no discount', () => {
    expect(getCartTotals(createSampleCart())).toEqual({
      subtotalCents: 15000,
      discountCents: 0,
      totalCents: 15000,
    });
  });

  it('applies SAVE10 to the current initial subtotal', () => {
    expect(getCartTotals(applySampleCoupon())).toEqual({
      subtotalCents: 15000,
      discountCents: 1500,
      totalCents: 13500,
    });
  });

  it('retains the stale coupon discount in the buggy variant after Item B is removed', () => {
    const cart = removeCartItem(applySampleCoupon(), 'item-b', 'buggy');

    expect(getCartTotals(cart)).toEqual({
      subtotalCents: 10000,
      discountCents: 1500,
      totalCents: 8500,
    });
  });

  it('recalculates the coupon discount in the corrected variant after Item B is removed', () => {
    const cart = removeCartItem(applySampleCoupon(), 'item-b', 'corrected');

    expect(getCartTotals(cart)).toEqual({
      subtotalCents: 10000,
      discountCents: 1000,
      totalCents: 9000,
    });
  });

  it('keeps the no-coupon removal control at the current subtotal', () => {
    const cart = removeCartItem(createSampleCart(), 'item-b', 'buggy');

    expect(getCartTotals(cart)).toEqual({
      subtotalCents: 10000,
      discountCents: 0,
      totalCents: 10000,
    });
  });

  it('rejects an unsupported coupon without changing the cart', () => {
    const cart = createSampleCart();
    const result = applyCoupon(cart, 'SAVE20');

    expect(result).toEqual({
      accepted: false,
      cart,
      message: 'Enter SAVE10 to apply the sample coupon.',
    });
  });

  it('uses the buggy variant by default and validates local fixture configuration', () => {
    expect(resolveCartVariant()).toBe('buggy');
    expect(resolveCartVariant('corrected')).toBe('corrected');
    expect(() => resolveCartVariant('unknown')).toThrow('DEMO_STORE_VARIANT');
  });
});
