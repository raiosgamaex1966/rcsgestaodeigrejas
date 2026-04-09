import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Heart, 
  TrendingUp, 
  Calendar,
  Filter,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

const MyContributions = () => {
  const { user, getTenantPath } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState("all");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Fetch user contributions
  const { data: contributions, isLoading } = useQuery({
    queryKey: ["my-contributions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_entries")
        .select(`
          id,
          amount,
          date,
          description,
          payment_method,
          category:financial_categories(id, name, icon, color),
          campaign:campaigns(id, title, icon)
        `)
        .eq("user_id", user?.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Filter contributions based on selected period
  const filteredContributions = useMemo(() => {
    if (!contributions) return [];

    let filtered = contributions;

    if (period !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case "month":
          startDate = startOfMonth(now);
          break;
        case "3months":
          startDate = subMonths(now, 3);
          break;
        case "6months":
          startDate = subMonths(now, 6);
          break;
        case "year":
          startDate = new Date(parseInt(year), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      filtered = contributions.filter(c => new Date(c.date) >= startDate);
    }

    if (period === "year") {
      filtered = contributions.filter(c => 
        new Date(c.date).getFullYear() === parseInt(year)
      );
    }

    return filtered;
  }, [contributions, period, year]);

  // Calculate totals
  const totals = useMemo(() => {
    const total = filteredContributions.reduce((sum, c) => sum + Number(c.amount), 0);
    const thisMonth = contributions?.filter(c => {
      const date = new Date(c.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    const lastMonth = contributions?.filter(c => {
      const date = new Date(c.date);
      const lastMonthDate = subMonths(new Date(), 1);
      return date.getMonth() === lastMonthDate.getMonth() && date.getFullYear() === lastMonthDate.getFullYear();
    }).reduce((sum, c) => sum + Number(c.amount), 0) || 0;

    return { total, thisMonth, lastMonth };
  }, [filteredContributions, contributions]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const methods: Record<string, string> = {
      pix: "PIX",
      cash: "Dinheiro",
      card: "Cartão",
      transfer: "Transferência",
    };
    return methods[method || ""] || method || "Não informado";
  };

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="w-full max-w-lg md:max-w-3xl mx-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="flex items-center gap-3 px-4 md:px-6 py-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link to={getTenantPath("/profile")}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">
            Contribuições
          </h1>
        </div>
      </header>

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-fade-in">
          <Card className="border-0 shadow-soft bg-card/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Este mês</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totals.thisMonth)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-card/40 backdrop-blur-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Mês anterior</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totals.lastMonth)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft bg-card/40 backdrop-blur-md col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary/50" />
                <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/60">Total</span>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-24" />
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {formatCurrency(totals.total)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-border/50 shadow-soft bg-card/40 backdrop-blur-md animate-slide-up">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest">Filtrar Histórico</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-full md:w-[180px] bg-secondary/50 border-0 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="3months">Últimos 3 meses</SelectItem>
                  <SelectItem value="6months">Últimos 6 meses</SelectItem>
                  <SelectItem value="year">Por ano</SelectItem>
                </SelectContent>
              </Select>

              {period === "year" && (
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full md:w-[120px] bg-secondary/50 border-0 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contributions List */}
        <Card className="border-border/50 shadow-soft bg-card/40 backdrop-blur-md animate-slide-up">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif font-bold">Histórico Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredContributions.length === 0 ? (
              <div className="text-center py-12 bg-secondary/30 rounded-3xl border-2 border-dashed border-border/50">
                <Heart className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium italic">
                  Nenhuma contribuição encontrada neste período
                </p>
                <Button variant="link" className="mt-2 text-primary font-bold" asChild>
                  <Link to={getTenantPath("/offerings")}>Fazer uma contribuição</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredContributions.map((contribution, index) => (
                  <div
                    key={contribution.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-2xl border border-border/30 hover:shadow-soft transition-all animate-scale-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-foreground text-base">
                          {formatCurrency(Number(contribution.amount))}
                        </span>
                        {contribution.category && (
                          <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md">
                            {(contribution.category as any).name}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/60 uppercase tracking-widest">
                        <span>
                          {format(new Date(contribution.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        <span>•</span>
                        <span>{getPaymentMethodLabel(contribution.payment_method)}</span>
                      </div>
                      {contribution.campaign && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-primary" />
                          <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                            Campanha: {(contribution.campaign as any).title}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspirational verse */}
        <Card className="border-0 shadow-soft bg-gradient-to-br from-primary/5 to-secondary/5 p-6 text-center animate-fade-in">
          <p className="text-xs md:text-sm italic text-muted-foreground mb-3 font-serif leading-relaxed">
            "A generosidade de um homem abre-lhe o caminho e leva-o à presença dos grandes."
          </p>
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Provérbios 18:16</p>
        </Card>
      </div>
    </div>
  );
};

export default MyContributions;
