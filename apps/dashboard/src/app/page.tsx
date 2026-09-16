import Link from 'next/link';
import {
  ArrowDownRight,
  ArrowRight,
  FileCode2,
  FlaskConical,
  FolderSearch,
  Layers3,
  Plus,
  Repeat2,
  ScanSearch,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { McpStatusCard } from '@/components/mcp-status-card';
import { getMcpConnectionStatus } from '@/lib/api';
import { sampleWorkspacePath } from '@/lib/sample-case';

export default async function InvestigationsPage() {
  const mcpStatus = await getMcpConnectionStatus();

  return (
    <>
      <PageHeader
        eyebrow="YOUR INVESTIGATION DESK"
        title="From reported to reproduced."
        description="A clear path from an unexpected behavior to evidence you can replay."
        action={
          <Link className="button primary" href="/investigations/new">
            <Plus size={17} /> New investigation
          </Link>
        }
      />
      <McpStatusCard status={mcpStatus} />
      <section className="intro-card">
        <div>
          <span className="pill light">
            <FlaskConical size={14} /> MEET THE WORKFLOW
          </span>
          <h2>
            A bug report is the beginning.
            <br />
            <span>The evidence is what counts.</span>
          </h2>
          <p>
            Explore a sample case to see where observations, requirements, and regression tests come
            together.
          </p>
          <Link className="button dark" href={sampleWorkspacePath}>
            Explore sample case <ArrowRight size={16} />
          </Link>
        </div>
        <div className="workflow-art" aria-label="Workflow: report, investigate, replay">
          <div className="art-dot-grid" />
          <div className="art-node node-one">
            <span className="art-icon">
              <FileCode2 size={20} />
            </span>
            <div>
              <small>01 / INPUT</small>
              <strong>Report a behavior</strong>
            </div>
          </div>
          <ArrowDownRight className="art-arrow first" size={26} />
          <div className="art-node node-two">
            <span className="art-icon">
              <ScanSearch size={20} />
            </span>
            <div>
              <small>02 / INVESTIGATE</small>
              <strong>Follow the evidence</strong>
            </div>
            <span className="tiny-dot" />
          </div>
          <ArrowDownRight className="art-arrow second" size={26} />
          <div className="art-node node-three">
            <span className="art-icon">
              <Repeat2 size={20} />
            </span>
            <div>
              <small>03 / VERIFY</small>
              <strong>Replay the test</strong>
            </div>
          </div>
        </div>
      </section>
      <div className="section-heading">
        <div>
          <h2>
            Investigations <span className="count">0</span>
          </h2>
          <p>Your reports and their evidence, in one place.</p>
        </div>
        <span className="muted-label">
          <Layers3 size={15} /> All investigations
        </span>
      </div>
      <section className="panel empty-state">
        <div className="empty-icon">
          <FolderSearch size={29} />
        </div>
        <h3>Your first investigation starts here</h3>
        <p>
          Describe an issue or explore the sample workflow.
          <br />
          No investigations have been created yet.
        </p>
        <Link className="button secondary" href="/investigations/new">
          Prepare a report <ArrowRight size={15} />
        </Link>
      </section>
      <div className="principle-strip">
        <span>
          <b>01</b> Grounded in requirements
        </span>
        <span>
          <b>02</b> Evidence at every step
        </span>
        <span>
          <b>03</b> Repeatable verification
        </span>
      </div>
    </>
  );
}
