import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subMonths } from "date-fns";

interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategorySummary {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  type: string;
}

export function useFinancialSummary() {
  const currentDate = new Date();
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  // Resumo do mês atual
  const { data: currentMonthData, isLoading: isLoadingCurrent } = useQuery({
    queryKey: ["financial-summary", "current-month"],
    queryFn: async () => {
      // Buscar receitas do mês
      const { data: incomeData } = await supabase
        .from("income_entries")
        .select("amount")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .eq("status", "confirmed");

      // Buscar despesas do mês (todas, independente do status)
      const { data: expenseData } = await supabase
        .from("expense_entries")
        .select("amount, status")
        .gte("date", monthStart)
        .lte("date", monthEnd);

      // Buscar despesas pagas do mês
      const { data: paidExpenseData } = await supabase
        .from("expense_entries")
        .select("amount")
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .eq("status", "paid");

      // Buscar saldo total das contas
      const { data: accountsData } = await supabase
        .from("financial_accounts")
        .select("current_balance")
        .eq("is_active", true);

      const totalIncome = incomeData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalExpenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalPaidExpenses = paidExpenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const pendingExpenses = totalExpenses - totalPaidExpenses;
      const totalBalance = accountsData?.reduce((sum, a) => sum + Number(a.current_balance), 0) || 0;

      return {
        totalIncome,
        totalExpenses,
        totalPaidExpenses,
        pendingExpenses,
        totalBalance,
        monthBalance: totalIncome - totalExpenses,
      };
    },
  });

  // Últimos 6 meses para gráfico
  const { data: monthlyData, isLoading: isLoadingMonthly } = useQuery({
    queryKey: ["financial-summary", "monthly"],
    queryFn: async () => {
      const months: MonthlySummary[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(currentDate, i);
        const start = format(startOfMonth(date), 'yyyy-MM-dd');
        const end = format(endOfMonth(date), 'yyyy-MM-dd');
        const monthLabel = format(date, 'MMM');

        const { data: incomeData } = await supabase
          .from("income_entries")
          .select("amount")
          .gte("date", start)
          .lte("date", end)
          .eq("status", "confirmed");

        const { data: expenseData } = await supabase
          .from("expense_entries")
          .select("amount")
          .gte("date", start)
          .lte("date", end)
          .eq("status", "paid");

        const income = incomeData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
        const expenses = expenseData?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

        months.push({
          month: monthLabel,
          income,
          expenses,
          balance: income - expenses,
        });
      }

      return months;
    },
  });

  // Resumo por categoria
  const { data: categoryData, isLoading: isLoadingCategory } = useQuery({
    queryKey: ["financial-summary", "by-category"],
    queryFn: async () => {
      // Receitas por categoria
      const { data: incomeByCategory } = await supabase
        .from("income_entries")
        .select(`
          amount,
          category:financial_categories(id, name, color, icon)
        `)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .eq("status", "confirmed");

      // Despesas por categoria
      const { data: expenseByCategory } = await supabase
        .from("expense_entries")
        .select(`
          amount,
          category:financial_categories(id, name, color, icon)
        `)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      // Agrupar receitas
      const incomeMap = new Map<string, CategorySummary>();
      incomeByCategory?.forEach((entry: any) => {
        if (entry.category) {
          const existing = incomeMap.get(entry.category.id);
          if (existing) {
            existing.total += Number(entry.amount);
          } else {
            incomeMap.set(entry.category.id, {
              category_id: entry.category.id,
              category_name: entry.category.name,
              category_color: entry.category.color,
              category_icon: entry.category.icon,
              total: Number(entry.amount),
              type: 'income',
            });
          }
        }
      });

      // Agrupar despesas
      const expenseMap = new Map<string, CategorySummary>();
      expenseByCategory?.forEach((entry: any) => {
        if (entry.category) {
          const existing = expenseMap.get(entry.category.id);
          if (existing) {
            existing.total += Number(entry.amount);
          } else {
            expenseMap.set(entry.category.id, {
              category_id: entry.category.id,
              category_name: entry.category.name,
              category_color: entry.category.color,
              category_icon: entry.category.icon,
              total: Number(entry.amount),
              type: 'expense',
            });
          }
        }
      });

      return {
        incomeByCategory: Array.from(incomeMap.values()).sort((a, b) => b.total - a.total),
        expenseByCategory: Array.from(expenseMap.values()).sort((a, b) => b.total - a.total),
      };
    },
  });

  // Últimas transações
  const { data: recentTransactions, isLoading: isLoadingRecent } = useQuery({
    queryKey: ["financial-summary", "recent"],
    queryFn: async () => {
      const { data: recentIncome } = await supabase
        .from("income_entries")
        .select(`
          id, amount, date, description, contributor_name,
          category:financial_categories(name, icon, color)
        `)
        .order("date", { ascending: false })
        .limit(5);

      const { data: recentExpenses } = await supabase
        .from("expense_entries")
        .select(`
          id, amount, date, description, supplier_name, status,
          category:financial_categories(name, icon, color)
        `)
        .order("date", { ascending: false })
        .limit(5);

      return {
        recentIncome: recentIncome || [],
        recentExpenses: recentExpenses || [],
      };
    },
  });

  return {
    currentMonth: currentMonthData,
    monthlyData,
    categoryData,
    recentTransactions,
    isLoading: isLoadingCurrent || isLoadingMonthly || isLoadingCategory || isLoadingRecent,
  };
}
