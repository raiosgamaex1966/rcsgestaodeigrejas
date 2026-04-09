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
import { Users, Search, Filter, Edit, Phone, Mail, Download, UserCheck, UserX, Shield, Crown, User, Mic, Video } from "lucide-react";
import { toast } from "sonner";

type AppRole = 'admin' | 'moderator' | 'user' | 'visitante' | 'membro' | 'servo' | 'ministro' | 'midia' | 'tesoureiro' | 'conselho';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: AppRole;
}

const roleConfig: Record<AppRole, { label: string; color: string; icon: typeof User }> = {
  admin: { label: 'Administrador', color: 'bg-red-500', icon: Crown },
  moderator: { label: 'Moderador', color: 'bg-orange-500', icon: Shield },
  tesoureiro: { label: 'Tesoureiro', color: 'bg-emerald-500', icon: Shield },
  conselho: { label: 'Conselho', color: 'bg-amber-500', icon: Crown },
  ministro: { label: 'Ministro', color: 'bg-purple-500', icon: Mic },
  midia: { label: 'Mídia', color: 'bg-blue-500', icon: Video },
  servo: { label: 'Servo', color: 'bg-green-500', icon: UserCheck },
  membro: { label: 'Membro', color: 'bg-indigo-500', icon: User },
  user: { label: 'Usuário', color: 'bg-gray-500', icon: User },
  visitante: { label: 'Visitante', color: 'bg-gray-400', icon: UserX },
};

const AdminMembers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', phone: '', role: '' as AppRole });

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ['admin-user-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Profile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles'] });
      toast.success('Perfil atualizado!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-roles'] });
      toast.success('Papel atualizado!');
    },
    onError: (error) => toast.error('Erro: ' + error.message),
  });

  const getUserRole = (userId: string): AppRole => {
    return userRoles?.find(r => r.user_id === userId)?.role || 'user';
  };

  const handleEdit = (member: Profile) => {
    setSelectedMember(member);
    setEditForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: getUserRole(member.id),
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMember) return;

    const updates = {
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone
    };

    updateProfile.mutate({
      id: selectedMember.id,
      updates,
    });

    if (editForm.role !== getUserRole(selectedMember.id)) {
      updateRole.mutate({ userId: selectedMember.id, role: editForm.role });
    }

    setIsEditOpen(false);
  };

  const exportCSV = () => {
    if (!profiles) return;

    const headers = ['Nome', 'Email', 'Telefone', 'Papel', 'Cadastro'];
    const rows = profiles.map(p => [
      p.full_name || '',
      p.email || '',
      p.phone || '',
      roleConfig[getUserRole(p.id)]?.label || '',
      new Date(p.created_at).toLocaleDateString('pt-BR'),
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `membros-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Lista exportada!');
  };

  const filteredProfiles = profiles?.filter(p => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search);
    const matchRole = roleFilter === 'all' || getUserRole(p.id) === roleFilter;
    return matchSearch && matchRole;
  });

  const isLoading = loadingProfiles || loadingRoles;

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
          <h1 className="text-2xl font-bold text-foreground">Gestão de Membros</h1>
          <p className="text-muted-foreground">{profiles?.length || 0} membros cadastrados</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os papéis</SelectItem>
                {Object.entries(roleConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Membros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProfiles?.map((member) => {
                const role = getUserRole(member.id);
                const config = roleConfig[role];
                const Icon = config?.icon || User;

                return (
                  <div key={member.id} className="p-4 rounded-xl border border-border/50 bg-card/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12 border-2 border-primary/10">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                            {member.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-foreground">{member.full_name || 'Sem nome'}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.phone || 'Sem telefone'}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} className="shrink-0 h-9 w-9">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border/30">
                      <Badge variant="secondary" className={`${config?.color} text-white text-[10px] px-2 py-0 border-none`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config?.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        Cadastrado em {new Date(member.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {filteredProfiles?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado.
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membro</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefone</TableHead>
                    <TableHead className="text-center">Papel</TableHead>
                    <TableHead className="hidden md:table-cell">Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((member) => {
                    const role = getUserRole(member.id);
                    const config = roleConfig[role];
                    const Icon = config?.icon || User;

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback>
                                {member.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.full_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground sm:hidden">
                                {member.phone || 'Sem telefone'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {member.phone || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="secondary" className={`${config?.color} text-white w-fit`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {config?.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>Atualize as informações do membro</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@exemplo.com"
              />
              <p className="text-xs text-muted-foreground">
                Importante para notificações de aprovação de despesas
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </Label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select
                value={editForm.role}
                onValueChange={(v) => setEditForm(prev => ({ ...prev, role: v as AppRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleConfig).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveEdit}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMembers;
