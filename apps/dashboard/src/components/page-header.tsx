import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function PreviewNotice() {
  return (
    <p className="preview-notice">
      <strong>Sample preview.</strong> Illustrative content only. No browser session, investigation,
      or verification has run.
    </p>
  );
}
