import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, Share2, BookOpen } from "lucide-react";
import { ReadingPlan } from "@/hooks/useReadingPlans";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface DayCompletionModalProps {
  open: boolean;
  onClose: () => void;
  plan: ReadingPlan;
  dayNumber: number;
  pointsEarned: number;
}

interface Profile {
  full_name: string | null;
  avatar_url: string | null;
}

export const DayCompletionModal = ({
  open,
  onClose,
  plan,
  dayNumber,
  pointsEarned,
}: DayCompletionModalProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const percentage = Math.round((dayNumber / plan.duration_days) * 100);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };
    if (open && user) fetchProfile();
  }, [open, user]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Completei o Dia ${dayNumber} do plano "${plan.title}"!`,
        text: `Estou no dia ${dayNumber} de ${plan.duration_days} no plano de leitura "${plan.title}". ${percentage}% concluído!`,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-b from-background to-primary/5">
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <Share2 className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center py-6 space-y-6">
          {/* Animated Check */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-10 h-10 text-primary-foreground animate-in zoom-in duration-500" />
              </div>
            </div>
            {/* Celebration particles */}
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-yellow-400 rounded-full animate-bounce delay-100" />
            <div className="absolute -top-1 -right-3 w-3 h-3 bg-green-400 rounded-full animate-bounce delay-200" />
            <div className="absolute -bottom-2 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce delay-300" />
            <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-bounce delay-150" />
          </div>

          {/* Day Counter */}
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              Dia {dayNumber} de {plan.duration_days}
            </p>
          </div>

          {/* Plan Card */}
          <div className="w-full max-w-xs rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm">
            {plan.thumbnail_url ? (
              <img
                src={plan.thumbnail_url}
                alt={plan.title}
                className="w-full h-32 object-cover"
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-foreground text-center line-clamp-2">
                {plan.title}
              </h3>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs space-y-2">
            <Progress value={percentage} className="h-3" />
            <p className="text-center text-sm text-muted-foreground">
              {percentage}% concluído
            </p>
          </div>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {profile?.full_name || "Você"}
            </span>
          </div>

          {/* Points Earned */}
          <div className="bg-primary/10 px-4 py-2 rounded-full">
            <p className="text-primary font-bold text-lg">
              +{pointsEarned} pontos! 🎉
            </p>
          </div>

          {/* Continue Button */}
          <Button className="w-full max-w-xs" size="lg" onClick={onClose}>
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
