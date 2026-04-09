import { 
  Users, 
  UserPlus, 
  DollarSign, 
  Calendar, 
  Mic2, 
  MessageSquare, 
  Target, 
  GraduationCap,
  AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import {
  DashboardHeader,
  DashboardKPICard,
  MemberGrowthChart,
  FinanceOverviewChart,
  CampaignProgressWidget,
  UpcomingEventsWidget,
  RecentRequestsWidget,
  BirthdaysWidget,
  ActivityFeedWidget,
  FinancialHighlightCard,
} from "@/components/admin/dashboard";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useDashboardStats();
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("system_alerts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) setSystemAlerts(data);
    };
    fetchAlerts();
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertCircle className="w-5 h-5 text-amber-600" />;
      case "success": return <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>;
      default: return <div className="w-5 h-5 text-blue-600">i</div>;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case "warning": return "bg-amber-50 border-amber-200 text-amber-900";
      case "success": return "bg-emerald-50 border-emerald-200 text-emerald-900";
      default: return "bg-blue-50 border-blue-200 text-blue-900";
    }
  };

  const mainKPIs = [
    {
      label: "Membros Ativos",
      value: stats?.activeMembers || 0,
      icon: Users,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "Novos Visitantes",
      value: stats?.newVisitors || 0,
      icon: UserPlus,
      color: "bg-gold/10 text-gold",
    },
    {
      label: "Arrecadação Mensal",
      value: (stats?.incomeThisMonth || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        notation: "compact",
      }),
      icon: DollarSign,
      color: "bg-green-100 text-green-600",
      trend: stats?.incomeChange 
        ? { value: stats.incomeChange, isPositive: stats.incomeChange >= 0 }
        : undefined,
    },
    {
      label: "Eventos Este Mês",
      value: stats?.eventsThisMonth || 0,
      icon: Calendar,
      color: "bg-accent/10 text-accent",
    },
  ];

  const secondaryKPIs = [
    {
      label: "Ministrações",
      value: stats?.totalSermons || 0,
      icon: Mic2,
      color: "bg-indigo-100 text-indigo-600",
    },
    {
      label: "Solicitações Pendentes",
      value: stats?.pendingRequests || 0,
      icon: MessageSquare,
      color: "bg-orange-100 text-orange-600",
    },
    {
      label: "Campanhas Ativas",
      value: stats?.activeCampaigns?.length || 0,
      icon: Target,
      color: "bg-pink-100 text-pink-600",
    },
    {
      label: "Alunos em Cursos",
      value: stats?.activeStudents || 0,
      icon: GraduationCap,
      color: "bg-teal-100 text-teal-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* System Alerts */}
      {systemAlerts.length > 0 && (
        <div className="space-y-3 mb-6">
          {systemAlerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 p-4 border rounded-lg shadow-sm ${getAlertStyle(alert.type)}`}>
              <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
              <div>
                <h4 className="font-semibold text-sm">{alert.title}</h4>
                <p className="text-sm mt-1 whitespace-pre-wrap opacity-90">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <DashboardHeader />

      {/* Main KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKPIs.map((kpi) => (
          <DashboardKPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            loading={isLoading}
            trend={kpi.trend}
          />
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {secondaryKPIs.map((kpi) => (
          <DashboardKPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
            loading={isLoading}
            size="small"
          />
        ))}
      </div>

      {/* Alert for pending expenses */}
      {(stats?.pendingExpenses || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{stats?.pendingExpenses}</strong> despesa(s) aguardando aprovação.
          </p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemberGrowthChart />
        <FinanceOverviewChart />
      </div>

      {/* Widgets Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEventsWidget />
        <RecentRequestsWidget />
      </div>

      {/* Financial Highlight */}
      <FinancialHighlightCard
        amount={stats?.incomeThisMonth || 0}
        previousAmount={stats?.incomeLastMonth || 0}
        loading={isLoading}
      />

      {/* Widgets Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <BirthdaysWidget />
        <CampaignProgressWidget
          campaigns={stats?.activeCampaigns || []}
          loading={isLoading}
        />
        <ActivityFeedWidget />
      </div>
    </div>
  );
};

export default AdminDashboard;
