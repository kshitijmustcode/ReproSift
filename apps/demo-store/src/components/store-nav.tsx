'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';

export function StoreNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Store navigation">
      <Link
        href="/"
        aria-current={pathname === '/' || pathname.startsWith('/products/') ? 'page' : undefined}
      >
        Collection
      </Link>
      <Link href="/cart" aria-current={pathname === '/cart' ? 'page' : undefined}>
        <ShoppingBag size={17} aria-hidden="true" />
        Cart
      </Link>
    </nav>
  );
}
