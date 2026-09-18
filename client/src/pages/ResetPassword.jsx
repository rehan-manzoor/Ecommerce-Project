import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import api from "../api/axios";
import { notify } from "../components/Toast";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      notify("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/reset-password/${token}`, { password });
      notify("Password reset successfully. You can now sign in.");
      navigate("/login");
    } catch (error) {
      notify(error.response?.data?.message || "Reset failed. The link may have expired.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <span className="eyebrow">Account recovery</span>
        <h1>Choose a new password</h1>
        <p className="muted">Pick something you haven't used before.</p>

        <label>
          New password
          <input
            type="password"
            minLength="6"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            minLength="6"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        <button className="button full" disabled={loading}>
          {loading ? "Resetting..." : "Reset password"}
        </button>
        <p>
          Remembered it after all? <Link className="text-link" to="/login">Back to sign in</Link>
        </p>
      </form>
    </main>
  );
}
