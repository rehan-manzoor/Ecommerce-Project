import { getCategories } from "../services/categoryService";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import api from "../api/axios";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalResults: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const query = useMemo(() => searchParams.toString(), [searchParams]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products?${query}`)
      .then((r) => {
        setProducts(r.data.data || []);
        setPagination(r.data.pagination || { page: 1, totalPages: 1, totalResults: 0 });
      })
      .finally(() => setLoading(false));
  }, [query]);

  const update = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    setSearchParams(next);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    update("search", search.trim());
  };

  const clearFilters = () => {
    setSearch("");
    setSearchParams({});
  };

  return (
    <main className="container page-shell">
      <div className="page-title">
        <span className="eyebrow">Marketplace</span>
        <h1>Shop products</h1>
        <p>{pagination.totalResults} approved products available</p>
      </div>

      <div className="catalog-layout">
        <aside className="filters panel">
          <h3>Filters</h3>

          <label>
            Category
            <select
              value={searchParams.get("category") || ""}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="split">
            <label>
              Min price
              <input
                type="number"
                min="0"
                value={searchParams.get("minPrice") || ""}
                onChange={(e) => update("minPrice", e.target.value)}
              />
            </label>
            <label>
              Max price
              <input
                type="number"
                min="0"
                value={searchParams.get("maxPrice") || ""}
                onChange={(e) => update("maxPrice", e.target.value)}
              />
            </label>
          </div>
          <label>
            Brand
            <input
              value={searchParams.get("brand") || ""}
              onChange={(e) => update("brand", e.target.value)}
              placeholder="Brand"
            />
          </label>
          <label>
            Minimum rating
            <select
              value={searchParams.get("minRating") || ""}
              onChange={(e) => update("minRating", e.target.value)}
            >
              <option value="">Any rating</option>
              {[4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}+ stars
                </option>
              ))}
            </select>
          </label>
          <label>
            Availability
            <select
              value={searchParams.get("availability") || ""}
              onChange={(e) => update("availability", e.target.value)}
            >
              <option value="">All</option>
              <option value="in_stock">In stock</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={searchParams.get("sort") || "newest"}
              onChange={(e) => update("sort", e.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="rating">Top rated</option>
            </select>
          </label>

          <button className="button ghost full" onClick={clearFilters}>
            Clear filters
          </button>
        </aside>

        <section>
          <form className="search-bar" onSubmit={submitSearch}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or brands..."
            />
            <button className="button">Search</button>
          </form>

          {loading ? (
            <ProductGridSkeleton />
          ) : products.length === 0 ? (
            <div className="state-card">
              <h3>No products found</h3>
              <p className="muted">Try changing the search or filters.</p>
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() => update("page", String(pagination.page - 1))}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => update("page", String(pagination.page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ProductCard({ product }) {
  return (
    <Link className="product-card" to={`/products/${product._id}`}>
      <div className="product-image">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <span>No image</span>
        )}
      </div>
      <div className="product-info">
        <span className="muted small-text">{product.category?.name}</span>
        <h3>{product.name}</h3>
        <p className="product-description">{product.description}</p>
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
  );
}

function ProductGridSkeleton() {
  return (
    <div className="products-grid">
      {Array.from({ length: 8 }).map((_, i) => (
        <div className="product-card" key={i}>
          <div className="skeleton product-image" />
          <div className="product-info">
            <div className="skeleton" style={{ height: 12, width: "40%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 18, width: "80%", marginBottom: 10 }} />
            <div className="skeleton" style={{ height: 14, width: "100%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
