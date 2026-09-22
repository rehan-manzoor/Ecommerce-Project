import { Navigate, useLocation } from "react-router";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  const location = useLocation();

  if (!ready) {
    return <div className="state-card page-state">Restoring session...</div>;
  }

  return user ? (
    children
  ) : (
    <Navigate
      to="/login"
      state={{
        from: location.pathname,
      }}
      replace
    />
  );
}
