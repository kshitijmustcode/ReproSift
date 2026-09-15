import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductArt } from '@/components/product-art';
import { findProduct, formatPrice } from '@/lib/catalog';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = findProduct((await params).id);
  return { title: product?.name ?? 'Product not found' };
}

export default async function ProductPage({ params }: Props) {
  const product = findProduct((await params).id);
  if (!product) notFound();

  return (
    <>
      <Link className="back-link" href="/">
        ← Back to collection
      </Link>
      <div className="detail-grid">
        <ProductArt illustration={product.illustration} />
        <section className="product-details">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{formatPrice(product.priceCents)}</p>
          <p>{product.description}</p>
          <button className="button" disabled aria-describedby="cart-availability">
            Add to cart
          </button>
          <p className="help-text" id="cart-availability">
            Cart actions are coming soon. You can explore the page previews now.
          </p>
          <Link className="text-link" href="/cart">
            Preview cart →
          </Link>
        </section>
      </div>
    </>
  );
}
