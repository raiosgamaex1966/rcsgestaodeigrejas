import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  History, 
  Filter, 
  Eye, 
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  FileText,
  ArrowRight,
  Search
} from 'lucide-react';
import { useFinancialAudit, AuditLogEntry } from '@/hooks/useFinancialAudit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const AdminFinancialAudit = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [tableName, setTableName] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const { auditLogs, isLoading, getTableLabel, getActionLabel, getActionColor } = useFinancialAudit({
    tableName: tableName || undefined,
    action: action || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  });

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') {
      if (value > 100) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
      }
      return value.toString();
    }
    if (typeof value === 'string') {
      // Try to parse as date
      if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
        try {
          return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: ptBR });
        } catch {
          return value;
        }
      }
      return value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getChangedFields = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData || !newData) return [];
    
    const changes: { field: string; oldValue: unknown; newValue: unknown }[] = [];
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    
    allKeys.forEach(key => {
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes.push({
          field: key,
          oldValue: oldData[key],
          newValue: newData[key]
        });
      }
    });
    
    return changes;
  };

  const fieldLabels: Record<string, string> = {
    description: 'Descrição',
    amount: 'Valor',
    date: 'Data',
    due_date: 'Vencimento',
    status: 'Status',
    approval_status: 'Status de Aprovação',
    category_id: 'Categoria',
    account_id: 'Conta',
    supplier_name: 'Fornecedor',
    payment_method: 'Forma de Pagamento',
    contributor_name: 'Contribuinte',
    notes: 'Observações',
    paid_at: 'Pago em',
    requires_approval: 'Requer Aprovação',
    name: 'Nome',
    current_balance: 'Saldo Atual',
    initial_balance: 'Saldo Inicial'
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria Financeira</h1>
          <p className="text-muted-foreground">
            Histórico completo de todas as alterações financeiras
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <History className="w-4 h-4 mr-2" />
          {auditLogs?.length || 0} registros
        </Badge>
      </div>

      {/* Filters */}
      <Collapsible open={showFilters} onOpenChange={setShowFilters}>
        <Card>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filtros
                </div>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Tabela</Label>
                  <Select value={tableName} onValueChange={setTableName}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="income_entries">Entradas</SelectItem>
                      <SelectItem value="expense_entries">Despesas</SelectItem>
                      <SelectItem value="financial_accounts">Contas</SelectItem>
                      <SelectItem value="expense_approvals">Aprovações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ação</Label>
                  <Select value={action} onValueChange={setAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="INSERT">Criação</SelectItem>
                      <SelectItem value="UPDATE">Alteração</SelectItem>
                      <SelectItem value="DELETE">Exclusão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data inicial</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data final</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setTableName('');
                    setAction('');
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Audit Log List */}
      {auditLogs?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum registro encontrado</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {auditLogs?.map((log) => {
            const changes = log.action === 'UPDATE' ? getChangedFields(log.old_data, log.new_data) : [];
            
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <Badge variant="outline">
                          <FileText className="w-3 h-3 mr-1" />
                          {getTableLabel(log.table_name)}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          #{log.record_id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(log.changed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.user?.full_name || 'Sistema'}
                        </div>
                      </div>

                      {log.action === 'UPDATE' && changes.length > 0 && (
                        <div className="bg-muted/50 rounded p-3 space-y-1">
                          {changes.slice(0, 3).map((change, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-foreground min-w-[100px]">
                                {fieldLabels[change.field] || change.field}:
                              </span>
                              <span className="text-muted-foreground line-through">
                                {formatValue(change.oldValue)}
                              </span>
                              <ArrowRight className="w-3 h-3 text-muted-foreground" />
                              <span className="text-foreground font-medium">
                                {formatValue(change.newValue)}
                              </span>
                            </div>
                          ))}
                          {changes.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{changes.length - 3} outras alterações
                            </p>
                          )}
                        </div>
                      )}

                      {log.action === 'INSERT' && log.new_data && (
                        <p className="text-sm text-muted-foreground">
                          {(log.new_data as Record<string, unknown>).description as string || 
                           (log.new_data as Record<string, unknown>).name as string || 
                           'Novo registro criado'}
                        </p>
                      )}

                      {log.action === 'DELETE' && log.old_data && (
                        <p className="text-sm text-red-600">
                          Excluído: {(log.old_data as Record<string, unknown>).description as string || 
                                     (log.old_data as Record<string, unknown>).name as string || 
                                     'Registro removido'}
                        </p>
                      )}
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Detalhes do Registro
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Ação</Label>
                    <Badge className={getActionColor(selectedLog.action)}>
                      {getActionLabel(selectedLog.action)}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Tabela</Label>
                    <p className="font-medium">{getTableLabel(selectedLog.table_name)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Data/Hora</Label>
                    <p className="font-medium">
                      {format(new Date(selectedLog.changed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Usuário</Label>
                    <p className="font-medium">{selectedLog.user?.full_name || 'Sistema'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">ID do Registro</Label>
                    <p className="font-mono text-sm">{selectedLog.record_id}</p>
                  </div>
                </div>

                {selectedLog.old_data && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Dados Anteriores</Label>
                    <pre className="bg-red-50 dark:bg-red-950/20 p-4 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_data && (
                  <div>
                    <Label className="text-muted-foreground mb-2 block">Dados Novos</Label>
                    <pre className="bg-green-50 dark:bg-green-950/20 p-4 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancialAudit;
