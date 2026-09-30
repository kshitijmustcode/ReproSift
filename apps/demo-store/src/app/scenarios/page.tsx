import type { Metadata } from 'next';

import { ScenarioLab } from '../../components/scenario-lab';
import { resolveCartVariant } from '../../lib/cart-variant';

export const metadata: Metadata = { title: 'Scenario lab' };

export default function ScenarioLabPage() {
  return <ScenarioLab variant={resolveCartVariant()} />;
}
