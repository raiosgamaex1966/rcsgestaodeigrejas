import { Progress } from "@/components/ui/progress";
import { getLevelInfo } from "@/hooks/useGamification";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelProgressProps {
  points: number;
  className?: string;
}

export const LevelProgress = ({ points, className }: LevelProgressProps) => {
  const levelInfo = getLevelInfo(points);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Nível {levelInfo.level}</p>
            <p className="text-sm text-primary">{levelInfo.name}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg text-foreground">{points}</p>
          <p className="text-xs text-muted-foreground">pontos totais</p>
        </div>
      </div>
      
      {levelInfo.nextLevel && (
        <div className="space-y-1">
          <Progress value={levelInfo.progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Faltam {levelInfo.nextLevel.minPoints - points} pts para {levelInfo.nextLevel.name}
          </p>
        </div>
      )}
    </div>
  );
};
