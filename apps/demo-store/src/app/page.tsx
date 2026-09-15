import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ProductArt } from '@/components/product-art';
import { formatPrice, products } from '@/lib/catalog';

export default function CatalogPage() {
  return (
    <>
      <section className="collection-intro">
        <p className="eyebrow">01 / THE EVERYDAY COLLECTION</p>
        <h1>
          Simple things.
          <br />
          <span>Everyday companions.</span>
        </h1>
        <p>
          A considered collection for your daily routine.
          <br />
          Start with the essentials.
        </p>
      </section>
      <section aria-labelledby="collection-title">
        <div className="section-heading">
          <h2 id="collection-title">Explore the collection</h2>
          <span>{products.length} items</span>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <Link
              className="product-card"
              href={`/products/${product.id}`}
              key={product.id}
              aria-label={`View ${product.name}, ${product.category}, ${formatPrice(product.priceCents)}`}
            >
              <ProductArt illustration={product.illustration} />
              <div className="product-caption">
                <div>
                  <p className="eyebrow">{product.category}</p>
                  <h3>
                    {product.name} <ArrowUpRight size={19} aria-hidden="true" />
                  </h3>
                </div>
                <span>{formatPrice(product.priceCents)}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
