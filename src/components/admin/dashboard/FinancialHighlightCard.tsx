import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface FinancialHighlightCardProps {
  amount: number;
  previousAmount: number;
  loading?: boolean;
}

export const FinancialHighlightCard = ({
  amount,
  previousAmount,
  loading,
}: FinancialHighlightCardProps) => {
  const change = previousAmount > 0 
    ? ((amount - previousAmount) / previousAmount) * 100 
    : 0;
  
  const isPositive = change >= 0;

  return (
    <Card 
      variant="elevated" 
      className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground overflow-hidden"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm mb-1">
              Arrecadação do Mês
            </p>
            {loading ? (
              <Skeleton className="h-10 w-40 bg-white/20" />
            ) : (
              <div className="flex items-baseline gap-3">
                <p className="text-3xl md:text-4xl font-bold">
                  {amount.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </p>
                {previousAmount > 0 && (
                  <div className={`flex items-center gap-1 text-sm ${
                    isPositive ? "text-green-300" : "text-red-300"
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">
                      {isPositive ? "+" : ""}{change.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            )}
            <p className="text-primary-foreground/60 text-xs mt-2">
              Comparado com o mês anterior
            </p>
          </div>
          
          <div className="hidden md:flex w-20 h-20 rounded-full bg-white/10 items-center justify-center">
            {isPositive ? (
              <TrendingUp className="w-10 h-10 text-white/80" />
            ) : (
              <TrendingDown className="w-10 h-10 text-white/80" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
