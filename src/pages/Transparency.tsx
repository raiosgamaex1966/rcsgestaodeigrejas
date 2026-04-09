import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { TrendingUp, TrendingDown, Wallet, Heart, Users, ChurchIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function Transparency() {
  const { currentMonth, monthlyData, categoryData, isLoading } = useFinancialSummary();
  const { settings } = useChurchSettings();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonthName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  const topExpenses = categoryData?.expenseByCategory?.slice(0, 5) || [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground font-medium animate-pulse">Gerando relatório de transparência...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in px-4 md:px-6">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe -mx-4 md:-mx-6 px-4 md:px-6 py-4">
        <div className="flex flex-col items-center text-center gap-1">
          <div className="p-3 rounded-2xl bg-primary/10 shadow-soft mb-1">
            <ChurchIcon className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">Prestação de Contas</h1>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            {settings?.church_name || 'Nossa Igreja'} • {currentMonthName}
          </p>
        </div>
      </header>

      {/* Mensagem de Transparência */}
      <Card className="bg-primary/5 border-primary/20 shadow-soft rounded-2xl overflow-hidden animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Heart className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold uppercase tracking-widest text-primary">Compromisso com a Transparência</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acreditamos na importância de prestar contas à nossa comunidade. 
                Aqui você pode acompanhar como estamos administrando os recursos da igreja com integridade.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Entradas</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground">
              {formatCurrency(currentMonth?.totalIncome || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/40 backdrop-blur-md shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Saídas</span>
            </div>
            <p className="text-lg md:text-xl font-bold text-foreground">
              {formatCurrency(currentMonth?.totalExpenses || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Saldo */}
      <Card className="border-border/50 shadow-soft animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-bold font-serif">Saldo do Mês</span>
            </div>
            <span className={`text-lg md:text-xl font-bold ${(currentMonth?.monthBalance || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(currentMonth?.monthBalance || 0)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Histórico */}
      <Card className="border-border/50 shadow-soft animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif font-bold">Histórico Financeiro</CardTitle>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Últimos meses</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px] font-bold uppercase tracking-tighter" 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  className="text-[10px]" 
                  tickFormatter={(value) => `${(value/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--secondary)/0.5)'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="income" name="Entradas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="expenses" name="Saídas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Onde Investimos */}
      <Card className="border-border/50 shadow-soft animate-slide-up">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold">Distribuição de Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          {topExpenses.length > 0 ? (
            <div className="space-y-5">
              {topExpenses.map((cat, index) => {
                const percentage = currentMonth?.totalExpenses 
                  ? (cat.total / currentMonth.totalExpenses) * 100 
                  : 0;
                return (
                  <div key={cat.category_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/80 uppercase tracking-tighter">{cat.category_name}</span>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(cat.total)} <span className="text-[10px] text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 shadow-sm"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: cat.category_color || COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 italic text-sm">
              Nenhuma despesa registrada este mês.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Fontes de Receita */}
      <Card className="border-border/50 shadow-soft animate-slide-up">
        <CardHeader>
          <CardTitle className="text-base font-serif font-bold">Fontes de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData?.incomeByCategory?.length ? (
            <div className="space-y-5">
              {categoryData.incomeByCategory.slice(0, 5).map((cat, index) => {
                const percentage = currentMonth?.totalIncome 
                  ? (cat.total / currentMonth.totalIncome) * 100 
                  : 0;
                return (
                  <div key={cat.category_id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground/80 uppercase tracking-tighter">{cat.category_name}</span>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(cat.total)} <span className="text-[10px] text-muted-foreground ml-1">({percentage.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 shadow-sm"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: cat.category_color || COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8 italic text-sm">
              Nenhuma receita registrada este mês.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Footer Info */}
      <div className="text-center pt-4 pb-8 space-y-3 opacity-60">
        <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Users className="h-3 w-3" />
          Transparência • Comunidade • Fé
        </div>
        <p className="text-[9px] text-muted-foreground italic">
          Relatório gerado automaticamente em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}
