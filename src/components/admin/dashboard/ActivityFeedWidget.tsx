import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecentActivity } from "@/hooks/useDashboardStats";
import { Activity, Users, Calendar, Mic2, Receipt } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeConfig = {
  member: { icon: Users, color: "text-primary bg-primary/10" },
  event: { icon: Calendar, color: "text-gold bg-gold/10" },
  sermon: { icon: Mic2, color: "text-accent bg-accent/10" },
  expense: { icon: Receipt, color: "text-green-600 bg-green-100" },
};

export const ActivityFeedWidget = () => {
  const { data: activities, isLoading } = useRecentActivity(8);

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-indigo-500" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Activity className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma atividade recente</p>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;
              
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 py-2 border-b border-border last:border-0"
                >
                  <div className={`p-1.5 rounded-lg ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.subtitle} •{" "}
                      {formatDistanceToNow(new Date(activity.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
