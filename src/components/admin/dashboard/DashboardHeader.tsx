import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useProfile } from "@/hooks/useProfile";
import { Sun, Moon, Sunset } from "lucide-react";

export const DashboardHeader = () => {
  const { profile } = useProfile();
  
  const now = new Date();
  const hour = now.getHours();
  
  const getGreeting = () => {
    if (hour < 12) return { text: "Bom dia", icon: Sun };
    if (hour < 18) return { text: "Boa tarde", icon: Sunset };
    return { text: "Boa noite", icon: Moon };
  };
  
  const { text: greeting, icon: Icon } = getGreeting();
  const firstName = profile?.full_name?.split(" ")[0] || "Admin";
  const formattedDate = format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-6 w-6 text-gold" />
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            {greeting}, {firstName}!
          </h1>
        </div>
        <p className="text-muted-foreground capitalize mt-1">
          {formattedDate}
        </p>
      </div>
    </div>
  );
};
