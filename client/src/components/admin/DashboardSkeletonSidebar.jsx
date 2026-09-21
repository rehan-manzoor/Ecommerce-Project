import { TABS } from "./shared.js";

export function DashboardSkeletonSidebar() {
  return (
    <aside className="dashboard-sidebar">
      <div>
        <span className="eyebrow">Admin</span>
        <h2>Control center</h2>
      </div>

      {TABS.map((item) => (
        <div
          key={item}
          className="skeleton"
          style={{
            height: 36,
            margin: "3px 0",
          }}
        />
      ))}
    </aside>
  );
}
