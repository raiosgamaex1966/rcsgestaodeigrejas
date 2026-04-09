import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ChurchSettings {
  id: string;
  church_name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  foreground_color: string | null;
  gold_color: string | null;
  burgundy_color: string | null;
  pwa_name: string | null;
  pwa_short_name: string | null;
  pwa_description: string | null;
  pwa_theme_color: string | null;
  pwa_background_color: string | null;
  pwa_icon_192_url: string | null;
  pwa_icon_512_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  seo_og_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_address: string | null;
  website_url: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  social_whatsapp: string | null;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_beneficiary_name: string | null;
  pix_qrcode_url: string | null;
  pix_instructions: string | null;
  useful_links: { label: string; url: string }[] | null;
  // AI Configuration
  openai_api_key: string | null;
  ai_enabled: boolean;
  ai_model_chat: string | null;
  ai_model_generation: string | null;
  created_at: string;
  updated_at: string;
}

export const useChurchSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['church-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('church_settings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ChurchSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<ChurchSettings>) => {
      if (!settings?.id) {
        // Se não houver configurações, cria a primeira entrada
        const { data, error } = await supabase
          .from('church_settings')
          .insert({
            church_name: "Minha Igreja",
            ...updates
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('church_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['church-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar configurações: ' + error.message);
    },
  });

  const uploadAsset = async (file: File, path: string): Promise<string | null> => {
    const fileName = `${path}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const { error } = await supabase.storage
      .from('church-assets')
      .upload(fileName, file, { upsert: true });

    if (error) {
      toast.error('Erro ao fazer upload: ' + error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('church-assets')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  return {
    settings,
    isLoading,
    updateSettings,
    uploadAsset,
  };
};
