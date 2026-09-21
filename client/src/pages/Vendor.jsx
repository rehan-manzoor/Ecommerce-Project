import { useEffect, useState } from "react";
import api from "../api/axios";
import { notify } from "../components/Toast";

import {
  TABS,
  capitalize,
  OverviewTab,
  ProductsTab,
  OrdersTab,
  VendorReturns,
  StoreTab,
  VendorSkeleton,
  VendorContentSkeleton,
} from "../components/vendor/VendorSections";

export default function Vendor() {
  const [tab, setTab] = useState("overview");

  const [profile, setProfile] = useState(null);

  const [overview, setOverview] = useState(null);

  const [sales, setSales] = useState([]);

  const [products, setProducts] = useState([]);

  const [orders, setOrders] = useState([]);

  const [returns, setReturns] = useState([]);

  const [categories, setCategories] = useState([]);

  const [tabLoading, setTabLoading] = useState(false);

  const [loadedTabs, setLoadedTabs] = useState(new Set());

  const loadProfile = async () => {
    try {
      const response = await api.get("/vendors/me");

      setProfile(response.data.data);
    } catch (error) {
      notify(error.response?.data?.message || "Could not load vendor profile", "error");
    }
  };

  const loadTab = async (targetTab, force = false) => {
    if (!force && loadedTabs.has(targetTab)) {
      return;
    }

    setTabLoading(true);

    try {
      if (targetTab === "overview") {
        const [overviewRes, salesRes] = await Promise.all([
          api.get("/vendor/analytics/overview"),
          api.get("/vendor/analytics/sales-over-time?range=30d"),
        ]);

        setOverview(overviewRes.data.data);

        setSales(salesRes.data.data || []);
      }

      if (targetTab === "products") {
        const [productsRes, categoriesRes] = await Promise.all([
          api.get("/products/vendor/my"),
          api.get("/categories"),
        ]);

        setProducts(productsRes.data.data || []);

        setCategories(categoriesRes.data.data || []);
      }

      if (targetTab === "orders") {
        const response = await api.get("/orders/vendor/mine");

        setOrders(response.data.data || []);
      }

      if (targetTab === "returns") {
        const response = await api.get("/returns/manage");

        setReturns(response.data.data || []);
      }

      if (targetTab === "store") {
        await loadProfile();
      }

      setLoadedTabs((current) => {
        const updated = new Set(current);

        updated.add(targetTab);

        return updated;
      });
    } catch (error) {
      notify(error.response?.data?.message || "Could not load vendor dashboard", "error");
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    loadTab(tab);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (!profile) {
    return <VendorSkeleton />;
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <span className="eyebrow">Vendor</span>

          <h2>{profile.storeName}</h2>

          <span className={`status-badge ${profile.status}`}>{profile.status}</span>
        </div>

        {TABS.map((item) => (
          <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>
            {capitalize(item)}
          </button>
        ))}
      </aside>

      <section className="dashboard-content">
        {tabLoading ? (
          <VendorContentSkeleton />
        ) : (
          <>
            {tab === "overview" && <OverviewTab overview={overview} sales={sales} />}

            {tab === "products" && (
              <ProductsTab
                products={products}
                categories={categories}
                onChanged={() => loadTab("products", true)}
              />
            )}

            {tab === "orders" && (
              <OrdersTab
                orders={orders}
                vendorId={profile._id}
                onChanged={() => loadTab("orders", true)}
              />
            )}

            {tab === "returns" && (
              <VendorReturns entries={returns} onChanged={() => loadTab("returns", true)} />
            )}

            {tab === "store" && (
              <StoreTab profile={profile} setProfile={setProfile} onChanged={loadProfile} />
            )}
          </>
        )}
      </section>
    </main>
  );
}
