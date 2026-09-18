import { useState } from "react";
import api from "../api/axios";
import { notify } from "../components/Toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post("/users/forgot-password", { email });
      setDone(true);
      notify(r.data.message);
    } catch (error) {
      notify(error.response?.data?.message || "Request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Account recovery</span>
        <h1>Reset password</h1>
        <p className="muted">In local development the reset link is printed in the server terminal.</p>

        {done ? (
          <div className="success-note">Reset instructions generated. Check the server console.</div>
        ) : (
          <>
            <label>Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
            <button className="button full" disabled={loading}>{loading ? "Sending..." : "Generate reset link"}</button>
          </>
        )}
      </form>
    </main>
  );
}
