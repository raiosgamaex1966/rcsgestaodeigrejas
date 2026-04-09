import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Church, Users, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, XCircle, ArrowUpRight, Activity,
  BarChart3, DollarSign,
} from "lucide-react";
import { Link } from "react-router-dom";

interface TenantData {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  trial_ends_at: string | null;
  created_at: string;
  settings: any;
}

const SuperAdminDashboard = () => {
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monthlyGrowth, setMonthlyGrowth] = useState<number[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      const { data: tenantData } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      const { count: membersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const all = tenantData || [];
      setTenants(all);
      setTotalMembers(membersCount || 0);

      // Simulate monthly growth (last 6 months)
      const now = new Date();
      const growth: number[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const count = all.filter(
          (t: any) => new Date(t.created_at) <= monthDate
        ).length;
        growth.push(count);
      }
      setMonthlyGrowth(growth);

      setLoading(false);
    };
    fetchAll();
  }, []);

  const getMonthly = (t: TenantData) => (t.settings || {}).monthly_value || 0;
  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const active = tenants.filter((t) => t.subscription_status === "active");
  const trial = tenants.filter(
    (t) => !t.subscription_status || t.subscription_status === "trial"
  );
  const blocked = tenants.filter((t) => t.subscription_status === "blocked");
  const totalRevenue = active.reduce((s, t) => s + getMonthly(t), 0);
  const lostRevenue = blocked.reduce((s, t) => s + getMonthly(t), 0);

  const statCards = [
    { title: "Total de Igrejas", value: tenants.length, icon: Church, color: "text-blue-600", bg: "bg-blue-100", ringColor: "ring-blue-200" },
    { title: "Igrejas Ativas", value: active.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100", ringColor: "ring-emerald-200" },
    { title: "Em Teste", value: trial.length, icon: Clock, color: "text-amber-600", bg: "bg-amber-100", ringColor: "ring-amber-200" },
    { title: "Bloqueadas", value: blocked.length, icon: XCircle, color: "text-red-600", bg: "bg-red-100", ringColor: "ring-red-200" },
    { title: "Total de Membros", value: totalMembers, icon: Users, color: "text-purple-600", bg: "bg-purple-100", ringColor: "ring-purple-200" },
    { title: "Receita Mensal", value: fmt(totalRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-100", ringColor: "ring-green-200" },
  ];

  // Chart bar rendering helper
  const maxGrowth = Math.max(...monthlyGrowth, 1);
  const monthLabels = (() => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(d.toLocaleDateString("pt-BR", { month: "short" }));
    }
    return labels;
  })();

  const getStatusBadge = (status: string, trialEnds: string | null) => {
    const isExpired = trialEnds && new Date(trialEnds) < new Date();
    if (status === "active") return <Badge className="bg-emerald-500 text-xs">Ativa</Badge>;
    if (status === "blocked") return <Badge variant="destructive" className="text-xs">Bloqueada</Badge>;
    if (isExpired) return <Badge variant="destructive" className="text-xs">Teste Expirado</Badge>;
    return <Badge variant="secondary" className="text-xs">Em Teste</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do ecossistema RCS Gestão de Igrejas
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`${stat.bg} p-2 rounded-xl ring-1 ${stat.ringColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{loading ? "..." : stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.title}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Crescimento de Igrejas
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {monthlyGrowth.map((val, i) => {
                const heightPct = (val / maxGrowth) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-foreground">{val}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-primary/80 to-primary/40 transition-all duration-500"
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground capitalize">{monthLabels[i]}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Revenue breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>Visão rápida de receita</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium">Receita Mensal</span>
                </div>
                <span className="font-bold text-emerald-700">{fmt(totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Receita Anual Projetada</span>
                </div>
                <span className="font-bold text-blue-700">{fmt(totalRevenue * 12)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">Receita Perdida (inadimplência)</span>
                </div>
                <span className="font-bold text-red-700">{fmt(lostRevenue)}</span>
              </div>
            </div>

            {/* Distribution bar */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Distribuição de Igrejas</p>
              <div className="w-full h-4 rounded-full overflow-hidden flex bg-muted">
                {tenants.length > 0 && (
                  <>
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(active.length / tenants.length) * 100}%` }}
                      title={`Ativas: ${active.length}`}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all"
                      style={{ width: `${(trial.length / tenants.length) * 100}%` }}
                      title={`Em teste: ${trial.length}`}
                    />
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${(blocked.length / tenants.length) * 100}%` }}
                      title={`Bloqueadas: ${blocked.length}`}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ativas
                </span>
                <span className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Em teste
                </span>
                <span className="text-[10px] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Bloqueadas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {blocked.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">
                {blocked.length} igreja(s) bloqueada(s) — {fmt(lostRevenue)}/mês em receita perdida
              </p>
              <p className="text-sm text-amber-700">
                <Link to="/superadmin/churches" className="underline font-medium">
                  Gerenciar igrejas
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/superadmin/churches" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-sm font-medium">Cadastrar Nova Igreja</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <Link to="/superadmin/invites" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-sm font-medium">Enviar Convite</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <Link to="/superadmin/plans" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-sm font-medium">Configurar Planos</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <Link to="/superadmin/contracts" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-sm font-medium">Renovar Contratos</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
            <Link to="/superadmin/audit" className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group">
              <span className="text-sm font-medium">Ver Logs de Auditoria</span>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Recent Churches */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg">Igrejas Recentes</CardTitle>
              <CardDescription>Últimos cadastros no sistema</CardDescription>
            </div>
            <Link
              to="/superadmin/churches"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Carregando...</p>
            ) : tenants.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhuma igreja cadastrada ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {tenants.slice(0, 5).map((church) => (
                  <div
                    key={church.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Church className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{church.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{church.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(church.subscription_status || "trial", church.trial_ends_at)}
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(church.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
