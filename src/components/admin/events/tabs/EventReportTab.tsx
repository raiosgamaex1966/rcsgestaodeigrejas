import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Calendar, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Event } from "@/hooks/useEvents";
import { format, parseISO, differenceInDays, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventReportTabProps {
  event: Event;
}

const COLORS = ["#22c55e", "#eab308", "#ef4444"];

export const EventReportTab = ({ event }: EventReportTabProps) => {
  const { data: attendees = [] } = useQuery({
    queryKey: ["event-attendees-stats", event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendees")
        .select("*")
        .eq("event_id", event.id);

      if (error) throw error;
      return data;
    },
  });

  const confirmed = attendees.filter(a => a.status === "confirmed").length;
  const pending = attendees.filter(a => a.status === "pending").length;
  const cancelled = attendees.filter(a => a.status === "cancelled").length;
  const total = attendees.length;

  const statusData = [
    { name: "Confirmados", value: confirmed },
    { name: "Pendentes", value: pending },
    { name: "Cancelados", value: cancelled },
  ].filter(d => d.value > 0);

  // Registration timeline (last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const timelineData = last7Days.map(day => {
    const dayStr = format(day, "yyyy-MM-dd");
    const count = attendees.filter(a => 
      a.confirmed_at && format(parseISO(a.confirmed_at), "yyyy-MM-dd") === dayStr
    ).length;
    return {
      name: format(day, "EEE", { locale: ptBR }),
      inscritos: count,
    };
  });

  const registrationLimit = (event as any).registration_limit;
  const occupancyRate = registrationLimit ? Math.round((confirmed / registrationLimit) * 100) : null;
  const daysUntilEvent = differenceInDays(parseISO(event.start_date), new Date());

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-sm text-muted-foreground">Total de Inscritos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{confirmed}</p>
            <p className="text-sm text-muted-foreground">Confirmados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{occupancyRate !== null ? `${occupancyRate}%` : "-"}</p>
            <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {daysUntilEvent < 0 ? "Encerrado" : daysUntilEvent === 0 ? "Hoje" : `${daysUntilEvent} dias`}
            </p>
            <p className="text-sm text-muted-foreground">Até o Evento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Nenhum inscrito ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Registration Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inscrições nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timelineData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Bar dataKey="inscritos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Evento</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Título</dt>
              <dd className="font-medium">{event.title}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Data</dt>
              <dd className="font-medium">
                {format(parseISO(event.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Horário</dt>
              <dd className="font-medium">
                {event.start_time?.slice(0, 5) || "-"} 
                {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Local</dt>
              <dd className="font-medium">{event.location || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Limite de Vagas</dt>
              <dd className="font-medium">{registrationLimit || "Ilimitado"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="font-medium">{event.is_active ? "Ativo" : "Inativo"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
};
