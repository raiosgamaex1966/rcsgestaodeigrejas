import { useMemberStats, useMembers, useBirthdays } from "@/hooks/useMembers";
import { safeParseDate } from "@/lib/date-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  UserPlus,
  UserCheck,
  Cake,
  TrendingUp,
  Droplets,
  Heart
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

const AdminMembersOverview = () => {
  const { stats, isLoading } = useMemberStats();
  const currentMonth = new Date().getMonth();
  const birthdays = useBirthdays(currentMonth);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total de Pessoas",
      value: stats?.total || 0,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Membros",
      value: stats?.members || 0,
      icon: UserCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Visitantes",
      value: stats?.visitors || 0,
      icon: UserPlus,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Novos Convertidos",
      value: stats?.newConverts || 0,
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      label: "Batismos este ano",
      value: stats?.baptismsThisYear || 0,
      icon: Droplets,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
    {
      label: "Aniversários este mês",
      value: stats?.birthdaysThisMonth || 0,
      icon: Cake,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  // Prepare chart data
  const ageData = stats?.byAgeGroup
    ? Object.entries(stats.byAgeGroup)
      .filter(([key]) => key !== 'Não informado')
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        const order = ['0-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
        return order.indexOf(a.name) - order.indexOf(b.name);
      })
    : [];

  const genderData = stats?.byGender
    ? [
      { name: 'Masculino', value: stats.byGender.male },
      { name: 'Feminino', value: stats.byGender.female },
    ].filter(d => d.value > 0)
    : [];

  const memberTypeData = [
    { name: 'Membros', value: stats?.members || 0 },
    { name: 'Visitantes', value: stats?.visitors || 0 },
    { name: 'Novos Convertidos', value: stats?.newConverts || 0 },
  ].filter(d => d.value > 0);

  const cityData = stats?.byCity
    ? Object.entries(stats.byCity)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Visão Geral de Membros</h1>
        <p className="text-muted-foreground">Dashboard com estatísticas e KPIs da membresia</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                    <Icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Age Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Idade</CardTitle>
            <CardDescription>Faixa etária dos membros</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Gênero</CardTitle>
            <CardDescription>Proporção masculino/feminino</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {genderData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Perfil de Membros</CardTitle>
            <CardDescription>Por tipo de vinculação</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={memberTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {memberTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Por Cidade</CardTitle>
            <CardDescription>Top 5 cidades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cityData.map((city, index) => (
                <div key={city.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{city.name}</span>
                  </div>
                  <Badge variant="secondary">{city.value}</Badge>
                </div>
              ))}
              {cityData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma cidade cadastrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Birthdays This Month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Cake className="w-5 h-5 text-amber-500" />
              Aniversariantes do Mês
            </CardTitle>
            <CardDescription>
              {new Date().toLocaleDateString('pt-BR', { month: 'long' })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-3">
                {birthdays.slice(0, 10).map((member) => {
                  const day = safeParseDate(member.birth_date!)?.getDate();
                  return (
                    <div key={member.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={member.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {member.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.full_name}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Dia {day}
                      </Badge>
                    </div>
                  );
                })}
                {birthdays.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum aniversariante este mês
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMembersOverview;
