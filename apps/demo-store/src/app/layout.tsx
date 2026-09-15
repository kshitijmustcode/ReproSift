import type { Metadata } from 'next';
import Link from 'next/link';
import { StoreNav } from '@/components/store-nav';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'ReproSift Store', template: '%s | ReproSift Store' },
  description: 'A demonstration shopping application for ReproSift.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="demo-banner">Demo store · Browsing preview · Purchases are unavailable</div>
        <header className="store-header">
          <Link href="/" className="wordmark" aria-label="ReproSift Store home">
            reprosift<span> / store</span>
          </Link>
          <StoreNav />
        </header>
        <main id="main">{children}</main>
        <footer>
          <span className="wordmark">
            reprosift<span> / store</span>
          </span>
          <p>A small collection. A place to test the details.</p>
          <span>Demo only · USD</span>
        </footer>
      </body>
    </html>
  );
}
