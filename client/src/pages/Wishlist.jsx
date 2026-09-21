import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api/axios";
import { notify } from "../components/Toast";
export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .get("/wishlist")
      .then((response) => setProducts(response.data.data))
      .catch(() => notify("Unable to load wishlist", "error"))
      .finally(() => setLoading(false));
  }, []);
  const remove = async (id) => {
    try {
      const response = await api.delete(`/wishlist/${id}`);
      setProducts(response.data.data);
    } catch {
      notify("Unable to remove item", "error");
    }
  };
  const move = async (product) => {
    try {
      await api.post("/cart/add", { productId: product._id, quantity: 1 });
      await remove(product._id);
      notify("Moved to cart");
    } catch (error) {
      notify(error.response?.data?.message || "Choose a variant on the product page", "error");
    }
  };
  return (
    <main className="container page-shell">
      <div className="page-title">
        <h1>Wishlist</h1>
      </div>
      {loading ? (
        <div className="state-card">Loading...</div>
      ) : !products.length ? (
        <div className="state-card">
          Your wishlist is empty. <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="management-list">
          {products.map((product) => (
            <article className="management-card panel" key={product._id}>
              <div>
                <Link to={`/products/${product._id}`}>
                  <h3>{product.name}</h3>
                </Link>
                <p>
                  ${product.price.toFixed(2)} · {product.vendor?.storeName}
                </p>
              </div>
              <div className="management-actions">
                <button className="button small" onClick={() => move(product)}>
                  Move to cart
                </button>
                <button className="button ghost small" onClick={() => remove(product._id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
