import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  HeartHandshake, 
  Plus, 
  Search, 
  Edit, 
  Filter,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone
} from "lucide-react";
import { toast } from "sonner";
import { MemberProfile } from "@/hooks/useMembers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PastoralCare {
  id: string;
  member_id: string;
  attended_by: string | null;
  reason: string;
  description: string | null;
  date: string;
  follow_up_date: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  member?: MemberProfile;
  attendant?: MemberProfile;
}

const REASONS = [
  { value: 'casamento', label: 'Casamento' },
  { value: 'familia', label: 'Família' },
  { value: 'trabalho', label: 'Trabalho' },
  { value: 'financas', label: 'Finanças' },
  { value: 'saude', label: 'Saúde' },
  { value: 'espiritual', label: 'Espiritual' },
  { value: 'luto', label: 'Luto' },
  { value: 'aconselhamento', label: 'Aconselhamento' },
  { value: 'outro', label: 'Outro' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  open: { label: 'Aberto', color: 'bg-amber-500', icon: AlertCircle },
  in_progress: { label: 'Em andamento', color: 'bg-blue-500', icon: Clock },
  closed: { label: 'Concluído', color: 'bg-emerald-500', icon: CheckCircle },
};

const AdminPastoralCare = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCare, setSelectedCare] = useState<PastoralCare | null>(null);
  const [formData, setFormData] = useState({
    member_id: '',
    attended_by: '',
    reason: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    follow_up_date: '',
    status: 'open',
    notes: '',
  });

  const { data: cares, isLoading } = useQuery({
    queryKey: ['admin-pastoral-care'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pastoral_care')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;

      const memberIds = [...new Set(data.flatMap(c => [c.member_id, c.attended_by].filter(Boolean)))];
      let members: MemberProfile[] = [];
      if (memberIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', memberIds);
        members = profilesData || [];
      }

      return data.map(care => ({
        ...care,
        member: members.find(m => m.id === care.member_id),
        attendant: members.find(m => m.id === care.attended_by),
      })) as PastoralCare[];
    },
  });

  const { data: allMembers } = useQuery({
    queryKey: ['all-members-select'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as MemberProfile[];
    },
  });

  const saveCareMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const careData = {
        member_id: data.member_id,
        attended_by: data.attended_by || null,
        reason: data.reason,
        description: data.description || null,
        date: data.date,
        follow_up_date: data.follow_up_date || null,
        status: data.status,
        notes: data.notes || null,
      };

      if (data.id) {
        const { error } = await supabase.from('pastoral_care').update(careData).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pastoral_care').insert(careData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pastoral-care'] });
      toast.success(selectedCare ? 'Atendimento atualizado!' : 'Atendimento registrado!');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const resetForm = () => {
    setFormData({
      member_id: '',
      attended_by: '',
      reason: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      follow_up_date: '',
      status: 'open',
      notes: '',
    });
    setSelectedCare(null);
  };

  const handleEdit = (care: PastoralCare) => {
    setSelectedCare(care);
    setFormData({
      member_id: care.member_id,
      attended_by: care.attended_by || '',
      reason: care.reason,
      description: care.description || '',
      date: care.date,
      follow_up_date: care.follow_up_date || '',
      status: care.status,
      notes: care.notes || '',
    });
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!formData.member_id || !formData.reason) {
      toast.error('Membro e motivo são obrigatórios');
      return;
    }
    saveCareMutation.mutate({ ...formData, id: selectedCare?.id });
  };

  const filteredCares = cares?.filter(c => {
    const matchSearch = !search || 
      c.member?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.attendant?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchReason = reasonFilter === 'all' || c.reason === reasonFilter;
    return matchSearch && matchStatus && matchReason;
  });

  // Stats
  const openCount = cares?.filter(c => c.status === 'open').length || 0;
  const inProgressCount = cares?.filter(c => c.status === 'in_progress').length || 0;
  const closedCount = cares?.filter(c => c.status === 'closed').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Atendimento Pastoral</h1>
          <p className="text-muted-foreground">{cares?.length || 0} atendimentos registrados</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Atendimento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <HeartHandshake className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cares?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{openCount}</p>
                <p className="text-xs text-muted-foreground">Abertos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCount}</p>
                <p className="text-xs text-muted-foreground">Em andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{closedCount}</p>
                <p className="text-xs text-muted-foreground">Concluídos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5" />
            Lista de Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membro</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="hidden sm:table-cell">Atendido por</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCares?.map((care) => {
                  const statusConfig = STATUS_CONFIG[care.status];
                  const StatusIcon = statusConfig?.icon || AlertCircle;
                  const reasonLabel = REASONS.find(r => r.value === care.reason)?.label || care.reason;
                  
                  return (
                    <TableRow key={care.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={care.member?.avatar_url || undefined} />
                            <AvatarFallback>
                              {care.member?.full_name?.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{care.member?.full_name}</p>
                            {care.member?.phone && (
                              <a 
                                href={`https://wa.me/55${care.member.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3" />
                                {care.member.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{reasonLabel}</Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {care.attendant?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(care.date), "dd/MM/yy", { locale: ptBR })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusConfig?.color} text-white`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(care)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredCares?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum atendimento encontrado
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCare ? 'Editar Atendimento' : 'Novo Atendimento'}</DialogTitle>
            <DialogDescription>Registre o atendimento pastoral</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Membro Atendido *</Label>
              <Select 
                value={formData.member_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, member_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Atendido por</Label>
              <Select 
                value={formData.attended_by} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, attended_by: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {allMembers?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select 
                value={formData.reason} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, reason: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map(r => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data do Atendimento</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Follow-up</Label>
              <Input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => setFormData(prev => ({ ...prev, follow_up_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Descrição do Atendimento</Label>
              <Textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o atendimento..."
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Notas Privadas</Label>
              <Textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações internas..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPastoralCare;
