import { Backpack, Headphones } from 'lucide-react';
import type { Product } from '@/lib/catalog';

export function ProductArt({ illustration }: { illustration: Product['illustration'] }) {
  const Icon = illustration === 'backpack' ? Backpack : Headphones;
  return (
    <div className={`product-art ${illustration}`} aria-hidden="true">
      <div className="art-circle">
        <Icon strokeWidth={1} />
      </div>
      <span className="art-caption">THE EVERYDAY COLLECTION</span>
    </div>
  );
}
