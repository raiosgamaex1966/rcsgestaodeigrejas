import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export const StreakCounter = ({ streak, className }: StreakCounterProps) => {
  const isActive = streak > 0;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn(
        "relative",
        isActive && "animate-pulse"
      )}>
        <Flame 
          className={cn(
            "w-6 h-6 transition-colors",
            isActive ? "text-orange-500 fill-orange-500" : "text-muted-foreground"
          )} 
        />
        {isActive && streak >= 7 && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping" />
        )}
      </div>
      <span className={cn(
        "font-bold text-lg",
        isActive ? "text-orange-500" : "text-muted-foreground"
      )}>
        {streak}
      </span>
    </div>
  );
};
