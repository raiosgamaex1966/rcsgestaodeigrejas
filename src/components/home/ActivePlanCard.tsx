import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, AlertCircle, CheckCircle, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useReadingPlans, ReadingPlan, PlanProgress } from "@/hooks/useReadingPlans";
import { useAuth } from "@/hooks/useAuth";

export const ActivePlanCard = () => {
  const { user } = useAuth();
  const { 
    plans, 
    getActivePlans, 
    getPlanProgress,
    getDaysOverdue,
    getExpectedDay,
    loading 
  } = useReadingPlans();

  if (!user || loading) return null;

  const activePlans = getActivePlans();
  if (activePlans.length === 0) return null;

  // Show first active plan
  const plan = activePlans[0];
  const progress = getPlanProgress(plan.id);
  
  if (!progress) return null;

  const currentDay = progress.current_day || 1;
  const totalDays = plan.duration_days;
  const percentage = Math.round((currentDay / totalDays) * 100);
  const daysOverdue = getDaysOverdue(plan.id);
  const isOnTrack = daysOverdue === 0;

  return (
    <Card className="border-0 shadow-soft overflow-hidden">
      <CardContent className="p-0">
        <div className="flex">
          {/* Image */}
          {plan.thumbnail_url ? (
            <div className="w-24 h-32 flex-shrink-0">
              <img 
                src={plan.thumbnail_url} 
                alt={plan.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-32 flex-shrink-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {plan.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Dia {currentDay} de {totalDays} • {percentage}%
                </p>
              </div>
              {isOnTrack ? (
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Em dia
                </Badge>
              ) : (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {daysOverdue} {daysOverdue === 1 ? "dia" : "dias"} atraso
                </Badge>
              )}
            </div>

            <Progress value={percentage} className="h-2 mb-3" />

            <Button asChild size="sm" className="w-full">
              <Link to={`/plans/${plan.id}/days`} className="flex items-center justify-center gap-2">
                {isOnTrack ? "Continuar leitura" : "Atualizar agora"}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
