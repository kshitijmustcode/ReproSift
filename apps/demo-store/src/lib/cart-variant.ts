import type { CartVariant } from './cart';

const DEFAULT_VARIANT: CartVariant = 'buggy';

export function resolveCartVariant(value = process.env.DEMO_STORE_VARIANT): CartVariant {
  if (value === undefined || value === '') {
    return DEFAULT_VARIANT;
  }

  if (value === 'buggy' || value === 'corrected') {
    return value;
  }

  throw new Error('DEMO_STORE_VARIANT must be either "buggy" or "corrected".');
}
