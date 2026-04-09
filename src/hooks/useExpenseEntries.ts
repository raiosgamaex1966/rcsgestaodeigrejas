import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FinancialCategory } from "./useFinancialCategories";
import { FinancialAccount } from "./useFinancialAccounts";

export interface ExpenseEntry {
  id: string;
  category_id: string | null;
  account_id: string | null;
  amount: number;
  date: string;
  due_date: string | null;
  payment_method: string;
  supplier_name: string | null;
  description: string;
  receipt_url: string | null;
  is_recurring: boolean;
  recurrence_day: number | null;
  status: string;
  paid_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: FinancialCategory;
  account?: FinancialAccount;
}

interface UseExpenseEntriesOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
  status?: string;
}

export function useExpenseEntries(options: UseExpenseEntriesOptions = {}) {
  const queryClient = useQueryClient();
  const { startDate, endDate, categoryId, accountId, status } = options;

  const { data: entries, isLoading } = useQuery({
    queryKey: ["expense-entries", startDate, endDate, categoryId, accountId, status],
    queryFn: async () => {
      let query = supabase
        .from("expense_entries")
        .select(`
          *,
          category:financial_categories(*),
          account:financial_accounts(*)
        `)
        .order("date", { ascending: false });

      if (startDate) {
        query = query.gte("date", startDate);
      }
      if (endDate) {
        query = query.lte("date", endDate);
      }
      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }
      if (accountId) {
        query = query.eq("account_id", accountId);
      }
      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExpenseEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      category_id?: string | null;
      account_id?: string | null;
      amount: number;
      date?: string;
      due_date?: string | null;
      payment_method?: string;
      supplier_name?: string | null;
      description: string;
      receipt_url?: string | null;
      is_recurring?: boolean;
      recurrence_day?: number | null;
      status?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("expense_entries")
        .insert({
          category_id: entry.category_id,
          account_id: entry.account_id,
          amount: entry.amount,
          date: entry.date || new Date().toISOString().split('T')[0],
          due_date: entry.due_date,
          payment_method: entry.payment_method || 'pix',
          supplier_name: entry.supplier_name,
          description: entry.description,
          receipt_url: entry.receipt_url,
          is_recurring: entry.is_recurring ?? false,
          recurrence_day: entry.recurrence_day,
          status: entry.status || 'pending',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar despesa: " + error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ExpenseEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("expense_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar despesa: " + error.message);
    },
  });

  const markAsPaid = useMutation({
    mutationFn: async ({ id, accountId }: { id: string; accountId: string }) => {
      // Buscar a despesa para saber o valor
      const { data: expense } = await supabase
        .from("expense_entries")
        .select("amount")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("expense_entries")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          account_id: accountId,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Deduzir do saldo da conta
      if (expense && accountId) {
        const { data: account } = await supabase
          .from("financial_accounts")
          .select("current_balance")
          .eq("id", accountId)
          .single();

        if (account) {
          await supabase
            .from("financial_accounts")
            .update({ current_balance: Number(account.current_balance) - Number(expense.amount) })
            .eq("id", accountId);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa marcada como paga!");
    },
    onError: (error) => {
      toast.error("Erro ao marcar como paga: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Despesa removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover despesa: " + error.message);
    },
  });

  const totalExpenses = entries?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const totalPaid = entries?.filter(e => e.status === 'paid').reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;
  const totalPending = entries?.filter(e => e.status === 'pending').reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    markAsPaid,
    deleteEntry,
    totalExpenses,
    totalPaid,
    totalPending,
  };
}
