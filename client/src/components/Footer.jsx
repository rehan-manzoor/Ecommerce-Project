import { Link } from "react-router";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">
            <span className="brand-mark">M</span>
            <span>MERN Market</span>
          </div>
          <p>
            A complete multi-vendor marketplace: verified sellers, admin-moderated listings,
            secure Stripe checkout and real customer reviews.
          </p>
        </div>

        <div>
          <h4>Shop</h4>
          <Link to="/products">All products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/become-vendor">Become a seller</Link>
        </div>

        <div>
          <h4>Account</h4>
          <Link to="/profile">My account</Link>
          <Link to="/orders">My orders</Link>
          <Link to="/login">Sign in</Link>
        </div>
      </div>

      <div className="footer-bottom">© {year} MERN Market. Built with MongoDB, Express, React &amp; Node.</div>
    </footer>
  );
}
