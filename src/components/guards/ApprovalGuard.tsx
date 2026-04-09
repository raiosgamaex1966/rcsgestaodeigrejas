import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ApprovalGuardProps {
  children: ReactNode;
}

export const ApprovalGuard = ({ children }: ApprovalGuardProps) => {
  const { user, userRole, isApproved, isAdmin, loading, tenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Só agimos quando o carregamento terminar e tivermos um usuário
    if (!loading && user) {
      // Owner e Admin sempre têm acesso total (SuperAdmin ou Dono/Admin da igreja)
      if (userRole === 'owner' || isAdmin) return;

      // Se não estiver aprovado, mandamos para a tela de pendência
      // Exceto se já estivermos nela
      if (!isApproved && location.pathname !== "/pending-approval") {
        navigate("/pending-approval", { replace: true });
        return;
      }
      
      // Se o usuário FOI aprovado e está na tela de pendência, manda para o app
      if (isApproved && location.pathname === "/pending-approval") {
        if (tenant?.slug) {
          navigate(`/app/${tenant.slug}`, { replace: true });
        } else {
          navigate("/app", { replace: true });
        }
      }
    }
    
    // Se não tem usuário e tenta acessar rota protegida
    if (!loading && !user && location.pathname !== "/auth" && location.pathname !== "/pending-approval") {
      navigate("/auth", { replace: true });
    }
  }, [user, userRole, isApproved, isAdmin, loading, navigate, location.pathname, tenant?.slug]);

  // Enquanto carrega, mostramos nada (o redirecionamento acontecerá após)
  if (loading) return null;

  return <>{children}</>;
};
