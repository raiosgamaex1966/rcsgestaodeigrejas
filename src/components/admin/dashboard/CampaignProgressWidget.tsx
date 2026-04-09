import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  current_amount: number;
  goal_amount: number;
}

interface CampaignProgressWidgetProps {
  campaigns: Campaign[];
  loading?: boolean;
}

export const CampaignProgressWidget = ({ campaigns, loading }: CampaignProgressWidgetProps) => {
  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="w-5 h-5 text-gold" />
          Progresso das Campanhas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Target className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhuma campanha ativa</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.slice(0, 4).map((campaign) => {
              const percentage = campaign.goal_amount > 0
                ? Math.round((Number(campaign.current_amount) / Number(campaign.goal_amount)) * 100)
                : 0;

              return (
                <div key={campaign.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-foreground truncate">
                      {campaign.title}
                    </span>
                    <span className="text-sm font-semibold text-gold">
                      {percentage}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground">
                    {Number(campaign.current_amount).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}{" "}
                    de{" "}
                    {Number(campaign.goal_amount).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
