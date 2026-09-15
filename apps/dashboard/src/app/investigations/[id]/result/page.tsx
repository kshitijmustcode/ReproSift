import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileCode2, Repeat2, Scale } from 'lucide-react';
import { PageHeader, PreviewNotice } from '@/components/page-header';
import { sampleCase, sampleWorkspacePath } from '@/lib/sample-case';

export const metadata: Metadata = { title: 'Result & replay' };

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
          <h2>No result yet</h2>
          <p>No test has been generated or executed for this sample preview.</p>
        </div>
        <span className="pill">Not evaluated</span>
      </section>
      <div className="two-column equal-columns">
        <section className="panel detail-panel">
          <div className="section-kicker">
            <FileCode2 size={17} /> Regression test
          </div>
          <h2>From steps to a runnable test.</h2>
          <p>
            The generated Playwright test and its setup requirements will appear after an
            investigation.
          </p>
          <button className="button secondary" disabled type="button">
            Download test
          </button>
        </section>
        <section className="panel detail-panel">
          <div className="section-kicker">
            <Repeat2 size={17} /> Independent replay
          </div>
          <h2>Same test. Fresh starting state.</h2>
          <p>
            Compare the relevant assertion on buggy and corrected versions without changing the
            candidate.
          </p>
          <button className="button secondary" disabled type="button">
            Run verification
          </button>
        </section>
      </div>
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
