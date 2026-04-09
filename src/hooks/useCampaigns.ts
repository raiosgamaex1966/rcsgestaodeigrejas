import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Campaign {
  id: string;
  tenant_id?: string;
  title: string;
  description: string | null;
  goal_amount: number;
  current_amount: number;
  icon: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // Payment info fields
  use_global_pix: boolean;
  pix_key: string | null;
  pix_key_type: string | null;
  pix_beneficiary_name: string | null;
  pix_qrcode_url: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_holder_name: string | null;
}

export const useCampaigns = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["campaigns", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select("*")
        .eq("is_active", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!tenantId,
  });
};

export const useAllCampaigns = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["campaigns", "all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("campaigns")
        .select("*");
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Campaign[];
    },
    enabled: !!tenantId,
  });
};
