import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { addGuestItem } from "../utils/guestCart";
import { notify } from "../components/Toast";

export default function ProductDetails() {
  const { id } = useParams();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async () => {
    try {
      const [productRes, reviewsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`),
      ]);
      const loadedProduct = productRes.data.data;

setProduct(loadedProduct);
setSelectedImage(loadedProduct?.images?.[0] || "");
setReviews(reviewsRes.data.data || []);

      if (user?.role === "customer") {
        const ordersRes = await api.get("/orders/my");
        setOrders(ordersRes.data.data || []);
      }
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const eligibleOrder = useMemo(
    () =>
      orders.find(
        (order) =>
          order.vendorOrders?.some((group) => group.status === "delivered" && group.items.some((item) => (item.product?._id || item.product) === id))
      ),
    [orders, id]
  );

  const addToCart = async () => {
    if (user && user.role !== "customer") {
      return notify("Only customers can add products to cart", "error");
    }
    const selected = product?.variants?.find((entry) => entry._id === variantId);
    if (!(selected ? selected.stock : product?.stock)) return;

    try {
      if (user) await api.post("/cart/add", { productId: product._id, variantId: variantId || null, quantity });
      else addGuestItem(product, quantity, variantId || null);
      notify("Added to cart");
    } catch (error) {
      notify(error.response?.data?.message || "Could not add to cart", "error");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    try {
      await api.post("/reviews", { productId: id, orderId: eligibleOrder._id, rating, comment });
      notify("Review submitted for admin approval");
      setComment("");
    } catch (error) {
      notify(error.response?.data?.message || "Could not submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <ProductDetailsSkeleton />;

  if (!product) {
    return (
      <div className="state-card page-state">
        <h2>Product not found</h2>
        <p className="muted">It may have been removed or is no longer available.</p>
        <Link className="button" to="/products">Back to shop</Link>
      </div>
    );
  }

  const canBuy = !user || user.role === "customer";

  return (
    <main className="container page-shell">
      <Link className="back-link" to="/products">← Back to products</Link>

      <div className="product-details-card">
        <div className="product-gallery">
  <div className="details-image">
    {selectedImage ? (
      <img src={selectedImage} alt={product.name} />
    ) : (
      <span>No image</span>
    )}
  </div>

  {product.images?.length > 1 && (
    <div className="product-thumbnails">
      {product.images.map((image, index) => (
        <button
          key={`${image}-${index}`}
          type="button"
          className={`product-thumbnail ${
            selectedImage === image ? "active" : ""
          }`}
          onClick={() => setSelectedImage(image)}
          aria-label={`View ${product.name} image ${index + 1}`}
        >
          <img
            src={image}
            alt={`${product.name} thumbnail ${index + 1}`}
          />
        </button>
      ))}
    </div>
  )}
</div>

        <div className="details-info">
          <span className="eyebrow">{product.category?.name || "Product"}</span>
          <h1>{product.name}</h1>

          <div className="rating-line large">
            <span>★ {Number(product.ratingsAverage || 0).toFixed(1)}</span>
            <span>{product.numReviews || 0} verified reviews</span>
          </div>

          <p className="details-description">{product.description}</p>

          {product.brand && (
            <p><strong>Brand:</strong> {product.brand}</p>
          )}

          <p className="details-price">${(product.variants?.find((entry) => entry._id === variantId)?.price ?? product.salePrice ?? product.price).toFixed(2)}</p>
          {product.variants?.length > 0 && <label>Variant<select required value={variantId} onChange={(event) => { setVariantId(event.target.value); setQuantity(1); }}><option value="">Select variant</option>{product.variants.map((variant) => <option key={variant._id} value={variant._id}>{Object.values(variant.attributes || {}).join(" / ")} · ${variant.price.toFixed(2)} · {variant.stock} left</option>)}</select></label>}

          <p className={product.stock ? "stock-ok" : "stock-out"}>
            {(product.variants?.find((entry) => entry._id === variantId)?.stock ?? product.stock) ? `${product.variants?.find((entry) => entry._id === variantId)?.stock ?? product.stock} in stock` : "Out of stock"}
          </p>

          {product.vendor && (
            <p>
              Sold by{" "}
              <Link className="text-link" to={`/store/${product.vendor.storeSlug}`}>
                {product.vendor.storeName}
              </Link>
            </p>
          )}

          {canBuy && (
            <>
              <div className="quantity-row">
                <button aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(product.variants?.find((entry) => entry._id === variantId)?.stock ?? product.stock, q + 1))}>+</button>
              </div>

              <button className="button full" disabled={product.variants?.length ? !variantId || !product.variants.find((entry) => entry._id === variantId)?.stock : !product.stock} onClick={addToCart}>
                {(product.variants?.find((entry) => entry._id === variantId)?.stock ?? product.stock) ? "Add to cart" : "Out of stock"}
              </button>
              {user && <button className="button ghost full" onClick={async () => { try { await api.put(`/wishlist/${id}`); notify("Saved to wishlist"); } catch { notify("Could not save item", "error"); } }}>Save to wishlist</button>}
            </>
          )}
        </div>
      </div>

      <section className="reviews-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Verified feedback</span>
            <h2>Customer reviews</h2>
          </div>
        </div>

        {reviews.length ? (
          reviews.map((review) => (
            <article className="review-card" key={review._id}>
              <div>
                <strong>{review.user?.name || "Customer"}</strong>
                <span className="verified-badge">Verified purchase</span>
              </div>
              <div className="stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
              <p>{review.comment}</p>
              <small className="muted">{new Date(review.createdAt).toLocaleDateString()}</small>
            </article>
          ))
        ) : (
          <div className="state-card">No approved reviews yet.</div>
        )}

        {user?.role === "customer" && eligibleOrder && (
          <form className="review-form panel" onSubmit={submitReview}>
            <h3>Write a review</h3>
            <label>
              Rating
              <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{"★".repeat(n)} {n}/5</option>
                ))}
              </select>
            </label>
            <label>
              Comment
              <textarea
                required
                minLength="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
              />
            </label>
            <button className="button" disabled={submittingReview}>
              {submittingReview ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}

        {user?.role === "customer" && !eligibleOrder && (
          <p className="muted">Review form appears after this product is delivered in one of your orders.</p>
        )}
      </section>
    </main>
  );
}

function ProductDetailsSkeleton() {
  return (
    <main className="container page-shell">
      <div className="skeleton" style={{ height: 20, width: 160, marginBottom: 22 }} />
      <div className="product-details-card">
        <div className="skeleton details-image" />
        <div className="details-info">
          <div className="skeleton" style={{ height: 14, width: 100, marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 36, width: "80%", marginBottom: 16 }} />
          <div className="skeleton" style={{ height: 16, width: "100%", marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 16, width: "90%", marginBottom: 24 }} />
          <div className="skeleton" style={{ height: 40, width: 140 }} />
        </div>
      </div>
    </main>
  );
}
