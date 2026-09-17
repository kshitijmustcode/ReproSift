import type { Metadata } from 'next';

import { CartExperience } from '../../components/cart-experience';
import { resolveCartVariant } from '../../lib/cart-variant';

export const metadata: Metadata = { title: 'Your cart' };

export default function CartPage() {
  return <CartExperience variant={resolveCartVariant()} />;
}
