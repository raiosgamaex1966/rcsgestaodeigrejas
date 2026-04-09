import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface PhotoAlbum {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  event_date: string | null;
  event_id: string | null;
  is_published: boolean;
  photos_count: number;
  created_at: string;
  updated_at: string;
}

export const usePhotoAlbums = (onlyPublished = false) => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  const { data: albums = [], isLoading } = useQuery({
    queryKey: ["photo-albums", onlyPublished, tenantId],
    queryFn: async () => {
      let query = supabase
        .from("photo_albums")
        .select("*")
        .order("event_date", { ascending: false, nullsFirst: false });

      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      if (onlyPublished) {
        query = query.eq("is_published", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PhotoAlbum[];
    },
    enabled: !!tenantId,
  });

  const createAlbum = useMutation({
    mutationFn: async (album: Omit<Partial<PhotoAlbum>, 'id' | 'created_at' | 'updated_at' | 'photos_count'> & { name: string }) => {
      const { data, error } = await supabase
        .from("photo_albums")
        .insert([{ ...album, tenant_id: tenantId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success("Álbum criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar álbum");
    },
  });

  const updateAlbum = useMutation({
    mutationFn: async ({ id, ...album }: Partial<PhotoAlbum> & { id: string }) => {
      const { data, error } = await supabase
        .from("photo_albums")
        .update(album)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success("Álbum atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar álbum");
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("photo_albums").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success("Álbum excluído!");
    },
    onError: () => {
      toast.error("Erro ao excluir álbum");
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from("photo_albums")
        .update({ is_published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { is_published }) => {
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success(is_published ? "Álbum publicado!" : "Álbum despublicado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  return {
    albums,
    isLoading,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    togglePublish,
  };
};

export const usePhotoAlbum = (albumId: string | undefined) => {
  return useQuery({
    queryKey: ["photo-album", albumId],
    queryFn: async () => {
      if (!albumId) return null;
      const { data, error } = await supabase
        .from("photo_albums")
        .select("*")
        .eq("id", albumId)
        .single();
      if (error) throw error;
      return data as PhotoAlbum;
    },
    enabled: !!albumId,
  });
};
