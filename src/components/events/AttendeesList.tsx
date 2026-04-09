import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface AttendeesListProps {
  eventId: string;
  maxDisplay?: number;
  showCount?: boolean;
  className?: string;
}

interface AttendeeWithProfile {
  id: string;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const AttendeesList = ({ eventId, maxDisplay = 5, showCount = true, className }: AttendeesListProps) => {
  const { data: attendees, isLoading } = useQuery({
    queryKey: ["event-attendees-with-profiles", eventId],
    queryFn: async () => {
      // First get attendees
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("event_attendees")
        .select("id, user_id")
        .eq("event_id", eventId);

      if (attendeesError) throw attendeesError;
      if (!attendeesData || attendeesData.length === 0) return [];

      // Then get profiles for those users
      const userIds = attendeesData.map(a => a.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Merge data
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      return attendeesData.map(a => ({
        id: a.id,
        user_id: a.user_id,
        profile: profilesMap.get(a.user_id) || null
      })) as AttendeeWithProfile[];
    },
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex -space-x-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalCount = attendees?.length || 0;
  const displayedAttendees = attendees?.slice(0, maxDisplay) || [];
  const remainingCount = totalCount - maxDisplay;

  if (totalCount === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Users className="w-4 h-4" />
        <span className="text-sm">Seja o primeiro a confirmar!</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex -space-x-2">
        {displayedAttendees.map((attendee) => {
          const name = attendee.profile?.full_name || "Usuário";
          const initials = name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Avatar key={attendee.id} className="w-8 h-8 border-2 border-background">
              <AvatarImage src={attendee.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          );
        })}
        {remainingCount > 0 && (
          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs font-medium text-muted-foreground">+{remainingCount}</span>
          </div>
        )}
      </div>
      {showCount && (
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "confirmado" : "confirmados"}
        </span>
      )}
    </div>
  );
};
