import type { CartVariant } from './cart';

const ITEM_A_PRICE_CENTS = 10_000;
const ITEM_B_PRICE_CENTS = 5_000;
const SHIPPING_FEE_CENTS = 500;

export type RemovalFixture = Readonly<{
  itemBPresent: boolean;
  displayedTotalCents: number;
}>;

export function createRemovalFixture(): RemovalFixture {
  return { itemBPresent: true, displayedTotalCents: ITEM_A_PRICE_CENTS + ITEM_B_PRICE_CENTS };
}

export function removeItemBWithoutCoupon(
  fixture: RemovalFixture,
  variant: CartVariant,
): RemovalFixture {
  return {
    itemBPresent: false,
    displayedTotalCents: variant === 'corrected' ? ITEM_A_PRICE_CENTS : fixture.displayedTotalCents,
  };
}

export type BadgeFixture = Readonly<{
  itemAQuantity: number;
  displayedBadgeQuantity: number;
}>;

export function createBadgeFixture(): BadgeFixture {
  return { itemAQuantity: 1, displayedBadgeQuantity: 1 };
}

export function changeItemAQuantity(
  fixture: BadgeFixture,
  quantity: number,
  variant: CartVariant,
): BadgeFixture {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error('Quantity must be a positive integer.');
  }

  return {
    itemAQuantity: quantity,
    displayedBadgeQuantity: variant === 'corrected' ? quantity : fixture.displayedBadgeQuantity,
  };
}

export type ShippingFixture = Readonly<{
  merchandiseSubtotalCents: number;
  shippingCents: number;
  totalCents: number;
}>;

export function createShippingFixture(): ShippingFixture {
  return calculateShippingFixture(9_900, 'corrected');
}

export function changeMerchandiseSubtotal(
  subtotalCents: number,
  variant: CartVariant,
): ShippingFixture {
  if (!Number.isInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error('Merchandise subtotal must be a non-negative integer.');
  }

  return calculateShippingFixture(subtotalCents, variant);
}

function calculateShippingFixture(
  merchandiseSubtotalCents: number,
  variant: CartVariant,
): ShippingFixture {
  const qualifiesForFreeShipping =
    variant === 'corrected'
      ? merchandiseSubtotalCents >= ITEM_A_PRICE_CENTS
      : merchandiseSubtotalCents > ITEM_A_PRICE_CENTS;
  const shippingCents = qualifiesForFreeShipping ? 0 : SHIPPING_FEE_CENTS;
  return {
    merchandiseSubtotalCents,
    shippingCents,
    totalCents: merchandiseSubtotalCents + shippingCents,
  };
}

export type CheckoutFixture = Readonly<{
  addressLine1: string;
  validationMessage: string | null;
  orderCount: number;
}>;

export function createCheckoutFixture(): CheckoutFixture {
  return { addressLine1: '', validationMessage: null, orderCount: 0 };
}

export function submitCheckout(
  fixture: CheckoutFixture,
  addressLine1: string,
  variant: CartVariant,
): CheckoutFixture {
  const hasAddress = addressLine1.trim().length > 0;
  if (!hasAddress && variant === 'corrected') {
    return { ...fixture, addressLine1, validationMessage: 'Address line 1 is required.' };
  }

  return {
    addressLine1,
    validationMessage: null,
    orderCount: fixture.orderCount + 1,
  };
}
