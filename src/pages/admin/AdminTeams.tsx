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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  UsersRound, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  Palette
} from "lucide-react";
import { toast } from "sonner";
import { MemberProfile } from "@/hooks/useMembers";

interface Team {
  id: string;
  name: string;
  description: string | null;
  leader_id: string | null;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  leader?: MemberProfile;
  members_count?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  member_id: string;
  role: string;
  is_active: boolean;
  member?: MemberProfile;
}

const TEAM_COLORS = [
  { value: '#6366f1', label: 'Índigo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f59e0b', label: 'Âmbar' },
  { value: '#10b981', label: 'Esmeralda' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#14b8a6', label: 'Teal' },
];

const AdminTeams = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    leader_id: '',
    color: '#6366f1',
  });

  // Fetch teams
  const { data: teams, isLoading } = useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      if (error) throw error;

      const leaderIds = teamsData.map(t => t.leader_id).filter(Boolean) as string[];
      let leaders: MemberProfile[] = [];
      if (leaderIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('id', leaderIds);
        leaders = data || [];
      }

      const { data: membersCount } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('is_active', true);

      const countMap = membersCount?.reduce((acc, m) => {
        acc[m.team_id] = (acc[m.team_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      return teamsData.map(team => ({
        ...team,
        leader: leaders.find(l => l.id === team.leader_id),
        members_count: countMap[team.id] || 0,
      })) as Team[];
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

  const { data: teamMembers } = useQuery({
    queryKey: ['team-members', selectedTeam?.id],
    queryFn: async () => {
      if (!selectedTeam) return [];
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', selectedTeam.id)
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

      return data.map(tm => ({
        ...tm,
        member: members.find(m => m.id === tm.member_id),
      })) as TeamMember[];
    },
    enabled: !!selectedTeam && isMembersOpen,
  });

  const saveTeamMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const teamData = {
        name: data.name,
        description: data.description || null,
        leader_id: data.leader_id || null,
        color: data.color,
      };

      if (data.id) {
        const { error } = await supabase.from('teams').update(teamData).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('teams').insert(teamData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success(selectedTeam ? 'Equipe atualizada!' : 'Equipe criada!');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Equipe excluída!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ teamId, memberId }: { teamId: string; memberId: string }) => {
      const { error } = await supabase.from('team_members').insert({
        team_id: teamId,
        member_id: memberId,
        role: 'membro',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Membro adicionado!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members', selectedTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-teams'] });
      toast.success('Membro removido!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const resetForm = () => {
    setFormData({ name: '', description: '', leader_id: '', color: '#6366f1' });
    setSelectedTeam(null);
  };

  const handleEdit = (team: Team) => {
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || '',
      leader_id: team.leader_id || '',
      color: team.color || '#6366f1',
    });
    setIsFormOpen(true);
  };

  const handleManageMembers = (team: Team) => {
    setSelectedTeam(team);
    setIsMembersOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    saveTeamMutation.mutate({ ...formData, id: selectedTeam?.id });
  };

  const filteredTeams = teams?.filter(t => {
    if (!search) return true;
    return t.name.toLowerCase().includes(search.toLowerCase()) ||
           t.leader?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  const availableMembersToAdd = allMembers?.filter(m => 
    !teamMembers?.some(tm => tm.member_id === m.id)
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
          <h1 className="text-2xl font-bold text-foreground">Equipes/Ministérios</h1>
          <p className="text-muted-foreground">{teams?.length || 0} equipes cadastradas</p>
        </div>
        <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <UsersRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{teams?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Total de Equipes</p>
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
                  {teams?.reduce((acc, t) => acc + (t.members_count || 0), 0) || 0}
                </p>
                <p className="text-xs text-muted-foreground">Total de Membros</p>
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
              placeholder="Buscar por nome ou líder..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams?.map((team) => (
          <Card key={team.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <div className="h-2" style={{ backgroundColor: team.color || '#6366f1' }} />
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{team.name}</CardTitle>
                <Badge variant={team.is_active ? "default" : "secondary"}>
                  {team.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {team.description && (
                <CardDescription className="line-clamp-2">
                  {team.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {team.leader && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={team.leader.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {team.leader.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Líder: {team.leader.full_name}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{team.members_count || 0} membros</span>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleManageMembers(team)}>
                  <Users className="w-4 h-4 mr-1" />
                  Membros
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(team)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => deleteTeamMutation.mutate(team.id)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedTeam ? 'Editar Equipe' : 'Nova Equipe'}</DialogTitle>
            <DialogDescription>Preencha os dados da equipe</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nome da Equipe *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Louvor, Mídia, Recepção..."
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do ministério..."
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
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor
              </Label>
              <div className="flex gap-2 flex-wrap">
                {TEAM_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setFormData(prev => ({ ...prev, color: c.value }))}
                    title={c.label}
                  />
                ))}
              </div>
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
            <DialogTitle>Membros: {selectedTeam?.name}</DialogTitle>
            <DialogDescription>Gerencie os membros da equipe</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Select onValueChange={(v) => selectedTeam && addMemberMutation.mutate({ teamId: selectedTeam.id, memberId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Adicionar membro..." />
              </SelectTrigger>
              <SelectContent>
                {availableMembersToAdd?.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {teamMembers?.map((tm) => (
                  <div key={tm.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={tm.member?.avatar_url || undefined} />
                        <AvatarFallback>{tm.member?.full_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{tm.member?.full_name}</p>
                        <Badge variant="outline" className="text-xs">{tm.role}</Badge>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => removeMemberMutation.mutate(tm.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {teamMembers?.length === 0 && (
                  <p className="text-center py-8 text-muted-foreground">
                    Nenhum membro nesta equipe
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

export default AdminTeams;
