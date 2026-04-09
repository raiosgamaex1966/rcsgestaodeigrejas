import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { safeParseDate } from "@/lib/date-utils";
import { useAuth } from "@/hooks/useAuth";

export interface MemberProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  birth_date: string | null;
  gender: string | null;
  marital_status: string | null;
  wedding_date: string | null;
  baptism_date: string | null;
  conversion_date: string | null;
  member_since: string | null;
  address_street: string | null;
  address_number: string | null;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  member_type: string | null;
  matricula: string | null;
  notes: string | null;
  profession: string | null;
  is_active: boolean | null;
  is_approved: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface MemberStats {
  total: number;
  members: number;
  visitors: number;
  newConverts: number;
  baptismsThisYear: number;
  birthdaysThisMonth: number;
  byGender: { male: number; female: number; other: number };
  byAgeGroup: Record<string, number>;
  byCity: Record<string, number>;
  byMaritalStatus: Record<string, number>;
}

const getAgeGroup = (birthDate: string | null): string => {
  if (!birthDate) return 'Não informado';
  const today = new Date();
  const birth = safeParseDate(birthDate);
  if (!birth) return 'Não informado';
  const age = today.getFullYear() - birth.getFullYear();
  if (age < 18) return '0-17';
  if (age < 25) return '18-24';
  if (age < 35) return '25-34';
  if (age < 45) return '35-44';
  if (age < 55) return '45-54';
  if (age < 65) return '55-64';
  return '65+';
};

// Hook para buscar TODOS os membros aprovados do tenant atual
export const useMembers = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['members-all', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!tenantId,
  });
};

// Hook para buscar membros PENDENTES de aprovação do tenant atual
export const usePendingMembers = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['members-pending', tenantId],
    queryFn: async () => {
      if (!tenantId) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_approved', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!tenantId,
  });
};

// Hook para aprovar múltiplos membros em massa
export const useBulkApproveMembers = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: async (memberIds: string[]) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_approved: true })
        .in('id', memberIds);
      if (error) throw error;

      // Também atualiza o role se ainda for 'user' genérico
      for (const memberId of memberIds) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', memberId)
          .maybeSingle();

        if (roleData?.role === 'user' || !roleData) {
          await supabase
            .from('user_roles')
            .upsert({ user_id: memberId, role: 'membro', tenant_id: tenantId })
            .eq('user_id', memberId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-pending', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['members-all', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-full', tenantId] });
      toast.success('Membros aprovados com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao aprovar membros: ' + error.message);
    },
  });
};

export const useMemberStats = () => {
  const { data: members, isLoading } = useMembers();

  const stats: MemberStats | null = members ? (() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const byGender = { male: 0, female: 0, other: 0 };
    const byAgeGroup: Record<string, number> = {};
    const byCity: Record<string, number> = {};
    const byMaritalStatus: Record<string, number> = {};

    let members_count = 0;
    let visitors = 0;
    let newConverts = 0;
    let baptismsThisYear = 0;
    let birthdaysThisMonth = 0;

    members.forEach(m => {
      // Member type counts
      if (m.member_type === 'membro') members_count++;
      else if (m.member_type === 'visitante') visitors++;
      else if (m.member_type === 'novo_convertido') newConverts++;

      // Gender
      if (m.gender === 'M') byGender.male++;
      else if (m.gender === 'F') byGender.female++;
      else byGender.other++;

      // Age groups
      const ageGroup = getAgeGroup(m.birth_date);
      byAgeGroup[ageGroup] = (byAgeGroup[ageGroup] || 0) + 1;

      // Cities
      const city = m.address_city || 'Não informado';
      byCity[city] = (byCity[city] || 0) + 1;

      // Marital status
      const marital = m.marital_status || 'Não informado';
      byMaritalStatus[marital] = (byMaritalStatus[marital] || 0) + 1;

      // Baptisms this year
      if (m.baptism_date) {
        const baptismDate = safeParseDate(m.baptism_date);
        if (baptismDate && baptismDate.getFullYear() === currentYear) baptismsThisYear++;
      }

      // Birthdays this month
      if (m.birth_date) {
        const birthDate = safeParseDate(m.birth_date);
        if (birthDate && birthDate.getMonth() === currentMonth) birthdaysThisMonth++;
      }
    });

    return {
      total: members.length,
      members: members_count,
      visitors,
      newConverts,
      baptismsThisYear,
      birthdaysThisMonth,
      byGender,
      byAgeGroup,
      byCity,
      byMaritalStatus,
    };
  })() : null;

  return { stats, isLoading };
};

export const useBirthdays = (month?: number) => {
  const { data: members } = useMembers();

  const birthdays = members?.filter(m => {
    if (!m.birth_date) return false;
    const birthDate = safeParseDate(m.birth_date);
    return birthDate && (month === undefined || birthDate.getMonth() === month);
  }).sort((a, b) => {
    const dayA = safeParseDate(a.birth_date!)?.getDate() || 0;
    const dayB = safeParseDate(b.birth_date!)?.getDate() || 0;
    return dayA - dayB;
  }) || [];

  return birthdays;
};

export const useBaptisms = (month?: number) => {
  const { data: members } = useMembers();

  const baptisms = members?.filter(m => {
    if (!m.baptism_date) return false;
    const baptismDate = safeParseDate(m.baptism_date);
    return baptismDate && (month === undefined || baptismDate.getMonth() === month);
  }).sort((a, b) => {
    const dayA = safeParseDate(a.baptism_date!)?.getDate() || 0;
    const dayB = safeParseDate(b.baptism_date!)?.getDate() || 0;
    return dayA - dayB;
  }) || [];

  return baptisms;
};

export const useWeddings = (month?: number) => {
  const { data: members } = useMembers();

  const weddings = members?.filter(m => {
    if (!m.wedding_date) return false;
    const weddingDate = safeParseDate(m.wedding_date);
    return weddingDate && (month === undefined || weddingDate.getMonth() === month);
  }).sort((a, b) => {
    const dayA = safeParseDate(a.wedding_date!)?.getDate() || 0;
    const dayB = safeParseDate(b.wedding_date!)?.getDate() || 0;
    return dayA - dayB;
  }) || [];

  return weddings;
};

export const useCreateMember = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: async ({ email, full_name, role, password, trialDays = 4 }: { email: string; full_name: string; role: string; password?: string; trialDays?: number }) => {
      // Calculate trial end date
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

      // Use signUp to create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || 'Membro2026!',
        options: {
          data: {
            full_name,
            trial_ends_at: trialEndsAt.toISOString(),
            tenant_id: tenantId,
            role: role || 'membro',
            is_approved: true, // Membros criados diretamente pelo admin já são aprovados
          },
        },
      });

      if (error) throw error;

      // Se a role não é 'user', atualiza
      if (data.user && role !== 'user') {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({ user_id: data.user.id, role, tenant_id: tenantId });

        if (roleError) console.error('Error updating role:', roleError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-full', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['members-all', tenantId] });
      toast.success('Membro incluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar membro: ' + error.message);
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useAuth();

  return useMutation({
    mutationFn: async (memberId: string) => {
      // First, remove roles to avoid FK issues if any
      await supabase.from('user_roles').delete().eq('user_id', memberId);

      // Then delete from profiles
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-full', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['members-all', tenantId] });
      toast.success('Membro excluído com sucesso.');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir membro: ' + error.message);
    },
  });
};
