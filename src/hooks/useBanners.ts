import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface Banner {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  link_type: string;
  background_color: string;
  is_active: boolean;
  order_index: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useBanners = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["banners", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*");
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
    enabled: !!tenantId,
  });
};

export const useAllBanners = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["banners", "all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("banners")
        .select("*");
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Banner[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateBanner = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: async (banner: { title: string } & Omit<Partial<Banner>, 'title'>) => {
      const { data, error } = await supabase
        .from("banners")
        .insert([{ ...banner, tenant_id: tenantId } as any])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao criar banner: " + error.message);
    },
  });
};

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Banner> & { id: string }) => {
      const { data, error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar banner: " + error.message);
    },
  });
};

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      toast.success("Banner excluído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error("Erro ao excluir banner: " + error.message);
    },
  });
};
