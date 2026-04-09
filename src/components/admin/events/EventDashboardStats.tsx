import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, CheckCircle, Clock } from "lucide-react";
import { Event } from "@/hooks/useEvents";
import { differenceInDays, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface EventDashboardStatsProps {
  events: Event[];
  totalAttendees: number;
}

export const EventDashboardStats = ({ events, totalAttendees }: EventDashboardStatsProps) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const eventsThisMonth = events.filter(event => {
    const eventDate = parseISO(event.start_date);
    return isWithinInterval(eventDate, { start: monthStart, end: monthEnd });
  });
  
  const upcomingEvents = events.filter(event => parseISO(event.start_date) >= now);
  
  const nextEvent = upcomingEvents[0];
  const daysUntilNext = nextEvent 
    ? differenceInDays(parseISO(nextEvent.start_date), now)
    : null;

  const stats = [
    {
      label: "Este Mês",
      value: eventsThisMonth.length,
      sublabel: "eventos",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Total Inscritos",
      value: totalAttendees,
      sublabel: "no total",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Próximos",
      value: upcomingEvents.length,
      sublabel: "agendados",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Próximo Evento",
      value: daysUntilNext !== null ? (daysUntilNext === 0 ? "Hoje" : `${daysUntilNext} dias`) : "-",
      sublabel: nextEvent?.title?.slice(0, 15) || "",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground truncate">{stat.sublabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
