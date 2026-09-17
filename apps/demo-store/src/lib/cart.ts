import { findProduct, type Product } from './catalog';

export const SAMPLE_COUPON_CODE = 'SAVE10';
const DISCOUNT_PERCENT = 10;

export type CartVariant = 'buggy' | 'corrected';
export type CartItemId = 'item-a' | 'item-b';

export type CartLine = Readonly<{
  product: Product;
  quantity: number;
}>;

export type AppliedCoupon = Readonly<{
  code: typeof SAMPLE_COUPON_CODE;
  discountCents: number;
}>;

export type Cart = Readonly<{
  lines: readonly CartLine[];
  coupon: AppliedCoupon | null;
}>;

export type CartTotals = Readonly<{
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
}>;

export type CouponApplication =
  | Readonly<{ accepted: true; cart: Cart }>
  | Readonly<{ accepted: false; cart: Cart; message: string }>;

function requiredSampleProduct(id: CartItemId): Product {
  const product = findProduct(id);

  if (!product) {
    throw new Error(`The sample cart requires catalog product ${id}.`);
  }

  return product;
}

export function createSampleCart(): Cart {
  return {
    lines: [
      { product: requiredSampleProduct('item-a'), quantity: 1 },
      { product: requiredSampleProduct('item-b'), quantity: 1 },
    ],
    coupon: null,
  };
}

export function calculateSubtotalCents(lines: readonly CartLine[]): number {
  return lines.reduce(
    (subtotalCents, line) => subtotalCents + line.product.priceCents * line.quantity,
    0,
  );
}

export function calculateCouponDiscountCents(subtotalCents: number): number {
  return Math.floor((subtotalCents * DISCOUNT_PERCENT + 50) / 100);
}

export function getCartTotals(cart: Cart): CartTotals {
  const subtotalCents = calculateSubtotalCents(cart.lines);
  const discountCents = cart.coupon?.discountCents ?? 0;

  return {
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
  };
}

export function applyCoupon(cart: Cart, couponCode: string): CouponApplication {
  if (couponCode.trim().toUpperCase() !== SAMPLE_COUPON_CODE) {
    return {
      accepted: false,
      cart,
      message: 'Enter SAVE10 to apply the sample coupon.',
    };
  }

  return {
    accepted: true,
    cart: {
      ...cart,
      coupon: {
        code: SAMPLE_COUPON_CODE,
        discountCents: calculateCouponDiscountCents(calculateSubtotalCents(cart.lines)),
      },
    },
  };
}

export function removeCartItem(cart: Cart, itemId: CartItemId, variant: CartVariant): Cart {
  const lines = cart.lines.filter((line) => line.product.id !== itemId);

  if (!cart.coupon) {
    return { ...cart, lines };
  }

  const discountCents =
    variant === 'corrected'
      ? calculateCouponDiscountCents(calculateSubtotalCents(lines))
      : cart.coupon.discountCents;

  return {
    lines,
    coupon: { ...cart.coupon, discountCents },
  };
}
