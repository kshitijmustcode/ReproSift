import { describe, expect, it } from 'vitest';

import {
  changeItemAQuantity,
  changeMerchandiseSubtotal,
  createBadgeFixture,
  createCheckoutFixture,
  createRemovalFixture,
  createShippingFixture,
  removeItemBWithoutCoupon,
  submitCheckout,
} from './remaining-scenarios';

describe('remaining controlled demo fixtures', () => {
  it('E02 preserves the stale total only in the buggy removal fixture', () => {
    expect(removeItemBWithoutCoupon(createRemovalFixture(), 'buggy')).toMatchObject({
      itemBPresent: false,
      displayedTotalCents: 15_000,
    });
    expect(removeItemBWithoutCoupon(createRemovalFixture(), 'corrected')).toMatchObject({
      itemBPresent: false,
      displayedTotalCents: 10_000,
    });
  });

  it('E03 updates the cart badge in the corrected fixture', () => {
    expect(changeItemAQuantity(createBadgeFixture(), 3, 'buggy')).toMatchObject({
      itemAQuantity: 3,
      displayedBadgeQuantity: 1,
    });
    expect(changeItemAQuantity(createBadgeFixture(), 3, 'corrected')).toMatchObject({
      itemAQuantity: 3,
      displayedBadgeQuantity: 3,
    });
  });

  it('E04 gives free shipping at the inclusive $100.00 boundary', () => {
    expect(createShippingFixture()).toMatchObject({ totalCents: 10_400 });
    expect(changeMerchandiseSubtotal(10_000, 'buggy')).toMatchObject({
      shippingCents: 500,
      totalCents: 10_500,
    });
    expect(changeMerchandiseSubtotal(10_000, 'corrected')).toMatchObject({
      shippingCents: 0,
      totalCents: 10_000,
    });
  });

  it('E05 blocks an empty address only in the corrected fixture', () => {
    expect(submitCheckout(createCheckoutFixture(), '', 'buggy')).toMatchObject({ orderCount: 1 });
    expect(submitCheckout(createCheckoutFixture(), '', 'corrected')).toMatchObject({
      orderCount: 0,
      validationMessage: 'Address line 1 is required.',
    });
    expect(submitCheckout(createCheckoutFixture(), '1 Market Street', 'corrected')).toMatchObject({
      orderCount: 1,
      validationMessage: null,
    });
  });
});
