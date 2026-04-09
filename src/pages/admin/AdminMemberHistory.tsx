import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Search, History, User, Calendar, Filter,
  UserPlus, UserCheck, Heart, Award, BookOpen, Users, TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MemberHistoryEntry {
  id: string;
  member_id: string;
  action_type: string;
  description: string | null;
  date: string | null;
  metadata: Record<string, unknown> | null;
  performed_by: string | null;
  created_at: string | null;
  member?: {
    full_name: string | null;
  };
  performer?: {
    full_name: string | null;
  };
}

const actionTypeLabels: Record<string, string> = {
  cadastro: "Cadastro",
  atualizacao: "Atualização",
  batismo: "Batismo",
  conversao: "Conversão",
  membresia: "Membresia",
  atendimento: "Atendimento Pastoral",
  celula: "Célula",
  equipe: "Equipe",
  jornada: "Jornada",
  curso: "Curso",
  promocao: "Promoção",
  status_change: "Alteração de Status",
  outro: "Outro"
};

const actionTypeIcons: Record<string, React.ReactNode> = {
  cadastro: <UserPlus className="h-4 w-4" />,
  atualizacao: <User className="h-4 w-4" />,
  batismo: <Heart className="h-4 w-4" />,
  conversao: <Heart className="h-4 w-4" />,
  membresia: <UserCheck className="h-4 w-4" />,
  atendimento: <Heart className="h-4 w-4" />,
  celula: <Users className="h-4 w-4" />,
  equipe: <Users className="h-4 w-4" />,
  jornada: <BookOpen className="h-4 w-4" />,
  curso: <BookOpen className="h-4 w-4" />,
  promocao: <Award className="h-4 w-4" />,
  status_change: <TrendingUp className="h-4 w-4" />,
  outro: <History className="h-4 w-4" />
};

const actionTypeColors: Record<string, string> = {
  cadastro: "bg-blue-500",
  atualizacao: "bg-gray-500",
  batismo: "bg-purple-500",
  conversao: "bg-pink-500",
  membresia: "bg-green-500",
  atendimento: "bg-orange-500",
  celula: "bg-teal-500",
  equipe: "bg-indigo-500",
  jornada: "bg-amber-500",
  curso: "bg-cyan-500",
  promocao: "bg-yellow-500",
  status_change: "bg-blue-600",
  outro: "bg-gray-400"
};

export default function AdminMemberHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Fetch history with member info
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["admin-member-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_history")
        .select(`
          *,
          member:profiles!member_history_member_id_fkey (full_name),
          performer:profiles!member_history_performed_by_fkey (full_name)
        `)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as MemberHistoryEntry[];
    }
  });

  // Filter history
  const filteredHistory = history.filter(entry => {
    const matchesSearch =
      entry.member?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === "all" || entry.action_type === actionFilter;

    let matchesDate = true;
    if (dateFilter !== "all" && entry.created_at) {
      const entryDate = new Date(entry.created_at);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          matchesDate = entryDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = entryDate >= monthAgo;
          break;
        case "year":
          matchesDate = entryDate.getFullYear() === now.getFullYear();
          break;
      }
    }

    return matchesSearch && matchesAction && matchesDate;
  });

  // Group by date
  const groupedHistory = filteredHistory.reduce((acc, entry) => {
    const date = entry.created_at
      ? format(new Date(entry.created_at), "yyyy-MM-dd")
      : "sem-data";
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, MemberHistoryEntry[]>);

  // Stats
  const totalEntries = history.length;
  const todayEntries = history.filter(e =>
    e.created_at && new Date(e.created_at).toDateString() === new Date().toDateString()
  ).length;
  const weekEntries = history.filter(e => {
    if (!e.created_at) return false;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(e.created_at) >= weekAgo;
  }).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/members">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Histórico de Membros</h1>
          <p className="text-muted-foreground">Acompanhe todas as atividades dos membros</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalEntries}</p>
              <p className="text-sm text-muted-foreground">Total de Registros</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayEntries}</p>
              <p className="text-sm text-muted-foreground">Hoje</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{weekEntries}</p>
              <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por membro ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tipo de ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            {Object.entries(actionTypeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo período</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Últimos 7 dias</SelectItem>
            <SelectItem value="month">Últimos 30 dias</SelectItem>
            <SelectItem value="year">Este ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.keys(groupedHistory).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium">Nenhum registro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                O histórico de atividades aparecerá aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedHistory).map(([dateKey, entries]) => (
            <div key={dateKey}>
              <div className="sticky top-0 bg-background z-10 py-2">
                <Badge variant="outline" className="text-sm">
                  {dateKey === "sem-data"
                    ? "Sem data"
                    : format(new Date(dateKey), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Badge>
              </div>
              <div className="space-y-3 mt-3">
                {entries.map((entry) => (
                  <Card key={entry.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full text-white ${actionTypeColors[entry.action_type] || actionTypeColors.outro}`}>
                          {actionTypeIcons[entry.action_type] || actionTypeIcons.outro}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {entry.member?.full_name || "Membro"}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {actionTypeLabels[entry.action_type] || entry.action_type}
                            </Badge>
                          </div>
                          {entry.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {entry.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {entry.created_at && (
                              <span>
                                {format(new Date(entry.created_at), "HH:mm", { locale: ptBR })}
                              </span>
                            )}
                            {entry.performer?.full_name && (
                              <span>por {entry.performer.full_name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
