export function DashboardSkeleton() {
  return (
    <>
      <div
        className="skeleton"
        style={{
          height: 32,
          width: 260,
          marginBottom: 30,
        }}
      />

      <div className="stats-grid">
        {Array.from({
          length: 6,
        }).map((_, index) => (
          <div className="stat-card" key={index}>
            <div className="skeleton" style={{ height: 60 }} />
          </div>
        ))}
      </div>

      <div className="panel">
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    </>
  );
}
