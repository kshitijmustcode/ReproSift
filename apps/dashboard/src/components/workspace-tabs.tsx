'use client';

import { useState } from 'react';
import { FileText, ImageOff, ListChecks } from 'lucide-react';
import { sampleCase } from '@/lib/sample-case';

const tabs = ['Timeline', 'Evidence', 'Requirements'] as const;
type Tab = (typeof tabs)[number];

export function WorkspaceTabs() {
  const [active, setActive] = useState<Tab>('Timeline');
  return (
    <section className="panel workspace-panel">
      <div className="tab-list" aria-label="Workspace sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${active === tab ? 'selected' : ''}`}
            aria-pressed={active === tab}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="tab-content">
        {active === 'Timeline' && (
          <>
            <div className="section-kicker">
              <ListChecks size={16} /> Planned sequence · not executed
            </div>
            <ol className="timeline">
              {[
                'Open a freshly seeded cart',
                'Apply the SAVE10 coupon',
                'Remove Item B',
                'Check the discount and total',
              ].map((step, index) => (
                <li key={step}>
                  <span className="step-number">{index + 1}</span>
                  <div>
                    <strong>{step}</strong>
                    <small>Waiting for a live investigation</small>
                  </div>
                  <span className="muted-label">Pending</span>
                </li>
              ))}
            </ol>
          </>
        )}
        {active === 'Evidence' && (
          <div className="empty-state compact">
            <ImageOff size={28} />
            <h3>No evidence captured</h3>
            <p>
              Screenshots, browser traces, and network observations will appear after a real run.
            </p>
          </div>
        )}
        {active === 'Requirements' && (
          <div className="requirement">
            <div className="section-kicker">
              <FileText size={16} /> {sampleCase.requirementId} · version 1
            </div>
            <h3>Recalculate the coupon after every cart change.</h3>
            <p>{sampleCase.expectedBehavior}</p>
            <p className="field-hint">
              Authored sample requirement. Retrieval is not connected yet.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
