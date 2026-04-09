import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialAccount {
  id: string;
  name: string;
  type: string;
  description: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useFinancialAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ["financial-accounts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as FinancialAccount[];
    },
  });

  const createAccount = useMutation({
    mutationFn: async (account: {
      name: string;
      type?: string;
      description?: string | null;
      bank_name?: string | null;
      bank_agency?: string | null;
      bank_account?: string | null;
      initial_balance?: number;
      current_balance?: number;
      is_active?: boolean;
      is_default?: boolean;
    }) => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .insert({
          name: account.name,
          type: account.type || 'bank',
          description: account.description,
          bank_name: account.bank_name,
          bank_agency: account.bank_agency,
          bank_account: account.bank_account,
          initial_balance: account.initial_balance || 0,
          current_balance: account.current_balance || 0,
          is_active: account.is_active ?? true,
          is_default: account.is_default ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast.success("Conta criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar conta: " + error.message);
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_accounts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast.success("Conta atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar conta: " + error.message);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_accounts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-accounts"] });
      toast.success("Conta removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover conta: " + error.message);
    },
  });

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.current_balance), 0) || 0;

  return {
    accounts,
    isLoading,
    createAccount,
    updateAccount,
    deleteAccount,
    totalBalance,
  };
}
