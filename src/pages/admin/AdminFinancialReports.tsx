import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from "recharts";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFinancialReportPDF } from "@/utils/pdfExport";
import { toast } from "sonner";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function AdminFinancialReports() {
  const navigate = useNavigate();
  const { currentMonth, monthlyData, categoryData, isLoading } = useFinancialSummary();
  const { settings } = useChurchSettings();
  const [selectedPeriod, setSelectedPeriod] = useState("6");
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportFinancialReportPDF({
        currentMonth: currentMonth || null,
        monthlyData: monthlyData || null,
        incomeByCategory: categoryData?.incomeByCategory || null,
        expenseByCategory: categoryData?.expenseByCategory || null,
        churchName: settings?.church_name
      });
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao exportar relatório PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const currentMonthName = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  // Dados para gráfico de pizza de receitas
  const incomePieData = categoryData?.incomeByCategory?.map(cat => ({
    name: cat.category_name,
    value: cat.total,
    color: cat.category_color || COLORS[0]
  })) || [];

  // Dados para gráfico de pizza de despesas
  const expensePieData = categoryData?.expenseByCategory?.map(cat => ({
    name: cat.category_name,
    value: cat.total,
    color: cat.category_color || COLORS[0]
  })) || [];

  // Dados para gráfico de área (saldo acumulado)
  const balanceData = monthlyData?.reduce((acc: any[], month, index) => {
    const previousBalance = index > 0 ? acc[index - 1].balance : 0;
    acc.push({
      month: month.month,
      balance: previousBalance + month.balance,
      income: month.income,
      expenses: month.expenses
    });
    return acc;
  }, []) || [];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/financial")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Relatórios Financeiros</h1>
            <p className="text-muted-foreground">Análise detalhada das finanças</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportPDF} disabled={isExporting || isLoading}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? "Exportando..." : "Exportar PDF"}
          </Button>
        </div>
      </div>

      {/* Demonstrativo do Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Demonstrativo - {currentMonthName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Receitas</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(currentMonth?.totalIncome || 0)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">Despesas</span>
              </div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(currentMonth?.totalExpenses || 0)}
              </p>
            </div>

            <div className={`p-4 rounded-lg ${(currentMonth?.monthBalance || 0) >= 0 ? 'bg-blue-500/10 border-blue-500/20' : 'bg-orange-500/10 border-orange-500/20'} border`}>
              <div className={`flex items-center gap-2 ${(currentMonth?.monthBalance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'} mb-2`}>
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Saldo do Mês</span>
              </div>
              <p className={`text-2xl font-bold ${(currentMonth?.monthBalance || 0) >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                {formatCurrency(currentMonth?.monthBalance || 0)}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">Saldo em Caixa</span>
              </div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(currentMonth?.totalBalance || 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="cashflow" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
          <TabsTrigger value="income">Receitas</TabsTrigger>
          <TabsTrigger value="expenses">Despesas</TabsTrigger>
          <TabsTrigger value="comparison">Comparativo</TabsTrigger>
        </TabsList>

        {/* Fluxo de Caixa */}
        <TabsContent value="cashflow" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Receitas vs Despesas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Bar dataKey="income" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Evolução do Saldo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={balanceData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" className="text-xs" />
                      <YAxis className="text-xs" tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Area 
                        type="monotone" 
                        dataKey="balance" 
                        name="Saldo Acumulado"
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receitas por Categoria */}
        <TabsContent value="income" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Receitas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {incomePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={incomePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {incomePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhuma receita registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Receitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData?.incomeByCategory?.length ? (
                    categoryData.incomeByCategory.map((cat, index) => (
                      <div key={cat.category_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.category_color || COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{cat.category_name}</span>
                        </div>
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhuma categoria com receita</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Despesas por Categoria */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Despesas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {expensePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={expensePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {expensePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Nenhuma despesa registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalhamento de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categoryData?.expenseByCategory?.length ? (
                    categoryData.expenseByCategory.map((cat, index) => (
                      <div key={cat.category_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.category_color || COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{cat.category_name}</span>
                        </div>
                        <span className="font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(cat.total)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Nenhuma categoria com despesa</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comparativo */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      name="Receitas" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Despesas" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      name="Saldo" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      dot={{ fill: '#10B981' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tabela Comparativa */}
          <Card>
            <CardHeader>
              <CardTitle>Tabela de Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Mês</th>
                      <th className="text-right py-3 px-4">Receitas</th>
                      <th className="text-right py-3 px-4">Despesas</th>
                      <th className="text-right py-3 px-4">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData?.map((month, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4 font-medium">{month.month}</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(month.income)}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(month.expenses)}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${month.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {formatCurrency(month.balance)}
                        </td>
                      </tr>
                    ))}
                    {monthlyData && (
                      <tr className="bg-muted/50 font-bold">
                        <td className="py-3 px-4">Total</td>
                        <td className="py-3 px-4 text-right text-green-600 dark:text-green-400">
                          {formatCurrency(monthlyData.reduce((sum, m) => sum + m.income, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 dark:text-red-400">
                          {formatCurrency(monthlyData.reduce((sum, m) => sum + m.expenses, 0))}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-600 dark:text-blue-400">
                          {formatCurrency(monthlyData.reduce((sum, m) => sum + m.balance, 0))}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
