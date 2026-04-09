import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface Photo {
  id: string;
  album_id: string;
  image_url: string;
  thumbnail_url: string | null;
  description: string | null;
  face_descriptors: Json | null;
  faces_count: number;
  sort_order: number;
  created_at: string;
}

const PAGE_SIZE = 20;

export const usePhotos = (albumId: string | undefined) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["photos", albumId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!albumId) return { photos: [], nextPage: null };
      
      const from = pageParam * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("album_id", albumId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        photos: data as Photo[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!albumId,
    initialPageParam: 0,
  });

  const photos = data?.pages.flatMap((page) => page.photos) ?? [];

  const uploadPhoto = useMutation({
    mutationFn: async ({ 
      albumId, 
      imageUrl, 
      thumbnailUrl 
    }: { 
      albumId: string; 
      imageUrl: string; 
      thumbnailUrl?: string;
    }) => {
      const { data, error } = await supabase
        .from("photos")
        .insert({
          album_id: albumId,
          image_url: imageUrl,
          thumbnail_url: thumbnailUrl || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", albumId] });
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
    },
  });

  const deletePhoto = useMutation({
    mutationFn: async (photoId: string) => {
      const { error } = await supabase.from("photos").delete().eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", albumId] });
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success("Foto excluída!");
    },
    onError: () => {
      toast.error("Erro ao excluir foto");
    },
  });

  const deletePhotos = useMutation({
    mutationFn: async (photoIds: string[]) => {
      const { error } = await supabase.from("photos").delete().in("id", photoIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", albumId] });
      queryClient.invalidateQueries({ queryKey: ["photo-albums"] });
      toast.success("Fotos excluídas!");
    },
    onError: () => {
      toast.error("Erro ao excluir fotos");
    },
  });

  const updateFaceDescriptors = useMutation({
    mutationFn: async ({ 
      photoId, 
      descriptors, 
      facesCount 
    }: { 
      photoId: string; 
      descriptors: number[][]; 
      facesCount: number;
    }) => {
      const { error } = await supabase
        .from("photos")
        .update({ 
          face_descriptors: descriptors as unknown as Json, 
          faces_count: facesCount 
        })
        .eq("id", photoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["photos", albumId] });
    },
  });

  return {
    photos,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    uploadPhoto,
    deletePhoto,
    deletePhotos,
    updateFaceDescriptors,
  };
};
