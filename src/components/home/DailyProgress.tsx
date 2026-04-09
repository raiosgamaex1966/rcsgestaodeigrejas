import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { Button } from "@/components/ui/button";
import { BookOpen, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";

export const DailyProgress = () => {
  const { user } = useAuth();
  const { gamification, loading } = useGamification();

  if (!user || loading) return null;

  const dailyGoal = 1; // 1 capítulo por dia
  const todayPoints = gamification?.xp_this_week || 0;
  const progress = Math.min((todayPoints / 10) * 100, 100); // 10 pontos = 1 capítulo

  return (
    <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <StreakCounter streak={gamification?.current_streak || 0} />
            <div>
              <p className="text-sm font-medium text-foreground">
                {gamification?.current_streak || 0} dias de sequência
              </p>
              <p className="text-xs text-muted-foreground">
                Continue assim! 🎉
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">{gamification?.total_points || 0}</p>
            <p className="text-xs text-muted-foreground">pontos</p>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Meta diária
            </span>
            <span className="font-medium text-foreground">
              {progress >= 100 ? "Completa! ✅" : `${Math.round(progress)}%`}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/bible" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {progress >= 100 ? "Continuar lendo" : "Ler agora"}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
