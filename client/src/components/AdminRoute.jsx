import { Navigate } from "react-router";

import { useAuth } from "../context/AuthContext";

export default function AdminRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <div className="state-card page-state">Restoring session...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return user.role === "admin" ? children : <Navigate to="/" replace />;
}
