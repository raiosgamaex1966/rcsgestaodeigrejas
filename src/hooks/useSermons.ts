import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Sermon {
  id: string;
  tenant_id?: string;
  title: string;
  description: string | null;
  preacher_id: string | null;
  theme_id: string | null;
  duration_minutes: number | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  transcript: string | null;
  summary: string | null;
  topics: any;
  bible_references: string[] | null;
  views: number;
  is_featured: boolean;
  is_published: boolean;
  recorded_at: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  preacher?: { name: string; title: string | null } | null;
  theme?: { name: string; color: string } | null;
}

export interface Theme {
  id: string;
  tenant_id?: string;
  name: string;
  description: string | null;
  color: string;
  is_active: boolean;
}

export interface Preacher {
  id: string;
  tenant_id?: string;
  name: string;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export const useSermons = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["sermons", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("sermons")
        .select(`
          *,
          preacher:preachers(name, title),
          theme:themes(name, color)
        `)
        .eq("is_published", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Sermon[];
    },
    enabled: !!tenantId,
  });
};

export const useAllSermons = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["sermons", "all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("sermons")
        .select(`
          *,
          preacher:preachers(name, title),
          theme:themes(name, color)
        `);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Sermon[];
    },
    enabled: !!tenantId,
  });
};

export const useThemes = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["themes", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("themes")
        .select("*")
        .eq("is_active", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("name");
      
      if (error) throw error;
      return data as Theme[];
    },
    enabled: !!tenantId,
  });
};

export const usePreachers = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["preachers", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("preachers")
        .select("*")
        .eq("is_active", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("name");
      
      if (error) throw error;
      return data as Preacher[];
    },
    enabled: !!tenantId,
  });
};

export const useIncrementViews = () => {
  return useMutation({
    mutationFn: async (sermonId: string) => {
      const { data: sermon } = await supabase
        .from("sermons")
        .select("views")
        .eq("id", sermonId)
        .single();
      
      if (sermon) {
        await supabase
          .from("sermons")
          .update({ views: (sermon.views || 0) + 1 })
          .eq("id", sermonId);
      }
    },
  });
};
