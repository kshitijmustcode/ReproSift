'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FlaskConical, RotateCcw } from 'lucide-react';
import { sampleCase, sampleWorkspacePath } from '@/lib/sample-case';

export function DraftForm() {
  const [report, setReport] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [message, setMessage] = useState('');

  function loadSample() {
    setReport(sampleCase.report);
    setExpectedBehavior(sampleCase.expectedBehavior);
    setMessage('Sample report loaded. Draft changes stay on this page and are not saved.');
  }

  function clearDraft() {
    setReport('');
    setExpectedBehavior('');
    setMessage('Draft cleared.');
  }

  return (
    <div className="panel form-panel">
      <div className="panel-heading">
        <h2>Describe the issue</h2>
        <button className="text-button" type="button" onClick={loadSample}>
          <FlaskConical size={16} /> Use sample
        </button>
      </div>
      <div className="form-fields">
        <label htmlFor="target">Target application</label>
        <select id="target" defaultValue="demo-store">
          <option value="demo-store">ReproSift demo store</option>
        </select>
        <p className="field-hint">The demo store will be available after its setup is complete.</p>
        <label htmlFor="report">What went wrong?</label>
        <textarea
          id="report"
          rows={4}
          maxLength={4000}
          value={report}
          onChange={(event) => setReport(event.target.value)}
          placeholder="Describe what you did and what happened…"
        />
        <label htmlFor="expected">What should have happened?</label>
        <textarea
          id="expected"
          rows={3}
          maxLength={4000}
          value={expectedBehavior}
          onChange={(event) => setExpectedBehavior(event.target.value)}
          placeholder="Describe the correct behavior or reference a requirement…"
        />
        <div className="form-note" id="draft-note">
          Draft only. Fields are not saved or sent anywhere. Starting a live investigation will be
          available when the backend is connected.
        </div>
        <div className="form-actions">
          <button className="button primary" type="button" disabled aria-describedby="draft-note">
            Start investigation <ArrowRight size={16} />
          </button>
          <button className="text-button" type="button" onClick={clearDraft}>
            <RotateCcw size={14} /> Clear draft
          </button>
        </div>
        <p className="sr-only" role="status">
          {message}
        </p>
        <Link className="inline-link" href={sampleWorkspacePath}>
          Explore the fixed sample workspace instead <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
