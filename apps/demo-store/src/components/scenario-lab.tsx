'use client';

import { useState } from 'react';

import type { CartVariant } from '../lib/cart';
import { formatPrice } from '../lib/catalog';
import {
  changeItemAQuantity,
  changeMerchandiseSubtotal,
  createBadgeFixture,
  createCheckoutFixture,
  createRemovalFixture,
  createShippingFixture,
  removeItemBWithoutCoupon,
  submitCheckout,
} from '../lib/remaining-scenarios';

type ScenarioLabProps = Readonly<{ variant: CartVariant }>;

export function ScenarioLab({ variant }: ScenarioLabProps) {
  const [removal, setRemoval] = useState(createRemovalFixture);
  const [badge, setBadge] = useState(createBadgeFixture);
  const [shipping, setShipping] = useState(createShippingFixture);
  const [checkout, setCheckout] = useState(createCheckoutFixture);
  const [address, setAddress] = useState('');

  return (
    <>
      <p className="eyebrow">CONTROLLED STORE FIXTURES</p>
      <h1>Scenario lab</h1>
      <p className="cart-intro">
        Four independently seeded workflows for replay and corrected-version comparison.
      </p>
      <div className="scenario-grid">
        <section className="scenario-card" aria-labelledby="removal-title">
          <p className="eyebrow">E02 / REQ-CART-002</p>
          <h2 id="removal-title">Removal total</h2>
          <p>
            {removal.itemBPresent ? 'Item A and Item B are in the cart.' : 'Item B is removed.'}
          </p>
          <p data-testid="removal-total">Total: {formatPrice(removal.displayedTotalCents)}</p>
          <button
            className="button"
            disabled={!removal.itemBPresent}
            onClick={() => setRemoval((current) => removeItemBWithoutCoupon(current, variant))}
            type="button"
          >
            Remove Item B
          </button>
        </section>

        <section className="scenario-card" aria-labelledby="badge-title">
          <p className="eyebrow">E03 / REQ-CART-003</p>
          <h2 id="badge-title">Cart badge</h2>
          <p data-testid="cart-badge">Cart badge: {badge.displayedBadgeQuantity}</p>
          <p>Item A quantity: {badge.itemAQuantity}</p>
          <button
            className="button"
            onClick={() => setBadge((current) => changeItemAQuantity(current, 3, variant))}
            type="button"
          >
            Change Item A to 3
          </button>
        </section>

        <section className="scenario-card" aria-labelledby="shipping-title">
          <p className="eyebrow">E04 / REQ-SHIP-001</p>
          <h2 id="shipping-title">Free shipping threshold</h2>
          <p>Merchandise: {formatPrice(shipping.merchandiseSubtotalCents)}</p>
          <p data-testid="shipping-total">
            Shipping: {formatPrice(shipping.shippingCents)} · Total:{' '}
            {formatPrice(shipping.totalCents)}
          </p>
          <button
            className="button"
            onClick={() => setShipping(changeMerchandiseSubtotal(10_000, variant))}
            type="button"
          >
            Set merchandise to $100.00
          </button>
        </section>

        <section className="scenario-card" aria-labelledby="checkout-title">
          <p className="eyebrow">E05 / REQ-CHECKOUT-001</p>
          <h2 id="checkout-title">Required address</h2>
          <label htmlFor="address-line-1">Address line 1</label>
          <input
            id="address-line-1"
            onChange={(event) => setAddress(event.target.value)}
            placeholder="1 Market Street"
            value={address}
          />
          <button
            className="button"
            onClick={() => setCheckout((current) => submitCheckout(current, address, variant))}
            type="button"
          >
            Place order
          </button>
          <p aria-live="polite" data-testid="checkout-result">
            {checkout.validationMessage ?? `Orders created: ${checkout.orderCount}`}
          </p>
        </section>
      </div>
    </>
  );
}
