// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { getToken, clearAuth, getRole } from "../utils/auth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = getToken();
  const userRole = getRole();

  if (!token) {
    // Jika tidak ada token, hapus data user juga dan redirect ke login
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // Cek role jika ada allowedRoles
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect ke dashboard jika tidak punya akses
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
