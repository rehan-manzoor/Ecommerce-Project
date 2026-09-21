import { useEffect, useState } from "react";
import api from "../api/axios";
import { notify } from "../components/Toast";
import { useDialog } from "../components/Dialog";

import {
  TABS,
  EMPTY_CATEGORY,
  EMPTY_COUPON,
  capitalize,
  OverviewTab,
  VendorsTab,
  ProductsTab,
  OrdersTab,
  ReturnManagement,
  ShippingManagement,
  ReviewsTab,
  CategoriesTab,
  CouponsTab,
  UsersTab,
  DashboardSkeletonSidebar,
  DashboardSkeleton,
} from "../components/admin/AdminSections";

export default function Admin() {
  const openDialog = useDialog();

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState(new Set());

  const [data, setData] = useState({
    overview: null,
    sales: [],
    topProducts: [],
    topVendors: [],
    vendors: [],
    products: [],
    orders: [],
    reviews: [],
    categories: [],
    coupons: [],
    users: [],
    returns: [],
    shipping: [],
  });

  const [categoryForm, setCategoryForm] = useState(EMPTY_CATEGORY);

  const [couponForm, setCouponForm] = useState(EMPTY_COUPON);

  const [editingCouponId, setEditingCouponId] = useState(null);

  const loadTab = async (targetTab, force = false) => {
    if (!force && loadedTabs.has(targetTab)) {
      return;
    }

    if (targetTab === "overview") {
      setLoading(true);
    } else {
      setTabLoading(true);
    }

    try {
      if (targetTab === "overview") {
        const [overview, sales, topProducts, topVendors] = await Promise.all([
          api.get("/admin/analytics/overview"),
          api.get("/admin/analytics/sales-over-time?range=30d"),
          api.get("/admin/analytics/top-products"),
          api.get("/admin/analytics/top-vendors"),
        ]);

        setData((current) => ({
          ...current,
          overview: overview.data.data,
          sales: sales.data.data || [],
          topProducts: topProducts.data.data || [],
          topVendors: topVendors.data.data || [],
        }));
      }

      if (targetTab === "vendors") {
        const response = await api.get("/vendors");

        setData((current) => ({
          ...current,
          vendors: response.data.data || [],
        }));
      }

      if (targetTab === "products") {
        const response = await api.get("/products/admin/all");

        setData((current) => ({
          ...current,
          products: response.data.data || [],
        }));
      }

      if (targetTab === "orders") {
        const response = await api.get("/admin/orders");

        setData((current) => ({
          ...current,
          orders: response.data.data || [],
        }));
      }

      if (targetTab === "reviews") {
        const response = await api.get("/reviews/admin/all");

        setData((current) => ({
          ...current,
          reviews: response.data.data || [],
        }));
      }

      if (targetTab === "categories") {
        const response = await api.get("/categories");

        setData((current) => ({
          ...current,
          categories: response.data.data || [],
        }));
      }

      if (targetTab === "coupons") {
        const response = await api.get("/coupons");

        setData((current) => ({
          ...current,
          coupons: response.data.data || [],
        }));
      }

      if (targetTab === "users") {
        const response = await api.get("/users?limit=50");

        setData((current) => ({
          ...current,
          users: response.data.data || [],
        }));
      }

      if (targetTab === "returns") {
        const response = await api.get("/returns/manage");

        setData((current) => ({
          ...current,
          returns: response.data.data || [],
        }));
      }

      if (targetTab === "shipping") {
        const response = await api.get("/shipping/admin");

        setData((current) => ({
          ...current,
          shipping: response.data.data || [],
        }));
      }

      setLoadedTabs((current) => {
        const updated = new Set(current);

        updated.add(targetTab);

        return updated;
      });
    } catch (error) {
      notify(error.response?.data?.message || `Failed to load ${targetTab} data`, "error");
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  };

  useEffect(() => {
    loadTab(tab);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const act = async (request, successMessage, refreshTab = tab) => {
    try {
      await request();

      notify(successMessage);

      await loadTab(refreshTab, true);
    } catch (error) {
      notify(error.response?.data?.message || "Action failed", "error");
    }
  };

  const createCategory = async (event) => {
    event.preventDefault();

    await act(
      () =>
        api.post("/categories", {
          ...categoryForm,
          parentCategory: categoryForm.parentCategory || null,
        }),
      "Category created",
      "categories"
    );

    setCategoryForm(EMPTY_CATEGORY);
  };

  const editCategory = async (category) => {
    const result = await openDialog({
      title: "Edit category",
      fields: [
        {
          name: "name",
          label: "Category name",
          defaultValue: category.name,
          required: true,
        },
        {
          name: "description",
          label: "Description",
          type: "textarea",
          defaultValue: category.description || "",
        },
      ],
      confirmLabel: "Save changes",
    });

    if (!result) return;

    await act(
      () => api.put(`/categories/${category._id}`, result),
      "Category updated",
      "categories"
    );
  };

  const startEditCoupon = (coupon) => {
    setEditingCouponId(coupon._id);

    setCouponForm({
      code: coupon.code || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || 0,
      minPurchaseAmount: coupon.minPurchaseAmount || 0,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : "",
      active: coupon.active,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditCoupon = () => {
    setEditingCouponId(null);
    setCouponForm(EMPTY_COUPON);
  };

  const saveCoupon = async (event) => {
    event.preventDefault();

    const request = editingCouponId
      ? () => api.put(`/coupons/${editingCouponId}`, couponForm)
      : () => api.post("/coupons", couponForm);

    await act(request, editingCouponId ? "Coupon updated" : "Coupon created", "coupons");

    cancelEditCoupon();
  };

  const rejectVendor = async (vendor) => {
    const result = await openDialog({
      title: "Reject vendor application",
      description: `Optionally let ${vendor.storeName} know why this application was rejected.`,
      fields: [
        {
          name: "rejectionReason",
          label: "Rejection reason (optional)",
          type: "textarea",
        },
      ],
      confirmLabel: "Reject application",
      danger: true,
    });

    if (!result) return;

    await act(
      () =>
        api.put(`/vendors/${vendor._id}/status`, {
          status: "rejected",
          rejectionReason: result.rejectionReason,
        }),
      "Vendor rejected",
      "vendors"
    );
  };

  const changeOrderStatus = async (order, group, status) => {
    let carrier = "";
    let trackingNumber = "";

    if (status === "shipped") {
      const result = await openDialog({
        title: "Shipping information",
        description: "Enter the carrier and tracking number for this shipment.",
        fields: [
          {
            name: "carrier",
            label: "Carrier",
            required: true,
          },
          {
            name: "trackingNumber",
            label: "Tracking number",
            required: true,
          },
        ],
        confirmLabel: "Mark as shipped",
      });

      if (!result) return;

      carrier = result.carrier?.trim();

      trackingNumber = result.trackingNumber?.trim();

      if (!carrier || !trackingNumber) {
        return;
      }
    }

    await act(
      () =>
        api.put(`/admin/orders/${order._id}/status`, {
          vendorId: group.vendor?._id || group.vendor,
          status,
          carrier,
          trackingNumber,
        }),
      "Vendor fulfillment updated",
      "orders"
    );
  };

  if (loading) {
    return (
      <main className="dashboard-shell">
        <DashboardSkeletonSidebar />

        <section className="dashboard-content">
          <DashboardSkeleton />
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <span className="eyebrow">Admin</span>

          <h2>Control center</h2>
        </div>

        {TABS.map((item) => (
          <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>
            {capitalize(item)}
          </button>
        ))}
      </aside>

      <section className="dashboard-content">
        {tabLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {tab === "overview" && <OverviewTab data={data} />}

            {tab === "vendors" && (
              <VendorsTab
                vendors={data.vendors}
                onApprove={(vendor) =>
                  act(
                    () =>
                      api.put(`/vendors/${vendor._id}/status`, {
                        status: "approved",
                      }),
                    "Vendor approved",
                    "vendors"
                  )
                }
                onReject={rejectVendor}
                onSuspend={(vendor) =>
                  act(
                    () =>
                      api.put(`/vendors/${vendor._id}/status`, {
                        status: "suspended",
                      }),
                    "Vendor suspended",
                    "vendors"
                  )
                }
              />
            )}

            {tab === "products" && (
              <ProductsTab
                products={data.products}
                onApprove={(product) =>
                  act(
                    () =>
                      api.put(`/products/${product._id}/moderate`, {
                        approvalStatus: "approved",
                      }),
                    "Product approved",
                    "products"
                  )
                }
                onReject={(product) =>
                  act(
                    () =>
                      api.put(`/products/${product._id}/moderate`, {
                        approvalStatus: "rejected",
                      }),
                    "Product rejected",
                    "products"
                  )
                }
              />
            )}

            {tab === "orders" && (
              <OrdersTab orders={data.orders} onStatusChange={changeOrderStatus} />
            )}

            {tab === "returns" && (
              <ReturnManagement
                returns={data.returns}
                onChange={(entry, status) =>
                  act(
                    () =>
                      api.put(`/returns/${entry._id}/status`, {
                        status,
                      }),
                    "Return updated",
                    "returns"
                  )
                }
              />
            )}

            {tab === "shipping" && (
              <ShippingManagement
                methods={data.shipping}
                onChange={() => loadTab("shipping", true)}
              />
            )}

            {tab === "reviews" && (
              <ReviewsTab
                reviews={data.reviews}
                onApprove={(review) =>
                  act(() => api.put(`/reviews/${review._id}/approve`), "Review approved", "reviews")
                }
                onReject={(review) =>
                  act(() => api.put(`/reviews/${review._id}/reject`), "Review rejected", "reviews")
                }
              />
            )}

            {tab === "categories" && (
              <CategoriesTab
                categories={data.categories}
                form={categoryForm}
                setForm={setCategoryForm}
                onCreate={createCategory}
                onEdit={editCategory}
                onDelete={(category) =>
                  act(
                    () => api.delete(`/categories/${category._id}`),
                    "Category deleted",
                    "categories"
                  )
                }
              />
            )}

            {tab === "coupons" && (
              <CouponsTab
                coupons={data.coupons}
                form={couponForm}
                setForm={setCouponForm}
                editingCouponId={editingCouponId}
                onSave={saveCoupon}
                onCancelEdit={cancelEditCoupon}
                onEdit={startEditCoupon}
                onToggleActive={(coupon) =>
                  act(
                    () =>
                      api.put(`/coupons/${coupon._id}`, {
                        active: !coupon.active,
                      }),
                    coupon.active ? "Coupon disabled" : "Coupon enabled",
                    "coupons"
                  )
                }
                onDelete={(coupon) =>
                  act(() => api.delete(`/coupons/${coupon._id}`), "Coupon deleted", "coupons")
                }
              />
            )}

            {tab === "users" && (
              <UsersTab
                users={data.users}
                onRoleChange={(user, role) =>
                  act(
                    () =>
                      api.put(`/users/${user._id}/role`, {
                        role,
                      }),
                    "Role updated",
                    "users"
                  )
                }
                onToggleBlock={(user) =>
                  act(
                    () =>
                      api.put(`/users/${user._id}/block`, {
                        isBlocked: !user.isBlocked,
                      }),
                    user.isBlocked ? "User unblocked" : "User blocked",
                    "users"
                  )
                }
              />
            )}
          </>
        )}
      </section>
    </main>
  );
}
