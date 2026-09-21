import { VendorContentSkeleton } from "./VendorContentSkeleton.jsx";
import { TABS } from "./shared.js";

export function VendorSkeleton() {
  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <span className="eyebrow">Vendor</span>

          <div
            className="skeleton"
            style={{
              height: 22,
              width: "70%",
              margin: "6px 0",
            }}
          />
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

      <section className="dashboard-content">
        <VendorContentSkeleton />
      </section>
    </main>
  );
}
