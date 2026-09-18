import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";
export default function ProtectedRoute({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
