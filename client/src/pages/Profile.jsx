import { useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { notify } from "../components/Toast";

const EMPTY_ADDRESS = { label: "Home", address: "", city: "", state: "", postalCode: "", country: "Pakistan", isDefault: false };

export default function Profile() {
  const { refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", avatar: "" });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const load = async () => {
    const r = await api.get("/users/me");
    setProfile(r.data.data);
    setForm({ name: r.data.data.name, avatar: r.data.data.avatar || "" });
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/users/me", form);
      await refreshUser();
      await load();
      notify("Profile updated");
    } catch (error) {
      notify(error.response?.data?.message || "Update failed", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const addAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      await api.post("/users/me/addresses", address);
      setAddress(EMPTY_ADDRESS);
      await load();
      notify("Address added");
    } catch (error) {
      notify(error.response?.data?.message || "Could not add address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  const removeAddress = async (id) => {
    await api.delete(`/users/me/addresses/${id}`);
    await load();
    notify("Address removed");
  };

  if (!profile) return <ProfileSkeleton />;

  return (
    <main className="container page-shell">
      <div className="page-title">
        <span className="eyebrow">Account</span>
        <h1>My profile</h1>
      </div>

      <div className="profile-grid">
        <form className="panel" onSubmit={saveProfile}>
          <h2>Personal information</h2>
          <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>Avatar URL<input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Optional image URL" /></label>
          <label>Email<input value={profile.email} disabled /></label>
          <label>Role<input value={profile.role} disabled /></label>
          <button className="button" disabled={savingProfile}>{savingProfile ? "Saving..." : "Save changes"}</button>
        </form>

        <section className="panel">
          <h2>Saved addresses</h2>

          {!profile.addresses?.length && <p className="muted">No saved addresses yet.</p>}

          {profile.addresses?.map((item) => (
            <div className="address-card" key={item._id}>
              <div>
                <strong>{item.label} {item.isDefault && <span className="verified-badge">Default</span>}</strong>
                <p>{item.address}, {item.city}, {item.state} {item.postalCode}, {item.country}</p>
              </div>
              <button className="text-button danger" onClick={() => removeAddress(item._id)}>Remove</button>
            </div>
          ))}

          <form className="address-form" onSubmit={addAddress}>
            <h3>Add address</h3>
            <div className="form-grid">
              <label>Label<input value={address.label} onChange={(e) => setAddress({ ...address, label: e.target.value })} /></label>
              <label className="wide">Street address<input required value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} /></label>
              <label>City<input required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} /></label>
              <label>State<input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} /></label>
              <label>Postal code<input required value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} /></label>
              <label>Country<input required value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} /></label>
            </div>
            <label className="checkbox">
              <input type="checkbox" checked={address.isDefault} onChange={(e) => setAddress({ ...address, isDefault: e.target.checked })} /> Make default
            </label>
            <button className="button" disabled={savingAddress}>{savingAddress ? "Saving..." : "Add address"}</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function ProfileSkeleton() {
  return (
    <main className="container page-shell">
      <div className="skeleton" style={{ height: 32, width: 200, marginBottom: 30 }} />
      <div className="profile-grid">
        <div className="panel"><div className="skeleton" style={{ height: 220 }} /></div>
        <div className="panel"><div className="skeleton" style={{ height: 220 }} /></div>
      </div>
    </main>
  );
}
