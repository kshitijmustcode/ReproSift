import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Monitor, ScanLine } from 'lucide-react';
import { PageHeader, PreviewNotice } from '@/components/page-header';
import { WorkspaceTabs } from '@/components/workspace-tabs';
import { sampleCase, sampleResultPath } from '@/lib/sample-case';
import { getSampleCartScreenshot } from '@/lib/api';

export const metadata: Metadata = { title: 'Sample workspace' };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== sampleCase.id) notFound();
  const browserScreenshot = await getSampleCartScreenshot();
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
            <span className="muted-label">
              {browserScreenshot.status === 'captured' ? 'Captured' : 'Unavailable'}
            </span>
          </div>
          {browserScreenshot.status === 'captured' ? (
            <div className="browser-capture">
              <Image
                alt={`Screenshot of ${browserScreenshot.screenshot.title}`}
                height={900}
                src={`data:${browserScreenshot.screenshot.contentType};base64,${browserScreenshot.screenshot.base64}`}
                unoptimized
                width={1280}
              />
              <p>Captured from {browserScreenshot.screenshot.url}</p>
            </div>
          ) : (
            <div className="browser-placeholder">
              <ScanLine size={38} />
              <h3>Browser preview unavailable</h3>
              <p>{browserScreenshot.error.safeMessage}</p>
            </div>
          )}
          <div className="panel-footnote">
            This is a fresh, bounded browser capture. Evidence retention arrives in Step 14.
          </div>
        </section>
      </div>
    </>
  );
}
