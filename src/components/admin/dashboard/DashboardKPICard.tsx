import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardKPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  loading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  size?: "default" | "small";
}

export const DashboardKPICard = ({
  label,
  value,
  icon: Icon,
  color = "bg-primary/10 text-primary",
  loading = false,
  trend,
  size = "default",
}: DashboardKPICardProps) => {
  const isSmall = size === "small";

  return (
    <Card 
      variant="elevated" 
      className="hover:shadow-lg transition-shadow duration-300"
    >
      <CardContent className={cn("p-4", isSmall && "p-3")}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-xl flex-shrink-0",
            color,
            isSmall ? "p-2" : "p-3"
          )}>
            <Icon className={cn(isSmall ? "w-4 h-4" : "w-5 h-5")} />
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <Skeleton className={cn(isSmall ? "h-6 w-12" : "h-8 w-16", "mb-1")} />
            ) : (
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "font-bold text-foreground truncate",
                  isSmall ? "text-xl" : "text-2xl"
                )}>
                  {value}
                </p>
                {trend && (
                  <span className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-500"
                  )}>
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(0)}%
                  </span>
                )}
              </div>
            )}
            <p className={cn(
              "text-muted-foreground truncate",
              isSmall ? "text-xs" : "text-sm"
            )}>
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
