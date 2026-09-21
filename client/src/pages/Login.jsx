import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { notify } from "../components/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      notify(`Welcome back, ${user.name}`);
      const destination =
        location.state?.from ||
        (user.role === "admin" ? "/admin" : user.role === "vendor" ? "/vendor" : "/");
      navigate(destination, { replace: true });
    } catch (error) {
      notify(error.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in</h1>
        <p className="muted">Access your orders, cart and dashboard.</p>

        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button className="button full" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <Link className="text-link" to="/forgot-password">
          Forgot password?
        </Link>
        <p>
          New here?{" "}
          <Link className="text-link" to="/register">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
