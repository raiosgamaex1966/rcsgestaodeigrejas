import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

export interface Event {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  event_type: string;
  location: string | null;
  start_date: string;
  start_time: string | null;
  end_time: string | null;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_day: number | null;
  is_featured: boolean;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // New fields
  category_id: string | null;
  registration_limit: number | null;
  registration_deadline: string | null;
  registration_status: string | null;
  end_date: string | null;
  organizer_notes: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  is_paid: boolean;
  price: number | null;
  payment_type: string | null;
  payment_external_url: string | null;
  payment_instructions: string | null;
  public_slug: string | null;
  allow_public_registration: boolean;
  // Custom event PIX fields
  event_pix_key: string | null;
  event_pix_key_type: string | null;
  event_pix_beneficiary: string | null;
  event_pix_qrcode_url: string | null;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  confirmed_at: string;
}

export type EventInsert = Partial<Omit<Event, "id" | "created_at" | "updated_at">> & { 
  title: string; 
  start_date: string; 
  event_type: string;
  is_active: boolean;
};
export type EventUpdate = Partial<EventInsert>;

export const useEvents = () => {
  const { tenantId } = useAuth();
  
  return useQuery({
    queryKey: ["events", tenantId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("events")
        .select("*")
        .gte("start_date", today);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
    enabled: !!tenantId,
  });
};

export const useAllEvents = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["events", "all", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select("*");
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as Event[];
    },
    enabled: !!tenantId,
  });
};

export const useUpcomingEvents = (limit = 3) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ["events", "upcoming", limit, tenantId],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      let query = supabase
        .from("events")
        .select("*")
        .gte("start_date", today);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data as Event[];
    },
    enabled: !!tenantId,
  });
};

export const useEventAttendees = (eventId: string) => {
  return useQuery({
    queryKey: ["event-attendees", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eventId);

      if (error) throw error;
      return data as EventAttendee[];
    },
    enabled: !!eventId,
  });
};

export const useUserAttendance = (eventId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ["event-attendance", eventId, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", eventId)
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as EventAttendee | null;
    },
    enabled: !!eventId && !!userId,
  });
};

export const useConfirmAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("event_attendees")
        .insert({ event_id: eventId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data as EventAttendee;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-attendance", variables.eventId] });
      toast.success("Presença confirmada!");
    },
    onError: (error) => {
      toast.error("Erro ao confirmar presença: " + error.message);
    },
  });
};

export const useCancelAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { error } = await supabase
        .from("event_attendees")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-attendance", variables.eventId] });
      toast.success("Presença cancelada");
    },
    onError: (error) => {
      toast.error("Erro ao cancelar presença: " + error.message);
    },
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: async (event: EventInsert) => {
      const { data, error } = await supabase
        .from("events")
        .insert({ ...event, tenant_id: tenantId })
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar evento: " + error.message);
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...event }: EventUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(event)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Event;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Evento excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });
};
