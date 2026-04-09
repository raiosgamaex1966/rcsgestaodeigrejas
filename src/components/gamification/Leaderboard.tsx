import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeaderboardEntry } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  className?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="w-5 h-5 text-yellow-500" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-400" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{rank}</span>;
  }
};

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/30";
    case 2:
      return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/30";
    case 3:
      return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/30";
    default:
      return "";
  }
};

export const Leaderboard = ({ entries, className }: LeaderboardProps) => {
  const { user } = useAuth();

  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const isCurrentUser = user?.id === entry.user_id;
          const name = entry.profile?.full_name || "Usuário";
          const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

          return (
            <Card
              key={entry.user_id}
              className={cn(
                "p-3 flex items-center gap-3 transition-all",
                getRankStyle(rank),
                isCurrentUser && "ring-2 ring-primary"
              )}
            >
              <div className="w-8 flex justify-center">
                {getRankIcon(rank)}
              </div>

              <Avatar className="w-10 h-10">
                <AvatarImage src={entry.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className={cn(
                  "font-medium text-sm truncate",
                  isCurrentUser && "text-primary"
                )}>
                  {name}
                  {isCurrentUser && " (você)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  🔥 {entry.current_streak} dias
                </p>
              </div>

              <div className="text-right">
                <p className="font-bold text-primary">{entry.xp_this_week}</p>
                <p className="text-xs text-muted-foreground">pts/semana</p>
              </div>
            </Card>
          );
        })}

        {entries.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum participante ainda</p>
            <p className="text-sm">Seja o primeiro a pontuar!</p>
          </div>
        )}
      </div>
    </div>
  );
};
