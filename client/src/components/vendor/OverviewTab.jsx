
export function OverviewTab({
  overview,
  sales,
}) {
  const stats = [
    [
      "Revenue",
      `$${Number(
        overview?.totalRevenue || 0
      ).toFixed(2)}`,
    ],
    [
      "Orders",
      overview?.totalOrders || 0,
    ],
    [
      "Products",
      overview?.totalProducts || 0,
    ],
    [
      "Avg. rating",
      overview?.averageRating || 0,
    ],
    [
      "Low stock",
      overview?.lowStock || 0,
    ],
    [
      "Out of stock",
      overview?.outOfStock || 0,
    ],
  ];

  const maxRevenue = Math.max(
    1,
    ...sales.map(
      (item) => item.revenue || 0
    )
  );

  return (
    <>
      <div className="page-title">
        <h1>Vendor overview</h1>
        <p>
          Your store performance at a glance.
        </p>
      </div>

      <div className="stats-grid">
        {stats.map(([label, value]) => (
          <div
            className="stat-card"
            key={label}
          >
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Sales — last 30 days</h2>

        <div className="bar-chart">
          {sales.length ? (
            sales.map((item) => (
              <div
                className="bar-item"
                key={item.label}
                title={`${item.label}: $${Number(
                  item.revenue || 0
                ).toFixed(2)}`}
              >
                <div
                  className="bar"
                  style={{
                    height: `${Math.max(
                      4,
                      ((item.revenue || 0) /
                        maxRevenue) *
                        180
                    )}px`,
                  }}
                />

                <small>
                  {item.label.slice(5)}
                </small>
              </div>
            ))
          ) : (
            <p className="muted">
              No sales yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
