import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Church, Search, CheckCircle2, XCircle, ShieldAlert, Eye,
  Edit, Users, Calendar, Plus, MoreHorizontal, Ban, Unlock,
  DollarSign, Clock, TrendingUp, Link as LinkIcon, Trash2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { NewChurchDialog } from "./components/NewChurchDialog";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  tax_id: string | null;
  subscription_status: string;
  subscription_ends_at: string | null;
  trial_ends_at: string | null;
  is_active: boolean;
  settings: any;
  created_at: string;
  member_count?: number;
}

const getSettings = (t: Tenant) => t.settings || {};
const getMonthly = (t: Tenant) => getSettings(t).monthly_value || 0;
const getAdhesion = (t: Tenant) => getSettings(t).adhesion_value || 0;
const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const SuperAdminChurches = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    tax_id: "",
    monthly_value: 0,
    adhesion_value: 0,
    contract_months: 12,
    notes: "",
    admin_email: "",
    provisional_password: "",
  });
  const [isNewChurchOpen, setIsNewChurchOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchTenants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao buscar igrejas: " + error.message);
    } else {
      // Get member counts per tenant
      const tenantsWithCounts = await Promise.all(
        (data || []).map(async (t: any) => {
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", t.id);
          return { ...t, member_count: count || 0 };
        })
      );
      setTenants(tenantsWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleToggleBlock = async (tenant: Tenant) => {
    const newStatus = tenant.subscription_status === "blocked" ? "active" : "blocked";
    const newActive = newStatus !== "blocked";

    const { error } = await supabase
      .from("tenants")
      .update({ subscription_status: newStatus, is_active: newActive })
      .eq("id", tenant.id);

    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
    } else {
      toast.success(
        newStatus === "blocked"
          ? `${tenant.name} bloqueada com sucesso`
          : `${tenant.name} desbloqueada com sucesso`
      );
      fetchTenants();
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    setLoading(true);
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", selectedTenant.id);

    if (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Não foi possível excluir a igreja: " + error.message);
    } else {
      toast.success(`Igreja "${selectedTenant.name}" excluída com sucesso`);
      setIsDeleteOpen(false);
      fetchTenants();
    }
    setLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!selectedTenant) return;

    const { error } = await supabase
      .from("tenants")
      .update({
        name: editForm.name,
        tax_id: editForm.tax_id || null,
        settings: {
          monthly_value: editForm.monthly_value,
          adhesion_value: editForm.adhesion_value,
          contract_months: editForm.contract_months,
          notes: editForm.notes,
          admin_email: editForm.admin_email,
          provisional_password: editForm.provisional_password,
        },
      })
      .eq("id", selectedTenant.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Igreja atualizada com sucesso");
      setIsEditOpen(false);
      fetchTenants();
    }
  };

  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    const settings = (tenant as any).settings || {};
    setEditForm({
      name: tenant.name,
      tax_id: tenant.tax_id || "",
      monthly_value: settings.monthly_value || 0,
      adhesion_value: settings.adhesion_value || 0,
      contract_months: settings.contract_months || 12,
      notes: settings.notes || "",
      admin_email: settings.admin_email || "",
      provisional_password: settings.provisional_password || "",
    });
    setIsEditOpen(true);
  };

  const copyAccessLink = (tenant: Tenant) => {
    const settings = (tenant as any).settings || {};
    const email = settings.admin_email || "";
    const pass = settings.provisional_password || "";
    const name = encodeURIComponent(tenant.name);
    
    let link = `${window.location.origin}/${tenant.slug}/auth`;
    const taxIdVal = tenant.tax_id || (tenant as any).settings?.tax_id;
    const taxIdParam = taxIdVal ? `&tax_id=${encodeURIComponent(taxIdVal)}` : "";
    
    if (email && pass) {
      link += `?email=${encodeURIComponent(email)}&p=${encodeURIComponent(pass)}&cn=${name}&tid=${tenant.id}${taxIdParam}&mode=signup`;
    }
    
    const message = `Olá! Seguem as instruções para acesso da igreja ${tenant.name}:\n\n` +
      `Como você é o responsável, preparamos seu acesso antecipado. Clique no link abaixo e complete seu cadastro (Nome e Telefone) para ativar o painel da igreja:\n\n` +
      `Link de Cadastro: ${link}\n` +
      `E-mail de Acesso: ${email}\n` +
      `Senha Provisória: ${pass}\n\n` +
      `*IMPORTANTE:* Após o seu primeiro acesso e conclusão do cadastro, altere a senha provisória por uma senha segura.`;

    navigator.clipboard.writeText(message);
    toast.success("Link e dados de acesso copiados!");
  };

  const openDetail = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsDetailOpen(true);
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && t.subscription_status === "active";
    if (statusFilter === "trial") return matchesSearch && (t.subscription_status === "trial" || !t.subscription_status);
    if (statusFilter === "blocked") return matchesSearch && t.subscription_status === "blocked";
    return matchesSearch;
  });

  const getStatusBadge = (status: string, trialEnds: string | null) => {
    const isExpired = trialEnds && new Date(trialEnds) < new Date();

    if (status === "active") return <Badge className="bg-emerald-500 hover:bg-emerald-600">Ativa</Badge>;
    if (status === "blocked") return <Badge variant="destructive">Bloqueada</Badge>;
    if (isExpired) return <Badge className="bg-red-500 hover:bg-red-600">Teste Expirado</Badge>;
    return <Badge className="bg-amber-500 hover:bg-amber-600">Em Teste</Badge>;
  };

  const statusOptions = [
    { value: "all", label: "Todas" },
    { value: "active", label: "Ativas" },
    { value: "trial", label: "Em Teste" },
    { value: "blocked", label: "Bloqueadas" },
  ];

  const totalMembers = tenants.reduce((s, t) => s + (t.member_count || 0), 0);
  const totalMonthlyRevenue = tenants.filter(t => t.subscription_status === 'active').reduce((s, t) => s + getMonthly(t), 0);
  const activeTenants = tenants.filter(t => t.subscription_status === 'active').length;
  const trialTenants = tenants.filter(t => !t.subscription_status || t.subscription_status === 'trial').length;
  const blockedTenants = tenants.filter(t => t.subscription_status === 'blocked').length;

  const statCards = [
    { title: 'Total de Igrejas', value: tenants.length, icon: Church, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Ativas', value: activeTenants, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Em Teste', value: trialTenants, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Bloqueadas', value: blockedTenants, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Total Membros', value: totalMembers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Receita Mensal', value: fmt(totalMonthlyRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Igrejas</h1>
          <p className="text-muted-foreground">Gerencie todas as igrejas do sistema</p>
        </div>
        <Button className="gap-2" onClick={() => setIsNewChurchOpen(true)}>
          <Plus className="w-4 h-4" />
          Cadastrar Igreja
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`${s.bg} p-1.5 rounded-lg`}>
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{s.title}</p>
                </div>
                <p className="text-xl font-bold">{loading ? '...' : s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              {statusOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={statusFilter === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Igreja</TableHead>
                <TableHead className="hidden md:table-cell">CNPJ/CPF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Membros</TableHead>
                <TableHead className="hidden md:table-cell">Mensalidade</TableHead>
                <TableHead className="hidden lg:table-cell">Vencimento</TableHead>
                <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhuma igreja encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Church className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{t.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm">{t.tax_id || "—"}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(t.subscription_status || "trial", t.trial_ends_at)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{t.member_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="text-sm font-medium">
                        {getMonthly(t) > 0 ? fmt(getMonthly(t)) : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {t.subscription_ends_at
                        ? new Date(t.subscription_ends_at).toLocaleDateString("pt-BR")
                        : t.trial_ends_at
                          ? new Date(t.trial_ends_at).toLocaleDateString("pt-BR")
                          : "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(t)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyAccessLink(t)}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            Copiar Link Acesso
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTenant(t);
                              setIsDeleteOpen(true);
                            }}
                            className="text-destructive font-semibold"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir Igreja
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleBlock(t)}
                            className={t.subscription_status === "blocked" ? "text-emerald-600" : "text-destructive"}
                          >
                            {t.subscription_status === "blocked" ? (
                              <><Unlock className="w-4 h-4 mr-2" /> Desbloquear</>
                            ) : (
                              <><Ban className="w-4 h-4 mr-2" /> Bloquear</>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Church className="w-5 h-5" /> {selectedTenant?.name}
            </DialogTitle>
            <DialogDescription>Detalhes da igreja</DialogDescription>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Slug</p>
                  <p className="font-mono text-sm">{selectedTenant.slug}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">CNPJ/CPF</p>
                  <p className="text-sm">{selectedTenant.tax_id || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Status</p>
                  {getStatusBadge(selectedTenant.subscription_status || "trial", selectedTenant.trial_ends_at)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Membros</p>
                  <p className="text-sm font-bold">{selectedTenant.member_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Cadastro</p>
                  <p className="text-sm">{new Date(selectedTenant.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Vencimento</p>
                  <p className="text-sm">
                    {selectedTenant.subscription_ends_at
                      ? new Date(selectedTenant.subscription_ends_at).toLocaleDateString("pt-BR")
                      : selectedTenant.trial_ends_at
                        ? new Date(selectedTenant.trial_ends_at).toLocaleDateString("pt-BR")
                        : "—"}
                  </p>
                </div>
              </div>
              {/* Financial Info */}
              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-2 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Dados Financeiros
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-muted/50 p-2 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Mensalidade</p>
                    <p className="font-bold text-sm">{fmt(getMonthly(selectedTenant))}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Adesão</p>
                    <p className="font-bold text-sm">{fmt(getAdhesion(selectedTenant))}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">Contrato</p>
                    <p className="font-bold text-sm">{getSettings(selectedTenant).contract_months || 12} meses</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => { setIsDetailOpen(false); openEdit(selectedTenant); }}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Igreja</DialogTitle>
            <DialogDescription>Atualize os dados e valores do contrato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Igreja</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ/CPF</Label>
              <Input
                value={editForm.tax_id}
                onChange={(e) => setEditForm((p) => ({ ...p, tax_id: e.target.value }))}
                placeholder="00.000.000/0001-00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Taxa de Adesão (R$)</Label>
                <Input
                  type="number"
                  value={editForm.adhesion_value === 0 ? "" : editForm.adhesion_value}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, adhesion_value: e.target.value === "" ? 0 : Number(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Mensalidade (R$)</Label>
                <Input
                  type="number"
                  value={editForm.monthly_value === 0 ? "" : editForm.monthly_value}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, monthly_value: e.target.value === "" ? 0 : Number(e.target.value) }))
                  }
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Duração do Contrato (meses)</Label>
              <Input
                type="number"
                value={editForm.contract_months === 0 ? "" : editForm.contract_months}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, contract_months: e.target.value === "" ? 0 : Number(e.target.value) }))
                }
                placeholder="12"
              />
            </div>
             <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div className="space-y-2">
                <Label>E-mail Adm (Pastor)</Label>
                <Input
                  type="email"
                  value={editForm.admin_email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, admin_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Senha Provisória</Label>
                <Input
                  value={editForm.provisional_password}
                  onChange={(e) => setEditForm(prev => ({ ...prev, provisional_password: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                rows={3}
                value={editForm.notes}
                onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Anotações internas sobre esta igreja..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Church Wizard */}
      <NewChurchDialog 
        open={isNewChurchOpen} 
        onOpenChange={setIsNewChurchOpen}
        onSuccess={fetchTenants}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-5 h-5" /> Excluir Igreja
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir a igreja <strong>{selectedTenant?.name}</strong>. Esta ação é irreversível e apagará todos os dados associados a esta igreja.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 mb-4">
            <p className="text-sm text-red-800 font-medium flex items-center gap-2">
              <Ban className="w-4 h-4" /> Aviso Crítico
            </p>
            <p className="text-xs text-red-700 mt-1">
              Todos os membros, sermões, eventos e logs vinculados a este inquilino serão perdidos permanentemente se não houver bloqueio de integridade externa.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTenant} disabled={loading}>
              {loading ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminChurches;
