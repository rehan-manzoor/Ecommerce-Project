import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import api from "../api/axios";

export default function VendorStore() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api
      .get(`/vendors/${slug}/public`)
      .then((r) => setData(r.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <StoreSkeleton />;

  if (notFound || !data) {
    return (
      <main className="container page-shell">
        <div className="state-card">
          <h2>Store not found</h2>
          <p className="muted">This seller may no longer be active on the marketplace.</p>
          <Link className="button" to="/products">
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const { vendor, products } = data;

  return (
    <main className="container page-shell">
      <section
        className="store-banner panel"
        style={
          vendor.bannerImage
            ? { backgroundImage: `linear-gradient(rgba(15,23,42,.65),rgba(15,23,42,.65)),url(${vendor.bannerImage})` }
            : undefined
        }
      >
        {vendor.logo && <img className="store-logo" src={vendor.logo} alt={vendor.storeName} />}
        <div>
          <span className="eyebrow">Approved seller</span>
          <h1>{vendor.storeName}</h1>
          <p>{vendor.description}</p>
        </div>
      </section>

      <div className="section-heading">
        <div>
          <h2>Products</h2>
          <p className="muted">{products.length} listing{products.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      {!products.length ? (
        <div className="state-card">
          <h3>No products listed yet</h3>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <Link className="product-card" key={product._id} to={`/products/${product._id}`}>
              <div className="product-image">
                {product.images?.[0] ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <span>No image</span>
                )}
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <div className="product-bottom">
                  <strong>${product.price.toFixed(2)}</strong>
                  <span>View →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function StoreSkeleton() {
  return (
    <main className="container page-shell">
      <div className="skeleton" style={{ height: 260, borderRadius: "var(--r-lg)", marginBottom: 28 }} />
      <div className="skeleton" style={{ height: 24, width: 180, marginBottom: 20 }} />
      <div className="products-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="product-card" key={i}>
            <div className="skeleton product-image" />
            <div className="product-info">
              <div className="skeleton" style={{ height: 18, width: "70%" }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
