import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
export default function VendorRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return user.role === "vendor" ? children : <Navigate to="/become-vendor" replace />;
}
