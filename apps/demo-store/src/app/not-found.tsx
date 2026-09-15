import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="empty-state">
      <p className="eyebrow">404 / NOT FOUND</p>
      <h1>Nothing on this shelf.</h1>
      <p>We couldn’t find the page or product you’re looking for.</p>
      <Link className="button" href="/">
        Back to collection
      </Link>
    </section>
  );
}
