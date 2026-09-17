'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  applyCoupon,
  createSampleCart,
  getCartTotals,
  removeCartItem,
  SAMPLE_COUPON_CODE,
  type Cart,
  type CartVariant,
} from '../lib/cart';
import { formatPrice } from '../lib/catalog';

type CartExperienceProps = Readonly<{
  variant: CartVariant;
}>;

export function CartExperience({ variant }: CartExperienceProps) {
  const [cart, setCart] = useState<Cart>(createSampleCart);
  const [couponCode, setCouponCode] = useState('');
  const [notice, setNotice] = useState('Sample cart ready.');
  const totals = getCartTotals(cart);

  function handleCouponApply() {
    const result = applyCoupon(cart, couponCode);
    setCart(result.cart);
    setNotice(result.accepted ? `${SAMPLE_COUPON_CODE} applied.` : result.message);
  }

  function handleItemRemoval(itemId: 'item-a' | 'item-b') {
    setCart((currentCart) => removeCartItem(currentCart, itemId, variant));
    setNotice(`${itemId === 'item-a' ? 'Item A' : 'Item B'} removed from cart.`);
  }

  function itemIdForRemoval(productId: string): 'item-a' | 'item-b' {
    if (productId === 'item-a' || productId === 'item-b') {
      return productId;
    }

    throw new Error(`The sample cart cannot remove unknown product ${productId}.`);
  }

  function handleReset() {
    setCart(createSampleCart());
    setCouponCode('');
    setNotice('Sample cart reset.');
  }

  return (
    <>
      <Link className="back-link" href="/">
        ← Back to collection
      </Link>
      <p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p>
      <h1>Your cart</h1>
      <p className="cart-intro">A seeded sample cart for the SAVE10 coupon workflow.</p>
      <div className="cart-layout">
        <section className="cart-lines" aria-label="Cart items">
          {cart.lines.map((line) => (
            <article
              className="cart-line"
              key={line.product.id}
              data-testid={`cart-line-${line.product.id}`}
            >
              <div>
                <p className="eyebrow">{line.product.category}</p>
                <h2>{line.product.name}</h2>
                <p>Quantity {line.quantity}</p>
              </div>
              <div className="cart-line-actions">
                <strong>{formatPrice(line.product.priceCents * line.quantity)}</strong>
                <button
                  className="text-button"
                  onClick={() => handleItemRemoval(itemIdForRemoval(line.product.id))}
                  type="button"
                >
                  Remove {line.product.name}
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="cart-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <label className="coupon-field" htmlFor="coupon-code">
            Coupon code
            <span className="coupon-input-row">
              <input
                id="coupon-code"
                onChange={(event) => setCouponCode(event.target.value)}
                placeholder="SAVE10"
                value={couponCode}
              />
              <button className="button" onClick={handleCouponApply} type="button">
                Apply
              </button>
            </span>
          </label>
          <dl className="cart-totals">
            <div>
              <dt>Subtotal</dt>
              <dd data-testid="cart-subtotal">{formatPrice(totals.subtotalCents)}</dd>
            </div>
            <div>
              <dt>Discount</dt>
              <dd data-testid="cart-discount">−{formatPrice(totals.discountCents)}</dd>
            </div>
            <div className="cart-total">
              <dt>Total</dt>
              <dd data-testid="cart-total">{formatPrice(totals.totalCents)}</dd>
            </div>
          </dl>
          <p aria-live="polite" className="cart-notice" data-testid="cart-status">
            {notice}
          </p>
          <button className="secondary-button" onClick={handleReset} type="button">
            Reset sample cart
          </button>
        </aside>
      </div>
    </>
  );
}
