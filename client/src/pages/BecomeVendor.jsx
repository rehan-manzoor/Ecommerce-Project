import { useEffect, useState } from "react";
import { Link } from "react-router";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { notify } from "../components/Toast";

export default function BecomeVendor() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [form, setForm] = useState({ storeName: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/vendors/me")
      .then((r) => setVendor(r.data.data))
      .catch((error) => {
        if (error.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const r = await api.post("/vendors", form);
      setVendor(r.data.data);
      setNotFound(false);
      notify("Vendor application submitted");
    } catch (error) {
      notify(error.response?.data?.message || "Application failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="state-card page-state">Loading...</div>;

  if (user?.role === "vendor") {
    return (
      <main className="container page-shell">
        <div className="state-card">
          <h2>You are an approved vendor</h2>
          <Link className="button" to="/vendor">Open vendor dashboard</Link>
        </div>
      </main>
    );
  }

  if (vendor) {
    return (
      <main className="container page-shell">
        <div className="vendor-status-card panel">
          <span className={`status-badge ${vendor.status}`}>{vendor.status}</span>
          <h1>{vendor.storeName}</h1>
          <p>{vendor.description}</p>
          {vendor.status === "pending" && (
            <p className="muted">Your application is waiting for admin review. After approval, log out and sign in again to refresh your vendor role.</p>
          )}
          {vendor.status === "rejected" && (
            <p className="danger-text">Reason: {vendor.rejectionReason || "No reason provided"}</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="container page-shell">
      <div className="seller-hero panel">
        <span className="eyebrow">Sell on MERN Market</span>
        <h1>Open your store</h1>
        <p>Submit your seller profile. An administrator will review it before you can publish products.</p>
      </div>

      {notFound && (
        <form className="panel seller-form" onSubmit={submit}>
          <label>Store name<input required value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></label>
          <label>Description<textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <button className="button" disabled={submitting}>{submitting ? "Submitting..." : "Submit application"}</button>
        </form>
      )}
    </main>
  );
}
