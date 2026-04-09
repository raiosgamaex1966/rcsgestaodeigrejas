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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Home, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  MapPin, 
  Clock, 
  Calendar,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { MemberProfile } from "@/hooks/useMembers";

interface Cell {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  co_leader_id: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  is_active: boolean;
  created_at: string;
  leader?: MemberProfile;
  co_leader?: MemberProfile;
  members_count?: number;
}

interface CellMember {
  id: string;
  cell_id: string;
  member_id: string;
  role: string;
  is_active: boolean;
  member?: MemberProfile;
}

const DAYS_OF_WEEK = [
  { value: 'domingo', label: 'Domingo' },
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
];

const AdminCells = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_id: '',
    co_leader_id: '',
    address: '',
    neighborhood: '',
    city: '',
    meeting_day: '',
    meeting_time: '',
  });

  // Fetch cells
  const { data: cells, isLoading } = useQuery({
    queryKey: ['admin-cells'],
    queryFn: async () => {
      const { data: cellsData, error } = await supabase
        .from('cells')
        .select('*')
        .order('name');
      if (error) throw error;

      // Get leaders info
      const leaderIds = [...new Set(cellsData.flatMap(c => [c.leader_id, c.co_leader_id].filter(Boolean)))];
      let leaders: MemberProfile[] = [];
      if (leaderIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', leaderIds);
        leaders = data || [];
      }

      // Get member counts
      const { data: membersCount } = await supabase
        .from('cell_members')
        .select('cell_id')
        .eq('is_active', true);

      const countMap = membersCount?.reduce((acc, m) => {
        acc[m.cell_id] = (acc[m.cell_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return cellsData.map(cell => ({
        ...cell,
        leader: leaders.find(l => l.id === cell.leader_id),
        co_leader: leaders.find(l => l.id === cell.co_leader_id),
        members_count: countMap[cell.id] || 0,
      })) as Cell[];
    },
  });

  // Fetch all members for selection
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

  // Fetch cell members when a cell is selected
  const { data: cellMembers } = useQuery({
    queryKey: ['cell-members', selectedCell?.id],
    queryFn: async () => {
      if (!selectedCell) return [];
      const { data, error } = await supabase
        .from('cell_members')
        .select('*')
        .eq('cell_id', selectedCell.id)
        .eq('is_active', true);
      if (error) throw error;

      const memberIds = data.map(m => m.member_id);
      let members: MemberProfile[] = [];
      if (memberIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', memberIds);
        members = profilesData || [];
      }

      return data.map(cm => ({
        ...cm,
        member: members.find(m => m.id === cm.member_id),
      })) as CellMember[];
    },
    enabled: !!selectedCell && isMembersOpen,
  });

  // Create/Update cell
  const saveCellMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const cellData = {
        name: data.name,
        description: data.description || null,
        leader_id: data.leader_id || null,
        co_leader_id: data.co_leader_id || null,
        address: data.address || null,
        neighborhood: data.neighborhood || null,
        city: data.city || null,
        meeting_day: data.meeting_day || null,
        meeting_time: data.meeting_time || null,
      };

      if (data.id) {
        const { error } = await supabase.from('cells').update(cellData).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cells').insert(cellData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cells'] });
      toast.success(selectedCell ? 'Célula atualizada!' : 'Célula criada!');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  // Delete cell
  const deleteCellMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cells').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cells'] });
      toast.success('Célula excluída!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  // Add member to cell
  const addMemberMutation = useMutation({
    mutationFn: async ({ cellId, memberId }: { cellId: string; memberId: string }) => {
      const { error } = await supabase.from('cell_members').insert({
        cell_id: cellId,
        member_id: memberId,
        role: 'participante',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cell-members', selectedCell?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-cells'] });
      toast.success('Membro adicionado!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  // Remove member from cell
  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cell_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cell-members', selectedCell?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-cells'] });
      toast.success('Membro removido!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      leader_id: '',
      co_leader_id: '',
      address: '',
      neighborhood: '',
      city: '',
      meeting_day: '',
      meeting_time: '',
    });
    setSelectedCell(null);
  };

  const handleEdit = (cell: Cell) => {
    setSelectedCell(cell);
    setFormData({
      name: cell.name,
      description: cell.description || '',
      leader_id: cell.leader_id || '',
      co_leader_id: cell.co_leader_id || '',
      address: cell.address || '',
      neighborhood: cell.neighborhood || '',
      city: cell.city || '',
      meeting_day: cell.meeting_day || '',
      meeting_time: cell.meeting_time || '',
    });
    setIsFormOpen(true);
  };

  const handleManageMembers = (cell: Cell) => {
    setSelectedCell(cell);
    setIsMembersOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    saveCellMutation.mutate({ ...formData, id: selectedCell?.id });
  };

  const filteredCells = cells?.filter(c => {
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) ||
           c.neighborhood?.toLowerCase().includes(search.toLowerCase()) ||
           c.leader?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const availableMembersToAdd = allMembers?.filter(m => 
    !cellMembers?.some(cm => cm.member_id === m.id)
  );

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
          <h1 className="text-2xl font-bold text-foreground">Células</h1>
          <p className="text-muted-foreground">{cells?.length || 0} células cadastradas</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Célula
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Home className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{cells?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Células</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cells?.reduce((acc, c) => acc + (c.members_count || 0), 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total de Participantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {cells?.filter(c => c.is_active).length || 0}
                </p>
                <p className="text-xs text-muted-foreground">Células Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bairro ou líder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cells List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCells?.map((cell) => (
          <Card key={cell.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{cell.name}</CardTitle>
                  {cell.neighborhood && (
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      {cell.neighborhood}{cell.city && `, ${cell.city}`}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={cell.is_active ? "default" : "secondary"}>
                  {cell.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {cell.meeting_day && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {DAYS_OF_WEEK.find(d => d.value === cell.meeting_day)?.label}
                  {cell.meeting_time && ` às ${cell.meeting_time.slice(0, 5)}`}
                </div>
              )}
              
              {cell.leader && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={cell.leader.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {cell.leader.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Líder: {cell.leader.full_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{cell.members_count || 0} participantes</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleManageMembers(cell)}>
                  <Users className="w-4 h-4 mr-1" />
                  Membros
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(cell)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => deleteCellMutation.mutate(cell.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCell ? 'Editar Célula' : 'Nova Célula'}</DialogTitle>
            <DialogDescription>Preencha os dados da célula</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Nome da Célula *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Célula Família"
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição da célula..."
              />
            </div>

            <div className="space-y-2">
              <Label>Líder</Label>
              <Select 
                value={formData.leader_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, leader_id: v }))}
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
              <Label>Co-líder</Label>
              <Select 
                value={formData.co_leader_id} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, co_leader_id: v }))}
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

            <div className="space-y-2 md:col-span-2">
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, número"
              />
            </div>

            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input
                value={formData.neighborhood}
                onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Dia de Reunião</Label>
              <Select 
                value={formData.meeting_day} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, meeting_day: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_time: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Membros da Célula: {selectedCell?.name}</DialogTitle>
            <DialogDescription>Gerencie os participantes</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            {/* Add member */}
            <div className="flex gap-2">
              <Select onValueChange={(v) => selectedCell && addMemberMutation.mutate({ cellId: selectedCell.id, memberId: v })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Adicionar membro..." />
                </SelectTrigger>
                <SelectContent>
                  {availableMembersToAdd?.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Members list */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cellMembers?.map((cm) => (
                  <div key={cm.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={cm.member?.avatar_url || undefined} />
                        <AvatarFallback>{cm.member?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{cm.member?.full_name}</p>
                        <Badge variant="outline" className="text-xs">{cm.role}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => removeMemberMutation.mutate(cm.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {cellMembers?.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum membro nesta célula
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCells;
