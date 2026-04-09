import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export const SuperAdminGuard = () => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center">Verificando permissões...</div>;
  }

  if (!user || userRole !== 'owner') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
