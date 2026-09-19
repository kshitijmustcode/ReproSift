import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Monitor, ScanLine } from 'lucide-react';
import { PageHeader, PreviewNotice } from '@/components/page-header';
import { WorkspaceTabs } from '@/components/workspace-tabs';
import { sampleCase, sampleResultPath } from '@/lib/sample-case';
import { getInvestigationWorkspace, getSampleCartScreenshot } from '@/lib/api';

export const metadata: Metadata = { title: 'Sample workspace' };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== sampleCase.id && !id.match(/^[0-9a-f-]{36}$/)) notFound();
  const workspace = id === sampleCase.id ? null : await getInvestigationWorkspace(id);
  if (id !== sampleCase.id && workspace === null) notFound();
  const browserScreenshot = await getSampleCartScreenshot();
  const report = workspace?.investigation.report ?? sampleCase.report;
  const status = workspace?.investigation.status ?? 'not started';
  return (
    <>
      <PageHeader
        eyebrow="SAMPLE CASE / CART & CHECKOUT"
        title="Follow the evidence."
        description={workspace?.investigation.expectedBehavior ?? sampleCase.title}
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
          <p>{report}</p>
        </div>
        <span className="pill">{status}</span>
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
      {workspace ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Persisted progress</h2>
            <span className="muted-label">{workspace.events.length} events</span>
          </div>
          {workspace.events.length ? (
            <ol className="event-list">
              {workspace.events.map((event) => (
                <li key={event.id}>
                  {event.sequence}. {event.type}
                </li>
              ))}
            </ol>
          ) : (
            <p>No events have been recorded yet.</p>
          )}
        </section>
      ) : null}
    </>
  );
}
