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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, Search, Filter, Edit, Phone, Mail, Download, UserCheck, UserX,
  Shield, Crown, User, Mic, Video, MapPin, Calendar, Heart, Droplets, Briefcase,
  Trash2, UserPlus, Lock
} from "lucide-react";
import { toast } from "sonner";
import { MemberProfile, useCreateMember, useDeleteMember } from "@/hooks/useMembers";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

type AppRole = 'admin' | 'moderator' | 'user' | 'visitante' | 'membro' | 'servo' | 'ministro' | 'midia' | 'tesoureiro' | 'conselho';

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
};

const memberTypeConfig: Record<string, { label: string; color: string }> = {
  membro: { label: 'Membro', color: 'bg-emerald-500' },
  novo_convertido: { label: 'Novo Convertido', color: 'bg-pink-500' },
};

const genderOptions = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'O', label: 'Outro' },
];

const maritalStatusOptions = [
  { value: 'Solteiro', label: 'Solteiro(a)' },
  { value: 'Casado', label: 'Casado(a)' },
  { value: 'Viúvo', label: 'Viúvo(a)' },
  { value: 'Divorciado', label: 'Divorciado(a)' },
];

const brazilianStates = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO'
];

const AdminMembersList = () => {
  const queryClient = useQueryClient();
  const { tenant } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [memberTypeFilter, setMemberTypeFilter] = useState<string>('all');
  const [selectedMember, setSelectedMember] = useState<MemberProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const createMember = useCreateMember();
  const deleteMember = useDeleteMember();

  const [editForm, setEditForm] = useState<Partial<MemberProfile> & { role: AppRole }>({
    full_name: '',
    email: '',
    phone: '',
    role: 'user',
    birth_date: '',
    gender: '',
    marital_status: '',
    wedding_date: '',
    baptism_date: '',
    conversion_date: '',
    member_since: '',
    address_street: '',
    address_number: '',
    address_complement: '',
    address_neighborhood: '',
    address_city: '',
    address_state: '',
    address_zip: '',
    member_type: 'visitante',
    matricula: '',
    notes: '',
    profession: '',
    password: '',
    trialDays: 4,
  });

  const { data: profiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin-profiles-full', tenant?.slug],
    queryFn: async () => {
      if (!tenant) return [];
      // Buscar só perfis do tenant atual, aprovados
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenant.slug)
        .maybeSingle();

      if (!tenantData) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MemberProfile[];
    },
    enabled: !!tenant,
  });

  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ['admin-user-roles', tenant?.slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');
      if (error) throw error;
      return data as UserRole[];
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<MemberProfile> }) => {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profiles-full'] });
      queryClient.invalidateQueries({ queryKey: ['members-all'] });
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

  const handleEdit = (member: MemberProfile) => {
    setSelectedMember(member);
    setEditForm({
      full_name: member.full_name || '',
      email: member.email || '',
      phone: member.phone || '',
      role: getUserRole(member.id),
      birth_date: member.birth_date || '',
      gender: member.gender || '',
      marital_status: member.marital_status || '',
      wedding_date: member.wedding_date || '',
      baptism_date: member.baptism_date || '',
      conversion_date: member.conversion_date || '',
      member_since: member.member_since || '',
      address_street: member.address_street || '',
      address_number: member.address_number || '',
      address_complement: member.address_complement || '',
      address_neighborhood: member.address_neighborhood || '',
      address_city: member.address_city || '',
      address_state: member.address_state || '',
      address_zip: member.address_zip || '',
      member_type: member.member_type || 'membro',
      matricula: member.matricula || '',
      notes: member.notes || '',
      profession: member.profession || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!selectedMember) return;

    const { role, ...profileUpdates } = editForm;

    // Convert empty date strings to null to avoid PostgreSQL error
    const dateFields = ['birth_date', 'wedding_date', 'baptism_date', 'conversion_date', 'member_since'];
    dateFields.forEach(field => {
      if (profileUpdates[field as keyof typeof profileUpdates] === '') {
        (profileUpdates as any)[field] = null;
      }
    });

    updateProfile.mutate({
      id: selectedMember.id,
      updates: profileUpdates as Partial<MemberProfile>,
    });

    if (role !== getUserRole(selectedMember.id)) {
      updateRole.mutate({ userId: selectedMember.id, role });
    }

    setIsEditOpen(false);
  };

  const handleCreateMember = async () => {
    if (!editForm.email || !editForm.full_name) {
      toast.error('Nome e Email são obrigatórios para o convite');
      return;
    }

    try {
      await createMember.mutateAsync({
        email: editForm.email,
        full_name: editForm.full_name,
        role: editForm.role || 'user',
        password: editForm.password,
        trialDays: editForm.trialDays
      });
      setIsCreateOpen(false);
      resetForm();
    } catch (error) {
      // Error handled in mutation
    }
  };

  const resetForm = () => {
    setEditForm({
      full_name: '',
      email: '',
      phone: '',
      role: 'user',
      birth_date: '',
      gender: '',
      marital_status: '',
      wedding_date: '',
      baptism_date: '',
      conversion_date: '',
      member_since: '',
      address_street: '',
      address_number: '',
      address_complement: '',
      address_neighborhood: '',
      address_city: '',
      address_state: '',
      address_zip: '',
      member_type: 'membro',
      matricula: '',
      notes: '',
      profession: '',
      password: '',
      trialDays: 4,
    });
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const confirmDelete = (id: string) => {
    setMemberToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (memberToDelete) {
      await deleteMember.mutateAsync(memberToDelete);
      setIsDeleteConfirmOpen(false);
      setMemberToDelete(null);
    }
  };

  const exportCSV = () => {
    if (!profiles) return;

    const headers = ['Nome', 'Email', 'Telefone', 'Tipo', 'Papel', 'Cidade', 'Cadastro'];
    const rows = profiles.map(p => [
      p.full_name || '',
      p.email || '',
      p.phone || '',
      memberTypeConfig[p.member_type || 'visitante']?.label || '',
      roleConfig[getUserRole(p.id)]?.label || '',
      p.address_city || '',
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
      p.phone?.includes(search) ||
      p.address_city?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || getUserRole(p.id) === roleFilter;
    const matchMemberType = memberTypeFilter === 'all' || p.member_type === memberTypeFilter;
    return matchSearch && matchRole && matchMemberType;
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
          <h1 className="text-2xl font-bold text-foreground">Membros Aprovados</h1>
          <p className="text-muted-foreground">{profiles?.length || 0} pessoas cadastradas</p>
        </div>
        <div className="flex gap-2 text-sm">
          <Button variant="secondary" onClick={() => {
             const url = `${window.location.origin}/${tenant?.slug}/join`;
             navigator.clipboard.writeText(url);
             toast.success("Link de convite copiado!");
          }}>
            <UserPlus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Convidar Link</span>
          </Button>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button onClick={openCreateModal}>
            <UserPlus className="w-4 h-4 mr-2" />
            Incluir Membro
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={memberTypeFilter} onValueChange={setMemberTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo de membro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(memberTypeConfig).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            Membros Aprovados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredProfiles?.map((member) => {
                const role = getUserRole(member.id);
                const roleData = roleConfig[role];
                const memberTypeData = memberTypeConfig[member.member_type || 'visitante'];

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
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {member.address_city || 'Cidade não inf.'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(member)} className="h-9 w-9">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(member.id)} className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        {member.phone || 'Sem telefone'}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/80">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{member.email || 'Sem email'}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                      <Badge variant="secondary" className={cn(memberTypeData?.color, "text-white text-[10px] px-2 py-0")}>
                        {memberTypeData?.label}
                      </Badge>
                      <Badge variant="outline" className={cn(roleData?.color, "text-white border-none text-[10px] px-2 py-0")}>
                        {roleData?.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {filteredProfiles?.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum membro encontrado com estes filtros.
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
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Papel</TableHead>
                    <TableHead className="hidden md:table-cell">Cidade</TableHead>
                    <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((member) => {
                    const role = getUserRole(member.id);
                    const roleData = roleConfig[role];
                    const memberTypeData = memberTypeConfig[member.member_type || 'visitante'];

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
                            <Badge variant="secondary" className={`${memberTypeData?.color} text-white w-fit`}>
                              {memberTypeData?.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant="outline" className={`${roleData?.color} text-white w-fit border-none`}>
                              {roleData?.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {member.address_city || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {new Date(member.created_at).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(member)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => confirmDelete(member.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
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

      {/* Modal de Edição Expandido */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Membro</DialogTitle>
            <DialogDescription>Atualize as informações completas do membro</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Pessoal</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="church">Igreja</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            {/* Tab Dados Pessoais */}
            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input
                    value={editForm.full_name || ''}
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
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data de Nascimento
                  </Label>
                  <Input
                    type="date"
                    value={editForm.birth_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, birth_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gênero</Label>
                  <Select
                    value={editForm.gender || ''}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, gender: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado Civil</Label>
                  <Select
                    value={editForm.marital_status || ''}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, marital_status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {maritalStatusOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Profissão
                  </Label>
                  <Input
                    value={editForm.profession || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, profession: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel no Sistema</Label>
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
              </div>
            </TabsContent>

            {/* Tab Endereço */}
            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Rua/Avenida
                  </Label>
                  <Input
                    value={editForm.address_street || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_street: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={editForm.address_number || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_number: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={editForm.address_complement || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_complement: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={editForm.address_neighborhood || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_neighborhood: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={editForm.address_city || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={editForm.address_state || ''}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, address_state: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={editForm.address_zip || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_zip: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab Igreja */}
            <TabsContent value="church" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Membro</Label>
                  <Select
                    value={editForm.member_type || 'visitante'}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, member_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(memberTypeConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input
                    value={editForm.matricula || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    Data de Conversão
                  </Label>
                  <Input
                    type="date"
                    value={editForm.conversion_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, conversion_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    Data de Batismo
                  </Label>
                  <Input
                    type="date"
                    value={editForm.baptism_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, baptism_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Membro desde</Label>
                  <Input
                    type="date"
                    value={editForm.member_since || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, member_since: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Casamento</Label>
                  <Input
                    type="date"
                    value={editForm.wedding_date || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, wedding_date: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Tab Notas */}
            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  rows={6}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Anotações sobre o membro..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Criação */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Incluir Novo Membro</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos para criar a conta do novo membro.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Pessoal</TabsTrigger>
              <TabsTrigger value="address">Endereço</TabsTrigger>
              <TabsTrigger value="church">Igreja</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    required
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Nome do novo membro"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    required
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefone
                  </Label>
                  <Input
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Papel no Sistema</Label>
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
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-primary font-bold">
                    <Lock className="w-4 h-4" />
                    Senha Provisória *
                  </Label>
                  <Input
                    type="text"
                    required
                    value={editForm.password || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Ex: Membro123!"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-orange-600 font-bold">
                    <Calendar className="w-4 h-4" />
                    Período de Teste (Dias)
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={editForm.trialDays || 4}
                    onChange={(e) => setEditForm(prev => ({ ...prev, trialDays: parseInt(e.target.value) || 4 }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Rua/Avenida</Label>
                  <Input
                    value={editForm.address_street || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_street: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={editForm.address_city || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, address_city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={editForm.address_state || ''}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, address_state: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {brazilianStates.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="church" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Membro</Label>
                  <Select
                    value={editForm.member_type || 'visitante'}
                    onValueChange={(v) => setEditForm(prev => ({ ...prev, member_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(memberTypeConfig).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matrícula</Label>
                  <Input
                    value={editForm.matricula || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, matricula: e.target.value }))}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  rows={4}
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Anotações sobre o novo membro..."
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateMember} disabled={createMember.isPending}>
              {createMember.isPending ? "Criando..." : "Criar Membro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação excluirá o perfil do membro. Os dados de login no Supabase Auth podem permanecer,
              mas o acesso ao perfil será removido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMembersList;
