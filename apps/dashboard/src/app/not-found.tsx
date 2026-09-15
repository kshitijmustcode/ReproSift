import Link from 'next/link';
import { FolderSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="panel empty-state">
      <FolderSearch size={32} />
      <h1>Investigation not found</h1>
      <p>This preview only includes the sample investigation.</p>
      <Link className="button primary" href="/">
        Back to investigations
      </Link>
    </section>
  );
}
