import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface RecentPhoto {
    id: string;
    image_url: string;
    thumbnail_url: string | null;
    description: string | null;
    created_at: string;
    album_id: string;
    album_name: string;
}

export const useRecentPhotos = (limit = 10) => {
    const { tenantId } = useAuth();

    const { data: photos = [], isLoading } = useQuery({
        queryKey: ["recent-photos", limit, tenantId],
        queryFn: async () => {
            // Fetch recent photos from published albums only
            let query = supabase
                .from("photos")
                .select(`
                  id,
                  image_url,
                  thumbnail_url,
                  description,
                  created_at,
                  album_id,
                  photo_albums!inner (
                    name,
                    is_published,
                    tenant_id
                  )
                `)
                .eq("photo_albums.is_published", true);
            
            if (tenantId) {
                query = query.eq("photo_albums.tenant_id", tenantId);
            }

            const { data, error } = await query
                .order("created_at", { ascending: false })
                .limit(limit);

            if (error) throw error;

            return (data || []).map((photo: any) => ({
                id: photo.id,
                image_url: photo.image_url,
                thumbnail_url: photo.thumbnail_url,
                description: photo.description,
                created_at: photo.created_at,
                album_id: photo.album_id,
                album_name: photo.photo_albums?.name || "Álbum",
            })) as RecentPhoto[];
        },
        enabled: !!tenantId,
    });

    return { photos, isLoading };
};
