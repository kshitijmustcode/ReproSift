import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileCode2, Repeat2, Scale } from 'lucide-react';
import { PageHeader, PreviewNotice } from '@/components/page-header';
import { sampleCase, sampleWorkspacePath } from '@/lib/sample-case';

export const metadata: Metadata = { title: 'Result & replay' };

const sampleTest = `import { expect, test } from 'playwright/test';

test('sample-coupon regression', async ({ page }) => {
  await page.goto('/cart');
  await page.getByTestId('coupon-code').fill('SAVE10');
  await page.getByRole('button', { exact: true, name: 'Apply' }).click();
  await page.getByRole('button', { exact: true, name: 'Remove Item B' }).click();
  await expect(page.getByTestId('cart-total')).toHaveText('$90.00');
});
`;
const sampleTestDownload = `data:text/plain;charset=utf-8,${encodeURIComponent(sampleTest)}`;

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== sampleCase.id) notFound();
  return (
    <>
      <PageHeader
        eyebrow="SAMPLE CASE / RESULT & REPLAY"
        title="A conclusion needs proof."
        description="Review the observed behavior and verify it with an independent replay."
        action={
          <Link className="button secondary" href={sampleWorkspacePath}>
            <ArrowLeft size={16} /> Back to workspace
          </Link>
        }
      />
      <PreviewNotice />
      <section className="panel result-banner">
        <div className="empty-icon">
          <Scale size={26} />
        </div>
        <div>
          <span className="eyebrow">VERIFICATION STATUS</span>
          <h2>Replay candidate ready</h2>
          <p>
            The authored $90.00 assertion is ready for a fresh-state replay and corrected-version
            comparison.
          </p>
        </div>
        <span className="pill">Evidence pending</span>
      </section>
      <div className="two-column equal-columns">
        <section className="panel detail-panel">
          <div className="section-kicker">
            <FileCode2 size={17} /> Regression test
          </div>
          <h2>From steps to a runnable test.</h2>
          <p>
            Generated from the immutable sample candidate. It asserts $90.00, never the buggy $85.00
            value.
          </p>
          <a
            className="button secondary"
            download="sample-coupon.spec.ts"
            href={sampleTestDownload}
          >
            Download test
          </a>
        </section>
        <section className="panel detail-panel">
          <div className="section-kicker">
            <Repeat2 size={17} /> Independent replay
          </div>
          <h2>Same test. Fresh starting state.</h2>
          <p>
            Comparison runs the same content hash on buggy and corrected fixtures. Results appear
            here once a worker owns replay execution.
          </p>
          <span className="muted-label">Awaiting replay worker</span>
        </section>
      </div>
      <section className="panel detail-panel">
        <div className="section-kicker">
          <Scale size={17} /> Evidence
        </div>
        <h2>What the result retains.</h2>
        <p>
          Screenshot, action log, console messages, and same-origin request metadata are attached to
          a replay attempt when it runs.
        </p>
      </section>
      <div className="requirement-note">
        <strong>What a valid result needs</strong>
        <p>
          The intended state must be reached, the assertion must reflect a requirement, and the
          observed discrepancy must match the report. A timeout alone is not a reproduced bug.
        </p>
      </div>
    </>
  );
}
