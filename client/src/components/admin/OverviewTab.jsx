import { money } from "./shared.js";

export function OverviewTab({ data }) {
  const stats = [
    ["Revenue", money(data.overview?.totalRevenue)],
    ["Orders", data.overview?.totalOrders],
    ["Customers", data.overview?.totalCustomers],
    ["Vendors", data.overview?.totalVendors],
    ["Products", data.overview?.totalProducts],
    ["Pending listings", data.overview?.pendingProducts],
    ["Pending sellers", data.overview?.pendingVendors],
    ["Open returns", data.overview?.returns],
    ["Refunded payments", data.overview?.refunds],
  ];

  const maxRevenue = Math.max(
    1,
    ...data.sales.map((item) => item.revenue || 0)
  );

  return (
    <>
      <div className="page-title">
        <h1>Marketplace overview</h1>
        <p>Live operational summary.</p>
      </div>

      <div className="stats-grid">
        {stats.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <h2>Sales — last 30 days</h2>

          <div className="bar-chart">
            {data.sales.length ? (
              data.sales.map((item) => (
                <div
                  className="bar-item"
                  key={item.label}
                  title={`${item.label}: ${money(item.revenue)}`}
                >
                  <div
                    className="bar"
                    style={{
                      height: `${Math.max(
                        4,
                        (item.revenue / maxRevenue) * 180
                      )}px`,
                    }}
                  />
                  <small>{item.label.slice(5)}</small>
                </div>
              ))
            ) : (
              <p className="muted">No sales yet.</p>
            )}
          </div>
        </div>

        <div className="panel">
          <h2>Top products</h2>

          {data.topProducts.length ? (
            data.topProducts.map((product, index) => (
              <div className="rank-row" key={product._id}>
                <span>
                  #{index + 1} {product.name || "Product"}
                </span>
                <strong>{money(product.revenue)}</strong>
              </div>
            ))
          ) : (
            <p className="muted">No data yet.</p>
          )}
        </div>

        <div className="panel">
          <h2>Top vendors</h2>

          {data.topVendors.length ? (
            data.topVendors.map((vendor, index) => (
              <div className="rank-row" key={vendor._id}>
                <span>
                  #{index + 1} {vendor.storeName || "Vendor"}
                </span>
                <strong>{money(vendor.revenue)}</strong>
              </div>
            ))
          ) : (
            <p className="muted">No data yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
