import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FinancialCategory } from "./useFinancialCategories";
import { FinancialAccount } from "./useFinancialAccounts";

export interface IncomeEntry {
  id: string;
  category_id: string | null;
  account_id: string | null;
  campaign_id: string | null;
  user_id: string | null;
  amount: number;
  date: string;
  payment_method: string;
  contributor_name: string | null;
  contributor_email: string | null;
  contributor_phone: string | null;
  description: string | null;
  receipt_url: string | null;
  is_recurring: boolean;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  category?: FinancialCategory;
  account?: FinancialAccount;
}

interface UseIncomeEntriesOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  accountId?: string;
}

export function useIncomeEntries(options: UseIncomeEntriesOptions = {}) {
  const queryClient = useQueryClient();
  const { startDate, endDate, categoryId, accountId } = options;

  const { data: entries, isLoading } = useQuery({
    queryKey: ["income-entries", startDate, endDate, categoryId, accountId],
    queryFn: async () => {
      let query = supabase
        .from("income_entries")
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

      const { data, error } = await query;
      if (error) throw error;
      return data as IncomeEntry[];
    },
  });

  const createEntry = useMutation({
    mutationFn: async (entry: {
      category_id?: string | null;
      account_id?: string | null;
      campaign_id?: string | null;
      user_id?: string | null;
      amount: number;
      date?: string;
      payment_method?: string;
      contributor_name?: string | null;
      contributor_email?: string | null;
      contributor_phone?: string | null;
      description?: string | null;
      receipt_url?: string | null;
      is_recurring?: boolean;
      status?: string;
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("income_entries")
        .insert({
          category_id: entry.category_id,
          account_id: entry.account_id,
          campaign_id: entry.campaign_id,
          user_id: entry.user_id,
          amount: entry.amount,
          date: entry.date || new Date().toISOString().split('T')[0],
          payment_method: entry.payment_method || 'pix',
          contributor_name: entry.contributor_name,
          contributor_email: entry.contributor_email,
          contributor_phone: entry.contributor_phone,
          description: entry.description,
          receipt_url: entry.receipt_url,
          is_recurring: entry.is_recurring ?? false,
          status: entry.status || 'confirmed',
          created_by: userData.user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar saldo da conta
      if (entry.account_id && entry.amount) {
        const { data: account } = await supabase
          .from("financial_accounts")
          .select("current_balance")
          .eq("id", entry.account_id)
          .single();
          
        if (account) {
          await supabase
            .from("financial_accounts")
            .update({ current_balance: Number(account.current_balance) + Number(entry.amount) })
            .eq("id", entry.account_id);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Receita registrada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao registrar receita: " + error.message);
    },
  });

  const updateEntry = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IncomeEntry> & { id: string }) => {
      const { data, error } = await supabase
        .from("income_entries")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Receita atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar receita: " + error.message);
    },
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("income_entries")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income-entries"] });
      queryClient.invalidateQueries({ queryKey: ["financial-summary"] });
      toast.success("Receita removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover receita: " + error.message);
    },
  });

  const totalIncome = entries?.reduce((sum, entry) => sum + Number(entry.amount), 0) || 0;

  return {
    entries,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    totalIncome,
  };
}
