import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLevelInfo } from "@/hooks/useGamification";

interface PointsBadgeProps {
  points: number;
  showLevel?: boolean;
  className?: string;
}

export const PointsBadge = ({ points, showLevel = true, className }: PointsBadgeProps) => {
  const levelInfo = getLevelInfo(points);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 bg-primary/10 px-2.5 py-1 rounded-full">
        <Star className="w-4 h-4 text-primary fill-primary" />
        <span className="font-semibold text-sm text-primary">{points}</span>
      </div>
      {showLevel && (
        <div className="text-xs text-muted-foreground">
          Nível {levelInfo.level} • {levelInfo.name}
        </div>
      )}
    </div>
  );
};
