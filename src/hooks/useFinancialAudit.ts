import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLogEntry {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_by: string | null;
  changed_at: string;
  ip_address: string | null;
  user_agent: string | null;
  notes: string | null;
  user?: { full_name: string | null } | null;
}

interface UseFinancialAuditOptions {
  tableName?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  recordId?: string;
}

export const useFinancialAudit = (options?: UseFinancialAuditOptions) => {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['financial-audit', options],
    queryFn: async () => {
      let query = supabase
        .from('financial_audit_log')
        .select('*')
        .order('changed_at', { ascending: false })
        .limit(500);

      if (options?.tableName) {
        query = query.eq('table_name', options.tableName);
      }
      if (options?.action) {
        query = query.eq('action', options.action);
      }
      if (options?.startDate) {
        query = query.gte('changed_at', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('changed_at', options.endDate);
      }
      if (options?.recordId) {
        query = query.eq('record_id', options.recordId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch user names separately
      const userIds = [...new Set(data.map(log => log.changed_by).filter(Boolean))] as string[];
      
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
      
      return data.map(log => ({
        ...log,
        user: log.changed_by ? { full_name: usersMap[log.changed_by] || null } : null
      })) as AuditLogEntry[];
    }
  });

  const getTableLabel = (tableName: string) => {
    const labels: Record<string, string> = {
      'income_entries': 'Entrada',
      'expense_entries': 'Despesa',
      'financial_accounts': 'Conta',
      'expense_approvals': 'Aprovação'
    };
    return labels[tableName] || tableName;
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'INSERT': 'Criação',
      'UPDATE': 'Alteração',
      'DELETE': 'Exclusão'
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'INSERT': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-blue-100 text-blue-800',
      'DELETE': 'bg-red-100 text-red-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  return {
    auditLogs,
    isLoading,
    getTableLabel,
    getActionLabel,
    getActionColor
  };
};
