// Presentation data only. Attempt-scoped seeds and variants arrive in Step 11.
export type Product = Readonly<{
  id: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  illustration: 'backpack' | 'headphones';
}>;

export const products: readonly Product[] = [
  {
    id: 'item-a',
    name: 'Item A',
    category: 'Everyday carry',
    description:
      'A compact everyday backpack with room for your daily essentials. A simple companion for the commute and everything after.',
    priceCents: 10000,
    illustration: 'backpack',
  },
  {
    id: 'item-b',
    name: 'Item B',
    category: 'Sound & focus',
    description:
      'Lightweight over-ear headphones for your everyday soundtrack. An understated addition to your desk or travel bag.',
    priceCents: 5000,
    illustration: 'headphones',
  },
];

export function findProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id);
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
