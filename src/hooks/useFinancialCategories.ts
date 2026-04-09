import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FinancialCategory {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  description: string | null;
  is_default: boolean;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export function useFinancialCategories(type?: 'income' | 'expense') {
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["financial-categories", type],
    queryFn: async () => {
      let query = supabase
        .from("financial_categories")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancialCategory[];
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: {
      name: string;
      type: string;
      icon?: string | null;
      color?: string | null;
      description?: string | null;
      is_default?: boolean;
      is_active?: boolean;
      order_index?: number;
    }) => {
      const { data, error } = await supabase
        .from("financial_categories")
        .insert({
          name: category.name,
          type: category.type,
          icon: category.icon || 'CircleDollarSign',
          color: category.color || '#6366f1',
          description: category.description,
          is_default: category.is_default ?? false,
          is_active: category.is_active ?? true,
          order_index: category.order_index || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });

  const updateCategory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("financial_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("financial_categories")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Categoria removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover categoria: " + error.message);
    },
  });

  const incomeCategories = categories?.filter(c => c.type === 'income') || [];
  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];

  return {
    categories,
    incomeCategories,
    expenseCategories,
    isLoading,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
