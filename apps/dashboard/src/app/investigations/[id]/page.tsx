import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Monitor, ScanLine } from 'lucide-react';
import { PageHeader, PreviewNotice } from '@/components/page-header';
import { WorkspaceTabs } from '@/components/workspace-tabs';
import { sampleCase, sampleResultPath } from '@/lib/sample-case';

export const metadata: Metadata = { title: 'Sample workspace' };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== sampleCase.id) notFound();
  return (
    <>
      <PageHeader
        eyebrow="SAMPLE CASE / CART & CHECKOUT"
        title="Follow the evidence."
        description={sampleCase.title}
        action={
          <Link className="button secondary" href={sampleResultPath}>
            Result preview <ArrowRight size={16} />
          </Link>
        }
      />
      <PreviewNotice />
      <div className="case-summary">
        <div>
          <span className="eyebrow">REPORTED BEHAVIOR</span>
          <p>{sampleCase.report}</p>
        </div>
        <span className="pill">Not started</span>
      </div>
      <div className="two-column workspace-columns">
        <WorkspaceTabs />
        <section className="panel browser-panel">
          <div className="panel-heading">
            <h2>
              <Monitor size={16} /> Browser preview
            </h2>
            <span className="muted-label">Disconnected</span>
          </div>
          <div className="browser-placeholder">
            <ScanLine size={38} />
            <h3>Waiting for a browser session</h3>
            <p>Captured screenshots will appear here during an investigation.</p>
          </div>
          <div className="panel-footnote">
            No screenshot or browser evidence is available in this preview.
          </div>
        </section>
      </div>
    </>
  );
}
