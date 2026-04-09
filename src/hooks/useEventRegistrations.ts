import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventRegistration {
  id: string;
  event_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  payment_status: string | null;
  payment_proof_url: string | null;
  notes: string | null;
  registered_at: string | null;
  created_at: string | null;
}

export type EventRegistrationInsert = Omit<EventRegistration, "id" | "created_at" | "registered_at">;

export const useEventRegistrations = (eventId: string) => {
  return useQuery({
    queryKey: ["event-registrations", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: false });

      if (error) throw error;
      return data as EventRegistration[];
    },
    enabled: !!eventId,
  });
};

export const useEventRegistrationCount = (eventId: string) => {
  return useQuery({
    queryKey: ["event-registration-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });
};

export const usePublicEventBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["public-event", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("public_slug", slug)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};

export const useCreateEventRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registration: EventRegistrationInsert) => {
      const { data, error } = await supabase
        .from("event_registrations")
        .insert(registration)
        .select()
        .single();

      if (error) throw error;
      return data as EventRegistration;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", variables.event_id] });
      queryClient.invalidateQueries({ queryKey: ["event-registration-count", variables.event_id] });
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Este email já está inscrito neste evento");
      } else {
        toast.error("Erro ao realizar inscrição: " + error.message);
      }
    },
  });
};

export const useUpdateEventRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<EventRegistration> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("event_registrations")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", data.event_id] });
      toast.success("Inscrição atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar inscrição: " + error.message);
    },
  });
};

export const useDeleteEventRegistration = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, eventId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["event-registrations", variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-registration-count", variables.eventId] });
      toast.success("Inscrição removida!");
    },
    onError: (error) => {
      toast.error("Erro ao remover inscrição: " + error.message);
    },
  });
};
