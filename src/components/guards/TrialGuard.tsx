import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const TrialGuard = () => {
  const { isTrialExpired, loading, isAdmin, userRole } = useAuth();

  if (loading) return null;

  // Owners bypass trial check for testing
  if (userRole === 'owner') return <Outlet />;

  if (isTrialExpired) {
    return <Navigate to="/trial-expired" replace />;
  }

  return <Outlet />;
};
