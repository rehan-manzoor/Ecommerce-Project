import { optimizeImageUrl } from "../utils/imageUrl";
import { getCategories } from "../services/categoryService";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api/axios";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/products?limit=8&sort=newest"), getCategories()])
      .then(([productsResponse, categoryData]) => {
        setProducts(productsResponse.data.data || []);

        setCategories(categoryData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Multi-vendor marketplace</span>
            <h1>Everything you need, from sellers you can trust.</h1>
            <p>
              Discover approved products, secure Stripe checkout, verified reviews and independent
              stores in one modern marketplace.
            </p>
            <div className="hero-actions">
              <Link className="button" to="/products">
                Shop now
              </Link>
              <Link className="button ghost" to="/become-vendor">
                Start selling
              </Link>
            </div>
          </div>

          <div className="hero-card">
            <div className="metric">
              <strong>Secure</strong>
              <span>Stripe payments</span>
            </div>
            <div className="metric">
              <strong>Verified</strong>
              <span>Purchase reviews</span>
            </div>
            <div className="metric">
              <strong>Curated</strong>
              <span>Admin-approved listings</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Browse</span>
            <h2>Shop by category</h2>
          </div>
          <Link to="/products">View all →</Link>
        </div>

        {loading ? (
          <div className="category-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="category-card" key={i}>
                <div className="skeleton" style={{ height: 42, width: 42 }} />
              </div>
            ))}
          </div>
        ) : categories.length ? (
          <div className="category-grid">
            {categories.slice(0, 6).map((category) => (
              <Link
                className="category-card"
                key={category._id}
                to={`/products?category=${category._id}`}
              >
                <span>✦</span>
                <div>
                  <h3>{category.name}</h3>
                  <p>{category.description || "Explore products"}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">No categories available yet.</p>
        )}
      </section>

      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">New arrivals</span>
            <h2>Latest products</h2>
          </div>
        </div>

        {loading ? (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="product-card" key={i}>
                <div className="skeleton product-image" />
                <div className="product-info">
                  <div
                    className="skeleton"
                    style={{ height: 18, width: "80%", marginBottom: 10 }}
                  />
                  <div className="skeleton" style={{ height: 14, width: "40%" }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length ? (
          <div className="products-grid">
            {products.map((product, index) => (
              <Link className="product-card" key={product._id} to={`/products/${product._id}`}>
                <div className="product-image">
                  {product.images?.[0] ? (
                    <img
  src={optimizeImageUrl(
    product.images[0],
    600
  )}
  alt={product.name}
  loading={
    index < 4
      ? "eager"
      : "lazy"
  }
  fetchPriority={
    index < 4
      ? "high"
      : "auto"
  }
  decoding="async"
/>
                  ) : (
                    <span>No image</span>
                  )}
                </div>
                <div className="product-info">
                  <span className="muted small-text">{product.category?.name || "Product"}</span>
                  <h3>{product.name}</h3>
                  <div className="rating-line">
                    <span>★ {Number(product.ratingsAverage || 0).toFixed(1)}</span>
                    <span>{product.numReviews || 0} reviews</span>
                  </div>
                  <div className="product-bottom">
                    <strong>${product.price.toFixed(2)}</strong>
                    <span>View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="state-card">
            <h3>No products yet</h3>
            <p className="muted">Check back soon — new listings are added regularly.</p>
          </div>
        )}
      </section>
    </>
  );
}
