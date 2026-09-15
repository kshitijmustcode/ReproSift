import type { Metadata } from 'next';
import { Check, FileText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { DraftForm } from '@/components/draft-form';

export const metadata: Metadata = { title: 'New investigation' };

export default function NewInvestigationPage() {
  return (
    <>
      <PageHeader
        eyebrow="START WITH THE BEHAVIOR"
        title="A good report starts with context."
        description="Tell us what happened, what you expected, and where to look."
      />
      <div className="two-column">
        <DraftForm />
        <aside className="guide-card">
          <FileText size={24} />
          <h2>Give the investigation a head start.</h2>
          <p>The most useful reports make the unexpected behavior specific.</p>
          <ul className="guide-list">
            <li>
              <Check size={16} /> Actions that led to the issue
            </li>
            <li>
              <Check size={16} /> What you actually observed
            </li>
            <li>
              <Check size={16} /> What should happen instead
            </li>
            <li>
              <Check size={16} /> A requirement, if available
            </li>
          </ul>
          <div className="guide-example">
            <span className="eyebrow">FOR EXAMPLE</span>
            <p>
              “After applying a coupon and removing an item, the discount still uses the old
              subtotal.”
            </p>
          </div>
          <p className="field-hint">
            You can explore the sample without entering any personal information.
          </p>
        </aside>
      </div>
    </>
  );
}
