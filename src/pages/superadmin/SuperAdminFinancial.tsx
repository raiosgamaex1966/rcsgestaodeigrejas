import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  Church, CheckCircle2, XCircle, Download, Calendar,
} from "lucide-react";

interface TenantFinancial {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  created_at: string;
  settings: any;
}

const SuperAdminFinancial = () => {
  const [tenants, setTenants] = useState<TenantFinancial[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("current");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .order("name");
      setTenants(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const getMonthlyValue = (t: TenantFinancial) => {
    const s = t.settings || {};
    return s.monthly_value || 0;
  };

  const activePayingTenants = tenants.filter(
    (t) => t.subscription_status === "active"
  );
  const trialTenants = tenants.filter(
    (t) => !t.subscription_status || t.subscription_status === "trial"
  );
  const blockedTenants = tenants.filter(
    (t) => t.subscription_status === "blocked"
  );

  const totalMonthlyRevenue = activePayingTenants.reduce(
    (sum, t) => sum + getMonthlyValue(t),
    0
  );
  const totalExpectedRevenue = tenants.reduce(
    (sum, t) => sum + getMonthlyValue(t),
    0
  );
  const lostRevenue = blockedTenants.reduce(
    (sum, t) => sum + getMonthlyValue(t),
    0
  );

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const stats = [
    {
      title: "Receita Mensal Ativa",
      value: fmt(totalMonthlyRevenue),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: `${activePayingTenants.length} igreja(s) pagando`,
    },
    {
      title: "Receita Potencial",
      value: fmt(totalExpectedRevenue),
      icon: DollarSign,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "Se todas as igrejas pagarem",
    },
    {
      title: "Receita Anual Projetada",
      value: fmt(totalMonthlyRevenue * 12),
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Baseado na receita mensal ativa",
    },
    {
      title: "Receita Perdida",
      value: fmt(lostRevenue),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
      desc: `${blockedTenants.length} inadimplente(s)`,
    },
  ];

  const getStatusBadge = (status: string) => {
    if (status === "active")
      return <Badge className="bg-emerald-500 text-xs">Em dia</Badge>;
    if (status === "blocked")
      return <Badge variant="destructive" className="text-xs">Inadimplente</Badge>;
    return <Badge variant="secondary" className="text-xs">Em teste</Badge>;
  };

  const exportReport = () => {
    const header = "Igreja,Status,Mensalidade,Vencimento\n";
    const rows = tenants
      .map(
        (t) =>
          `"${t.name}","${t.subscription_status || "trial"}","${getMonthlyValue(t)}","${
            t.subscription_ends_at || t.trial_ends_at || ""
          }"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financeiro_global_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Financeiro Global</h1>
          <p className="text-muted-foreground">
            Visão financeira de todas as igrejas do ecossistema
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mês Atual</SelectItem>
              <SelectItem value="last3">Últimos 3 meses</SelectItem>
              <SelectItem value="last6">Últimos 6 meses</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportReport} className="gap-2">
            <Download className="w-4 h-4" />
            CSV
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.title}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                    <p className="text-2xl font-bold">{loading ? "..." : s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                  <div className={`${s.bg} p-2.5 rounded-xl`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Alerts */}
      {blockedTenants.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-sm text-red-800">
              <strong>{blockedTenants.length} igreja(s)</strong> estão
              inadimplentes, totalizando <strong>{fmt(lostRevenue)}/mês</strong>{" "}
              em receita perdida.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Per-church Financial Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Igreja</CardTitle>
          <CardDescription>
            Situação financeira individual de cada igreja
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Igreja</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Mensalidade</TableHead>
                <TableHead className="hidden md:table-cell">Vencimento</TableHead>
                <TableHead className="hidden lg:table-cell text-right">
                  Receita Acumulada
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Nenhuma igreja cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((t) => {
                  const monthly = getMonthlyValue(t);
                  // Estimate accumulated based on months since created
                  const monthsSince = Math.max(
                    1,
                    Math.floor(
                      (Date.now() - new Date(t.created_at).getTime()) /
                        (30 * 24 * 60 * 60 * 1000)
                    )
                  );
                  const accumulated =
                    t.subscription_status === "active" ? monthly * monthsSince : 0;

                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Church className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div>
                            <p className="font-medium text-sm">{t.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {t.slug}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(t.subscription_status || "trial")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {monthly > 0 ? fmt(monthly) : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        {t.subscription_ends_at
                          ? new Date(t.subscription_ends_at).toLocaleDateString("pt-BR")
                          : t.trial_ends_at
                            ? new Date(t.trial_ends_at).toLocaleDateString("pt-BR")
                            : "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-right text-sm">
                        {accumulated > 0 ? fmt(accumulated) : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminFinancial;
