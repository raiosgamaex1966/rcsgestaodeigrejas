import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ExpenseApproval {
  id: string;
  expense_id: string;
  requested_by: string | null;
  requested_at: string;
  approval_level: string;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  expense?: {
    id: string;
    description: string;
    amount: number;
    date: string;
    due_date: string | null;
    status: string;
    approval_status: string;
    supplier_name: string | null;
    category?: { name: string; icon: string; color: string } | null;
    account?: { name: string } | null;
  };
  requester?: { full_name: string | null } | null;
  approver?: { full_name: string | null } | null;
}

interface UseExpenseApprovalsOptions {
  status?: string;
  level?: string;
}

// Helper function to send notification emails
const sendNotificationEmail = async (data: {
  type: 'request' | 'approved' | 'rejected';
  expenseId: string;
  expenseDescription: string;
  expenseAmount: number;
  approvalLevel: string;
  requesterName?: string;
  approverName?: string;
  rejectionReason?: string;
  recipientEmail?: string;
  recipientName?: string;
}) => {
  try {
    const { error } = await supabase.functions.invoke('send-approval-notification', {
      body: data
    });
    if (error) {
      console.error('Failed to send notification email:', error);
    }
  } catch (err) {
    console.error('Error sending notification email:', err);
  }
};

// Helper to get user email from profiles
const getUserInfo = async (userId: string): Promise<{ email: string | null; name: string | null }> => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', userId)
    .maybeSingle();
  
  return { 
    email: profile?.email || null, 
    name: profile?.full_name || null 
  };
};

// Helper to get approvers by role with their emails
const getApproversByRole = async (role: string): Promise<Array<{ email: string; name: string; userId: string }>> => {
  const validRole = role as 'admin' | 'conselho' | 'membro' | 'midia' | 'ministro' | 'moderator' | 'servo' | 'tesoureiro' | 'user' | 'visitante';
  
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('role', validRole);
  
  if (!userRoles || userRoles.length === 0) return [];
  
  const userIds = userRoles.map(ur => ur.user_id);
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);
  
  return (profiles || [])
    .filter(p => p.email)
    .map(p => ({ 
      userId: p.id, 
      email: p.email!, 
      name: p.full_name || 'Usuário' 
    }));
};

