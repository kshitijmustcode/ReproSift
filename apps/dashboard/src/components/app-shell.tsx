'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, FlaskConical, Layers3, Plus, ScanLine, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { sampleWorkspacePath } from '@/lib/sample-case';

const navigation = [
  { href: '/', label: 'Investigations', icon: Layers3 },
  { href: '/investigations/new', label: 'New investigation', icon: Plus },
  { href: sampleWorkspacePath, label: 'Sample workspace', icon: FlaskConical },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="ReproSift home">
          <span className="brand-mark">
            <ScanLine size={23} />
          </span>
          ReproSift<span className="brand-period">.</span>
        </Link>
        <div className="workspace-name">
          <span className="workspace-avatar">R</span>
          <div>
            Personal workspace<small>Local development</small>
          </div>
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active =
              href === sampleWorkspacePath ? pathname.startsWith(href) : pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <ShieldCheck size={21} />
          <p>Evidence before conclusions.</p>
          <small>Capture the steps. Check the behavior. Keep the proof.</small>
          <a href="https://github.com/kshitijmustcode/ReproSift" target="_blank" rel="noreferrer">
            Project on GitHub <ArrowUpRight size={14} />
          </a>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span>
            Workspace <span className="breadcrumb-divider">/</span>{' '}
            {pathname === '/'
              ? 'Investigations'
              : pathname.endsWith('/new')
                ? 'New investigation'
                : pathname.endsWith('/result')
                  ? 'Result & replay'
                  : 'Investigation'}
          </span>
          <span className="preview-indicator">
            <span /> Interface preview
          </span>
        </header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
        <footer className="page-footer">
          <span>ReproSift · Built for repeatable evidence</span>
          <span>Development preview</span>
        </footer>
      </div>
    </div>
  );
}
