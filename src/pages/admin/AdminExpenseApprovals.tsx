import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Users
} from 'lucide-react';
import { useExpenseApprovals, ExpenseApproval } from '@/hooks/useExpenseApprovals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminExpenseApprovals = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedApproval, setSelectedApproval] = useState<ExpenseApproval | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const { approvals, isLoading, approveExpense, rejectExpense, pendingCount } = useExpenseApprovals({
    status: activeTab === 'all' ? undefined : activeTab
  });

  const handleApprove = () => {
    if (!selectedApproval) return;
    approveExpense.mutate({
      approvalId: selectedApproval.id,
      expenseId: selectedApproval.expense_id,
      notes,
      expenseDescription: selectedApproval.expense?.description,
      expenseAmount: selectedApproval.expense?.amount,
      approvalLevel: selectedApproval.approval_level,
      requesterId: selectedApproval.requested_by || undefined
    }, {
      onSuccess: () => {
        setSelectedApproval(null);
        setActionType(null);
        setNotes('');
      }
    });
  };

  const handleReject = () => {
    if (!selectedApproval || !rejectionReason.trim()) return;
    rejectExpense.mutate({
      approvalId: selectedApproval.id,
      expenseId: selectedApproval.expense_id,
      reason: rejectionReason,
      expenseDescription: selectedApproval.expense?.description,
      expenseAmount: selectedApproval.expense?.amount,
      approvalLevel: selectedApproval.approval_level,
      requesterId: selectedApproval.requested_by || undefined
    }, {
      onSuccess: () => {
        setSelectedApproval(null);
        setActionType(null);
        setRejectionReason('');
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'tesoureiro':
        return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Tesoureiro</Badge>;
      case 'conselho':
        return <Badge variant="default"><Users className="w-3 h-3 mr-1" />Conselho</Badge>;
      default:
        return <Badge variant="outline">{level}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Aprovações de Despesas</h1>
          <p className="text-muted-foreground">
            Gerencie as solicitações de aprovação de despesas
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive" className="text-lg px-4 py-2">
            <AlertTriangle className="w-4 h-4 mr-2" />
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {approvals?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma aprovação {activeTab === 'pending' ? 'pendente' : 'encontrada'}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {approvals?.map((approval) => (
                <Card key={approval.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {getStatusBadge(approval.status)}
                          {getLevelBadge(approval.approval_level)}
                          {approval.expense?.category && (
                            <Badge variant="outline" style={{ borderColor: approval.expense.category.color }}>
                              {approval.expense.category.name}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-foreground">
                          {approval.expense?.description || 'Despesa'}
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold text-foreground">
                              {formatCurrency(approval.expense?.amount || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(approval.requested_at), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="w-4 h-4" />
                            {approval.requester?.full_name || 'Usuário'}
                          </div>
                          {approval.expense?.supplier_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <FileText className="w-4 h-4" />
                              {approval.expense.supplier_name}
                            </div>
                          )}
                        </div>

                        {approval.notes && (
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                            <strong>Observações:</strong> {approval.notes}
                          </p>
                        )}

                        {approval.rejection_reason && (
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded">
                            <strong>Motivo da rejeição:</strong> {approval.rejection_reason}
                          </p>
                        )}

                        {approval.status !== 'pending' && approval.approver && (
                          <p className="text-sm text-muted-foreground">
                            {approval.status === 'approved' ? 'Aprovado' : 'Rejeitado'} por{' '}
                            <strong>{approval.approver.full_name}</strong> em{' '}
                            {format(new Date(approval.approved_at!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>

                      {approval.status === 'pending' && (
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => {
                              setSelectedApproval(approval);
                              setActionType('approve');
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => {
                              setSelectedApproval(approval);
                              setActionType('reject');
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={actionType === 'approve'} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold">{selectedApproval?.expense?.description}</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(selectedApproval?.expense?.amount || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione observações sobre a aprovação..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancelar
            </Button>
            <Button onClick={handleApprove} disabled={approveExpense.isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === 'reject'} onOpenChange={() => setActionType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold">{selectedApproval?.expense?.description}</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(selectedApproval?.expense?.amount || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Motivo da rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionType(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={rejectExpense.isPending || !rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminExpenseApprovals;
