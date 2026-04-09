import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  FileText,
  Building2,
  PieChart,
  CheckSquare,
  History
} from "lucide-react";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useFinancialAccounts } from "@/hooks/useFinancialAccounts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";

export default function AdminFinancialDashboard() {
  const { currentMonth, monthlyData, categoryData, recentTransactions, isLoading } = useFinancialSummary();
  const { accounts, totalBalance } = useFinancialAccounts();

  // Count pending approvals
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['pending-approvals-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('expense_entries')
        .select('*', { count: 'exact', head: true })
        .eq('requires_approval', true)
        .eq('approval_status', 'pending');
      if (error) throw error;
      return count || 0;
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Visão geral das finanças da igreja - {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="relative">
            <Link to="/admin/financial/approvals">
              <CheckSquare className="h-4 w-4 mr-2" />
              Aprovações
              {pendingCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-destructive-foreground text-xs">
                  {pendingCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/financial/audit">
              <History className="h-4 w-4 mr-2" />
              Auditoria
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/financial/reports">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/financial/accounts">
              <Building2 className="h-4 w-4 mr-2" />
              Contas
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/financial/categories">
              <PieChart className="h-4 w-4 mr-2" />
              Categorias
            </Link>
          </Button>
          <Button asChild>
            <Link to="/admin/financial/income">
              <Plus className="h-4 w-4 mr-2" />
              Nova Receita
            </Link>
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Total */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">
              Em {accounts?.length || 0} conta(s) ativa(s)
            </p>
          </CardContent>
        </Card>

        {/* Receitas do Mês */}
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas do Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(currentMonth?.totalIncome || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Entradas confirmadas
            </p>
          </CardContent>
        </Card>

        {/* Despesas do Mês */}
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas do Mês</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(currentMonth?.totalExpenses || 0)}
            </div>
            <div className="flex gap-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                Pago: {formatCurrency(currentMonth?.totalPaidExpenses || 0)}
              </Badge>
              {(currentMonth?.pendingExpenses || 0) > 0 && (
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                  Pendente: {formatCurrency(currentMonth?.pendingExpenses || 0)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balanço do Mês */}
        <Card className={`border-l-4 ${(currentMonth?.monthBalance || 0) >= 0 ? 'border-l-blue-500' : 'border-l-red-500'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(currentMonth?.monthBalance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(currentMonth?.monthBalance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Receitas - Despesas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Fluxo de Caixa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fluxo de Caixa - Últimos 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    className="text-xs"
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
              Receitas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData?.incomeByCategory && categoryData.incomeByCategory.length > 0 ? (
              <div className="space-y-4">
                {categoryData.incomeByCategory.slice(0, 5).map((cat, index) => (
                  <div key={cat.category_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.category_color || COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{cat.category_name}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma receita registrada este mês
              </p>
            )}
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowDownRight className="h-5 w-5 text-red-500" />
              Despesas por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData?.expenseByCategory && categoryData.expenseByCategory.length > 0 ? (
              <div className="space-y-4">
                {categoryData.expenseByCategory.slice(0, 5).map((cat, index) => (
                  <div key={cat.category_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.category_color || COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm font-medium">{cat.category_name}</span>
                    </div>
                    <span className="text-sm font-bold text-red-600">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma despesa registrada este mês
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Transações */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Últimas Receitas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Últimas Receitas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/financial/income">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions?.recentIncome && recentTransactions.recentIncome.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.recentIncome.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">
                        {entry.contributor_name || entry.category?.name || 'Receita'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                        {entry.description && ` • ${entry.description}`}
                      </p>
                    </div>
                    <span className="font-bold text-emerald-600">
                      +{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma receita recente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Últimas Despesas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Últimas Despesas</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/financial/expenses">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions?.recentExpenses && recentTransactions.recentExpenses.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.recentExpenses.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          {entry.description}
                        </p>
                        <Badge 
                          variant={entry.status === 'paid' ? 'default' : 'outline'}
                          className={`text-xs ${entry.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'text-amber-600 border-amber-300'}`}
                        >
                          {entry.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.date), "dd/MM/yyyy")}
                        {entry.supplier_name && ` • ${entry.supplier_name}`}
                      </p>
                    </div>
                    <span className="font-bold text-red-600">
                      -{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma despesa recente
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contas Bancárias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Contas / Caixas</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/financial/accounts">Gerenciar</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {accounts && accounts.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.filter(a => a.is_active).map((account) => (
                <div 
                  key={account.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      account.type === 'bank' ? 'bg-blue-100 text-blue-600' :
                      account.type === 'cash' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {account.type === 'bank' ? <Building2 className="h-4 w-4" /> :
                       account.type === 'cash' ? <Wallet className="h-4 w-4" /> :
                       <DollarSign className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{account.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${Number(account.current_balance) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(Number(account.current_balance))}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma conta cadastrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