export const useExpenseApprovals = (options?: UseExpenseApprovalsOptions) => {
  const queryClient = useQueryClient();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['expense-approvals', options],
    queryFn: async () => {
      let query = supabase
        .from('expense_approvals')
        .select(`
          *,
          expense:expense_entries(
            id, description, amount, date, due_date, status, approval_status, supplier_name,
            category:financial_categories(name, icon, color),
            account:financial_accounts(name)
          )
        `)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }
      if (options?.level) {
        query = query.eq('approval_level', options.level);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch user names separately
      const userIds = [...new Set([
        ...data.map(a => a.requested_by).filter(Boolean),
        ...data.map(a => a.approved_by).filter(Boolean)
      ])];
      
      let usersMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        
        usersMap = (profiles || []).reduce((acc, p) => {
          acc[p.id] = p.full_name || 'Usuário';
          return acc;
        }, {} as Record<string, string>);
      }
      
      return data.map(approval => ({
        ...approval,
        requester: approval.requested_by ? { full_name: usersMap[approval.requested_by] || null } : null,
        approver: approval.approved_by ? { full_name: usersMap[approval.approved_by] || null } : null
      })) as ExpenseApproval[];
    }
  });

  const requestApproval = useMutation({
    mutationFn: async ({ 
      expenseId, 
      level, 
      notes,
      expenseDescription,
      expenseAmount
    }: { 
      expenseId: string; 
      level: string; 
      notes?: string;
      expenseDescription?: string;
      expenseAmount?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .insert({
          expense_id: expenseId,
          requested_by: user?.id,
          approval_level: level,
          notes
        });

      if (approvalError) throw approvalError;

      const approvalStatus = level === 'conselho' ? 'pending_conselho' : 'pending_tesoureiro';
      const { error: updateError } = await supabase
        .from('expense_entries')
        .update({ 
          approval_status: approvalStatus,
          requires_approval: true 
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Get requester info
      const requesterInfo = user?.id ? await getUserInfo(user.id) : null;
      
      // Get approvers emails
      const approvers = await getApproversByRole(level);
      
      // Also notify admins
      const admins = await getApproversByRole('admin');
      const allApprovers = [...approvers, ...admins.filter(a => !approvers.some(ap => ap.userId === a.userId))];
      
      // Send notification to each approver
      for (const approver of allApprovers) {
        await sendNotificationEmail({
          type: 'request',
          expenseId,
          expenseDescription: expenseDescription || 'Despesa',
          expenseAmount: expenseAmount || 0,
          approvalLevel: level,
          requesterName: requesterInfo?.name || undefined,
          recipientEmail: approver.email,
          recipientName: approver.name
        });
      }

      return { expenseId, level };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
      toast.success('Solicitação de aprovação enviada');
    },
    onError: (error) => {
      toast.error('Erro ao solicitar aprovação: ' + error.message);
    }
  });

  const approveExpense = useMutation({
    mutationFn: async ({ 
      approvalId, 
      expenseId,
      notes,
      expenseDescription,
      expenseAmount,
      approvalLevel,
      requesterId
    }: { 
      approvalId: string; 
      expenseId: string;
      notes?: string;
      expenseDescription?: string;
      expenseAmount?: number;
      approvalLevel?: string;
      requesterId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          notes
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      const { error: updateError } = await supabase
        .from('expense_entries')
        .update({ approval_status: 'approved' })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Get approver info
      const approverInfo = user?.id ? await getUserInfo(user.id) : null;
      
      // Get requester info and send notification
      if (requesterId) {
        const requesterInfo = await getUserInfo(requesterId);
        
        if (requesterInfo.email) {
          await sendNotificationEmail({
            type: 'approved',
            expenseId,
            expenseDescription: expenseDescription || 'Despesa',
            expenseAmount: expenseAmount || 0,
            approvalLevel: approvalLevel || 'tesoureiro',
            approverName: approverInfo?.name || undefined,
            recipientEmail: requesterInfo.email,
            recipientName: requesterInfo.name || undefined
          });
        }
      }

      return { approvalId, expenseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
      toast.success('Despesa aprovada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao aprovar: ' + error.message);
    }
  });

  const rejectExpense = useMutation({
    mutationFn: async ({ 
      approvalId, 
      expenseId,
      reason,
      expenseDescription,
      expenseAmount,
      approvalLevel,
      requesterId
    }: { 
      approvalId: string; 
      expenseId: string;
      reason: string;
      expenseDescription?: string;
      expenseAmount?: number;
      approvalLevel?: string;
      requesterId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: approvalError } = await supabase
        .from('expense_approvals')
        .update({
          status: 'rejected',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      const { error: updateError } = await supabase
        .from('expense_entries')
        .update({ 
          approval_status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', expenseId);

      if (updateError) throw updateError;

      // Get approver info
      const approverInfo = user?.id ? await getUserInfo(user.id) : null;
      
      // Get requester info and send notification
      if (requesterId) {
        const requesterInfo = await getUserInfo(requesterId);
        
        if (requesterInfo.email) {
          await sendNotificationEmail({
            type: 'rejected',
            expenseId,
            expenseDescription: expenseDescription || 'Despesa',
            expenseAmount: expenseAmount || 0,
            approvalLevel: approvalLevel || 'tesoureiro',
            approverName: approverInfo?.name || undefined,
            rejectionReason: reason,
            recipientEmail: requesterInfo.email,
            recipientName: requesterInfo.name || undefined
          });
        }
      }

      return { approvalId, expenseId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['expense-entries'] });
      toast.success('Despesa rejeitada');
    },
    onError: (error) => {
      toast.error('Erro ao rejeitar: ' + error.message);
    }
  });

  const pendingCount = approvals?.filter(a => a.status === 'pending').length || 0;

  return {
    approvals,
    isLoading,
    requestApproval,
    approveExpense,
    rejectExpense,
    pendingCount
  };
};
