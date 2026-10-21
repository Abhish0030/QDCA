import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { ROLES } from "../utils/roles";

/**
 * AdminRoute — wraps a page component.
 * If role !== "admin", redirects to the dashboard instead of rendering a blank page.
 */
export default function AdminRoute({ role, onRedirect, children }) {
  useEffect(() => {
    if (role !== ROLES.ADMIN) {
      onRedirect?.("Dashboard");
    }
  }, [onRedirect, role]);

  if (role !== ROLES.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
