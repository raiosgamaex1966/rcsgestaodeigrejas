import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface CreateContributionData {
  amount: number;
  category_id?: string;
  campaign_id?: string;
  payment_method?: string;
  description?: string;
  date?: string;
}

export function useContributions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's contributions
  const { data: contributions, isLoading } = useQuery({
    queryKey: ["contributions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("income_entries")
        .select(`
          id,
          amount,
          date,
          description,
          payment_method,
          category:financial_categories(id, name, icon, color),
          campaign:campaigns(id, title, icon)
        `)
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Create a new contribution
  const createContribution = useMutation({
    mutationFn: async (data: CreateContributionData) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Get default account
      const { data: defaultAccount } = await supabase
        .from("financial_accounts")
        .select("id")
        .eq("is_default", true)
        .eq("is_active", true)
        .single();

      const { error } = await supabase
        .from("income_entries")
        .insert({
          ...data,
          user_id: user.id,
          account_id: defaultAccount?.id,
          status: "confirmed",
          date: data.date || new Date().toISOString().split("T")[0],
        });

      if (error) throw error;

      // Update campaign amount if linked
      if (data.campaign_id) {
        const { data: campaign } = await supabase
          .from("campaigns")
          .select("current_amount")
          .eq("id", data.campaign_id)
          .single();
        
        if (campaign) {
          await supabase
            .from("campaigns")
            .update({ current_amount: Number(campaign.current_amount) + data.amount })
            .eq("id", data.campaign_id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contributions"] });
      queryClient.invalidateQueries({ queryKey: ["my-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Contribuição registrada!",
        description: "Obrigado pela sua generosidade. Deus abençoe!",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao registrar contribuição",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  // Calculate stats
  const stats = {
    total: contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0,
    count: contributions?.length || 0,
  };

  return {
    contributions,
    isLoading,
    createContribution,
    stats,
  };
}
