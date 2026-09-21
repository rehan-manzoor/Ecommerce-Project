import { useState } from "react";
import { Link, useNavigate } from "react-router";
import api from "../api/axios";
import { notify } from "../components/Toast";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users", form);
      notify("Account created. You can now sign in.");
      navigate("/login");
    } catch (error) {
      notify(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Join the marketplace</span>
        <h1>Create account</h1>

        <label>
          Name
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength="6"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </label>

        <button className="button full" disabled={loading}>
          {loading ? "Creating..." : "Create account"}
        </button>
        <p>
          Already have an account?{" "}
          <Link className="text-link" to="/login">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
