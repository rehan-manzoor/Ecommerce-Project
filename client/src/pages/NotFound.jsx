import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="container page-shell">
      <div className="state-card not-found">
        <span className="eyebrow">404</span>
        <h1>This page wandered off</h1>
        <p className="muted">
          The page you're looking for doesn't exist, was moved, or the link is out of date.
        </p>
        <div className="hero-actions">
          <Link className="button" to="/">
            Back to home
          </Link>
          <Link className="button ghost" to="/products">
            Browse products
          </Link>
        </div>
      </div>
    </main>
  );
}
