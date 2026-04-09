import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type RequestType = 'prayer' | 'baptism' | 'food_basket' | 'visitation' | 'pastoral';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Request {
  id: string;
  tenant_id?: string;
  user_id: string | null;
  type: RequestType;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  status: RequestStatus;
  assigned_to: string | null;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRequestData {
  type: RequestType;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  is_urgent?: boolean;
}

export const useUserRequests = () => {
  const { user, tenantId } = useAuth();
  
  return useQuery({
    queryKey: ["requests", "user", user?.id, tenantId],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from("requests")
        .select("*")
        .eq("user_id", user.id);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Request[];
    },
    enabled: !!user && !!tenantId,
  });
};

export const useAllRequests = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["requests", "all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("requests")
        .select("*");
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Request[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();
  const { user, tenantId } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateRequestData) => {
      console.log('Sending request data:', { ...data, user_id: user?.id || null, tenant_id: tenantId });
      const { error } = await supabase
        .from("requests")
        .insert({
          type: data.type,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          message: data.message,
          is_urgent: data.is_urgent || false,
          user_id: user?.id || null, // Explicitly set to null if no user
          tenant_id: tenantId
        });
      
      if (error) {
        console.error('Supabase error creating request:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      const { error } = await supabase
        .from("requests")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });
};
