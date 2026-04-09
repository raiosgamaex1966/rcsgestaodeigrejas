import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllRequests } from "@/hooks/useRequests";
import { Clock, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendente", color: "bg-accent/20 text-accent" },
  in_progress: { label: "Em andamento", color: "bg-primary/20 text-primary" },
  completed: { label: "Concluido", color: "bg-green-500/20 text-green-600" },
  cancelled: { label: "Cancelado", color: "bg-muted text-muted-foreground" },
};

const getStatusConfig = (status: string | null | undefined) => {
  return statusConfig[status || "pending"] || statusConfig.pending;
};

const typeLabels: Record<string, string> = {
  prayer: "Oração",
  baptism: "Batismo",
  food_basket: "Cesta Básica",
  visitation: "Visita",
  pastoral: "Direção Pastoral",
  other: "Outro",
};

export const RecentRequestsWidget = () => {
  const { data: requests, isLoading } = useAllRequests();
  const navigate = useNavigate();

  const recentRequests = requests?.slice(0, 5) || [];

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5 text-accent" />
            Solicitações Recentes
          </CardTitle>
          <Link
            to="/admin/requests"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : recentRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma solicitação</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentRequests.map((request) => {
              return (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
                  onClick={() => navigate("/admin/requests")}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">
                      {request.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabels[request.type] || request.type}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusConfig(request.status).color}`}>
                    {getStatusConfig(request.status).label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
