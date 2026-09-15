import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageCheck } from 'lucide-react';

export const metadata: Metadata = { title: 'Checkout preview' };

export default function CheckoutPage() {
  return (
    <>
      <Link className="back-link" href="/cart">
        ← Back to cart
      </Link>
      <p className="eyebrow">THE FINAL DETAILS</p>
      <h1>Checkout preview</h1>
      <section className="empty-state" aria-labelledby="checkout-title">
        <PackageCheck size={40} strokeWidth={1.2} aria-hidden="true" />
        <h2 id="checkout-title">Your order will come together here.</h2>
        <p>
          There are no items to review yet. This demo cannot place orders or collect payment
          details.
        </p>
        <button className="button" disabled>
          Place demo order
        </button>
        <Link className="text-link" href="/">
          Continue browsing →
        </Link>
      </section>
    </>
  );
}
