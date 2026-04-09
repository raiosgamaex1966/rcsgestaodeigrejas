import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUpcomingBirthdays } from "@/hooks/useDashboardStats";
import { Cake, Gift } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const BirthdaysWidget = () => {
  const { data: birthdays, isLoading } = useUpcomingBirthdays();

  return (
    <Card variant="elevated" className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="w-5 h-5 text-pink-500" />
          Aniversariantes da Semana
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !birthdays || birthdays.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Gift className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum aniversariante esta semana</p>
          </div>
        ) : (
          <div className="space-y-3">
            {birthdays.slice(0, 5).map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={person.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {person.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {person.full_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(person.birthdayDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                {person.isToday && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-pink-500/20 text-pink-600 rounded-full text-xs font-medium">
                    <Cake className="w-3 h-3" />
                    Hoje!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
