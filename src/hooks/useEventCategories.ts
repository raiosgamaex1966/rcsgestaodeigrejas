import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  is_active: boolean;
  order_index: number;
  created_at: string;
}

export type EventCategoryInsert = Omit<EventCategory, "id" | "created_at">;
export type EventCategoryUpdate = Partial<EventCategoryInsert>;

export const useEventCategories = () => {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_categories")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as EventCategory[];
    },
  });
};

export const useCreateEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: EventCategoryInsert) => {
      const { data, error } = await supabase
        .from("event_categories")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as EventCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success("Categoria criada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar categoria: " + error.message);
    },
  });
};

export const useUpdateEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...category }: EventCategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("event_categories")
        .update(category)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as EventCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success("Categoria atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar categoria: " + error.message);
    },
  });
};

export const useDeleteEventCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("event_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      toast.success("Categoria excluída com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir categoria: " + error.message);
    },
  });
};
