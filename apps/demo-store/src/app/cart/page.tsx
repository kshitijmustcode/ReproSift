import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = { title: 'Your cart' };

export default function CartPage() {
  return (
    <>
      <Link className="back-link" href="/">
        ← Back to collection
      </Link>
      <p className="eyebrow">YOUR EVERYDAY ESSENTIALS</p>
      <h1>Your cart</h1>
      <section className="empty-state" aria-labelledby="cart-empty-title">
        <ShoppingBag size={40} strokeWidth={1.2} aria-hidden="true" />
        <h2 id="cart-empty-title">A little room for the essentials.</h2>
        <p>
          Your cart is empty. Adding items and applying coupons will be available in a later update.
        </p>
        <Link className="button" href="/">
          Explore the collection
        </Link>
        <Link className="text-link" href="/checkout">
          Preview checkout →
        </Link>
      </section>
    </>
  );
}
