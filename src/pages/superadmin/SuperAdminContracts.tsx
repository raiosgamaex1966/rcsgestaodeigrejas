import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText, Church, Calendar, Clock, CheckCircle2, AlertTriangle,
  Plus, Edit, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface TenantContract {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  settings: any;
}

const SuperAdminContracts = () => {
  const [tenants, setTenants] = useState<TenantContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantContract | null>(null);
  const [isRenewOpen, setIsRenewOpen] = useState(false);
  const [renewMonths, setRenewMonths] = useState(12);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase.from("tenants").select("*").order("name");
      setTenants(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getContractStatus = (t: TenantContract) => {
    if (t.subscription_status === "blocked") return "blocked";
    if (t.subscription_status === "active") {
      if (t.subscription_ends_at) {
        const daysLeft = Math.ceil(
          (new Date(t.subscription_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        if (daysLeft <= 0) return "expired";
        if (daysLeft <= 30) return "expiring";
        return "active";
      }
      return "active";
    }
    if (t.trial_ends_at) {
      const trialLeft = Math.ceil(
        (new Date(t.trial_ends_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      );
      if (trialLeft <= 0) return "trial_expired";
      return "trial";
    }
    return "trial";
  };

  const getDaysRemaining = (t: TenantContract) => {
    const endDate = t.subscription_ends_at || t.trial_ends_at;
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500 text-xs">Ativo</Badge>;
      case "expiring":
        return <Badge className="bg-amber-500 text-xs">Vencendo</Badge>;
      case "expired":
        return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
      case "blocked":
        return <Badge variant="destructive" className="text-xs">Bloqueado</Badge>;
      case "trial":
        return <Badge variant="secondary" className="text-xs">Teste</Badge>;
      case "trial_expired":
        return <Badge className="bg-orange-500 text-xs">Teste Expirado</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>;
    }
  };

  const handleRenew = async () => {
    if (!selectedTenant) return;
    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + renewMonths);

    const { error } = await supabase
      .from("tenants")
      .update({
        subscription_status: "active",
        is_active: true,
        subscription_ends_at: newEnd.toISOString(),
      })
      .eq("id", selectedTenant.id);

    if (error) {
      toast.error("Erro ao renovar: " + error.message);
    } else {
      toast.success(`Contrato de ${selectedTenant.name} renovado por ${renewMonths} meses!`);
      setIsRenewOpen(false);
      // Refresh
      const { data } = await supabase.from("tenants").select("*").order("name");
      setTenants(data || []);
    }
  };

  const handleActivate = async (t: TenantContract) => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 12);

    const { error } = await supabase
      .from("tenants")
      .update({
        subscription_status: "active",
        is_active: true,
        subscription_ends_at: endDate.toISOString(),
      })
      .eq("id", t.id);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      toast.success(`${t.name} ativada com contrato de 12 meses!`);
      const { data } = await supabase.from("tenants").select("*").order("name");
      setTenants(data || []);
    }
  };

  // Stats
  const activeContracts = tenants.filter((t) => getContractStatus(t) === "active").length;
  const expiringContracts = tenants.filter((t) => getContractStatus(t) === "expiring").length;
  const expiredContracts = tenants.filter(
    (t) => ["expired", "trial_expired", "blocked"].includes(getContractStatus(t))
  ).length;
  const trialContracts = tenants.filter((t) => getContractStatus(t) === "trial").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif">Contratos</h1>
        <p className="text-muted-foreground">
          Gestão de contratos e renovações das igrejas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeContracts}</p>
              <p className="text-xs text-muted-foreground">Ativos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-amber-50 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiringContracts}</p>
              <p className="text-xs text-muted-foreground">Vencendo</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-red-50 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{expiredContracts}</p>
              <p className="text-xs text-muted-foreground">Vencidos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{trialContracts}</p>
              <p className="text-xs text-muted-foreground">Em Teste</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contratos das Igrejas</CardTitle>
          <CardDescription>Vigência, renovação e situação de cada contrato</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Igreja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Início</TableHead>
                <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                <TableHead className="hidden md:table-cell">Dias Restantes</TableHead>
                <TableHead className="hidden lg:table-cell">Duração</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">Carregando...</TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Nenhuma igreja cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((t) => {
                  const status = getContractStatus(t);
                  const days = getDaysRemaining(t);
                  const contractMonths = (t.settings || {}).contract_months || 12;

                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Church className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="font-medium text-sm">{t.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {new Date(t.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {t.subscription_ends_at
                          ? new Date(t.subscription_ends_at).toLocaleDateString("pt-BR")
                          : t.trial_ends_at
                            ? new Date(t.trial_ends_at).toLocaleDateString("pt-BR")
                            : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {days !== null ? (
                          <span
                            className={`text-sm font-medium ${
                              days <= 0
                                ? "text-red-600"
                                : days <= 30
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            {days <= 0 ? "Expirado" : `${days} dias`}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">
                        {contractMonths} meses
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {status === "trial" || status === "trial_expired" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleActivate(t)}
                              className="gap-1 text-xs"
                            >
                              <Plus className="w-3 h-3" />
                              Ativar
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTenant(t);
                                setIsRenewOpen(true);
                              }}
                              className="gap-1 text-xs"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Renovar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Renew Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Renovar Contrato
            </DialogTitle>
            <DialogDescription>
              Renovar o contrato de <strong>{selectedTenant?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Duração da Renovação (meses)</Label>
              <Input
                type="number"
                value={renewMonths}
                onChange={(e) => setRenewMonths(Number(e.target.value))}
                min={1}
                max={36}
              />
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p>
                O contrato será renovado por{" "}
                <strong>{renewMonths} meses</strong> a partir de hoje.
              </p>
              <p className="text-muted-foreground mt-1">
                Novo vencimento:{" "}
                {new Date(
                  Date.now() + renewMonths * 30 * 24 * 60 * 60 * 1000
                ).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenew}>Confirmar Renovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminContracts;
