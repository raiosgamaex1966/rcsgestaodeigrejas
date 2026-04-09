import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadingPlans, ReadingPlanDay } from "@/hooks/useReadingPlans";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { DayCompletionModal } from "@/components/plans/DayCompletionModal";
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  Volume2,
  Type,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PlanDevotional = () => {
  const { planId, dayId } = useParams();
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const { plans, fetchPlanDays, completeDay, fetchCompletedDays } = useReadingPlans();
  const { addPoints, POINTS } = useGamification();

  const [day, setDay] = useState<ReadingPlanDay | null>(null);
  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const plan = plans.find((p) => p.id === planId);

  useEffect(() => {
    const loadData = async () => {
      if (!planId || !dayId) return;

      setLoading(true);
      try {
        const [daysData, completed] = await Promise.all([
          fetchPlanDays(planId),
          fetchCompletedDays(planId),
        ]);
        setDays(daysData);
        setCompletedDayIds(completed);

        const currentDay = daysData.find((d) => d.id === dayId);
        setDay(currentDay || null);
      } catch (error) {
        console.error("Error loading devotional data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, dayId, fetchPlanDays, fetchCompletedDays]);

  const handleComplete = async () => {
    if (!user || !planId || !day) return;

    setCompleting(true);
    const success = await completeDay(planId, day.id, day.day_number);

    if (success) {
      setCompletedDayIds((prev) => [...prev, day.id]);
      await addPoints("complete_plan_day", POINTS.COMPLETE_DAILY_PLAN, {
        plan_id: planId,
        day_number: day.day_number,
      });

      setShowCompletionModal(true);
    }
    setCompleting(false);
  };

  const handleCloseModal = () => {
    setShowCompletionModal(false);
    navigate(getTenantPath(`/plans/${planId}/days`));
  };

  const goToNext = () => {
    if (day?.verse_reference) {
      navigate(getTenantPath(`/plans/${planId}/day/${dayId}/verse`));
    } else {
      navigate(getTenantPath(`/plans/${planId}/days`));
    }
  };

  const goBack = () => {
    navigate(getTenantPath(`/plans/${planId}/days`));
  };

  const handleShare = () => {
    if (day?.devotional_title && navigator.share) {
      navigator.share({
        title: day.devotional_title,
        text: day.devotional_content?.substring(0, 200) + "...",
      });
    }
  };

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === "sm") return "base";
      if (prev === "base") return "lg";
      return "sm";
    });
  };

  const isDayCompleted = completedDayIds.includes(dayId || "");
  const hasVerse = day?.verse_reference;
  const totalItems = (day?.devotional_title ? 1 : 0) + (hasVerse ? 1 : 0);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 opacity-50 animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Preparando sua meditação...</p>
      </div>
    );
  }

  if (!day || !plan) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Volume2 className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Conteúdo não encontrado</h2>
        <Button variant="link" onClick={() => navigate(getTenantPath("/plans"))} className="text-primary font-bold">
          Voltar aos Planos
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg md:max-w-3xl mx-auto pb-48 animate-fade-in">
      {/* Premium Reader Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full bg-secondary/50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Meditação Diária</h1>
            <p className="text-xs font-serif font-bold text-foreground/60 truncate max-w-[150px]">{plan.title}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-full">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={cycleFontSize} className="rounded-full">
              <Type className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Reader View */}
      <main className="px-6 py-10 space-y-10">
        {/* Title Section */}
        {day.devotional_title && (
          <div className="space-y-4 animate-slide-up">
             <div className="w-12 h-1 bg-primary/20 rounded-full" />
             <h2 className="text-3xl md:text-4xl font-serif font-black text-foreground leading-tight">
               {day.devotional_title}
             </h2>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span className="text-primary">Dia {day.day_number}</span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span>{plan.title}</span>
             </div>
          </div>
        )}

        {/* Content Body */}
        {day.devotional_content && (
          <div className="space-y-8 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div
              className={cn(
                "text-foreground/90 leading-[1.8] font-serif whitespace-pre-wrap transition-all duration-300",
                fontSize === "sm" && "text-sm",
                fontSize === "base" && "text-lg",
                fontSize === "lg" && "text-2xl"
              )}
            >
              {day.devotional_content}
            </div>
          </div>
        )}

        {/* Practical Action Highlight */}
        {day.practical_action && (
          <Card className="p-8 bg-primary/5 border-primary/20 rounded-3xl shadow-soft border-2 border-dashed animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Check className="w-5 h-5 stroke-[3]" />
               </div>
               <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                 Desafio Prático
               </h3>
            </div>
            <p
              className={cn(
                "text-foreground font-bold leading-relaxed",
                fontSize === "sm" && "text-xs",
                fontSize === "base" && "text-base",
                fontSize === "lg" && "text-xl"
              )}
            >
              {day.practical_action}
            </p>
          </Card>
        )}

        {/* Prayer Section */}
        {day.prayer && (
          <div className="space-y-4 py-8 border-t border-border/50 animate-slide-up" style={{ animationDelay: "300ms" }}>
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center">
              Momento de Oração
            </h3>
            <p
              className={cn(
                "text-foreground/70 italic leading-[2] text-center max-w-xl mx-auto",
                fontSize === "sm" && "text-sm",
                fontSize === "base" && "text-lg",
                fontSize === "lg" && "text-2xl"
              )}
            >
              "{day.prayer}"
            </p>
          </div>
        )}

        {/* Audio Content Player */}
        {day.audio_url && (
          <Card className="p-6 bg-secondary/20 rounded-3xl border-0 shadow-inner animate-slide-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-4 mb-4">
               <Volume2 className="w-5 h-5 text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ouvir Reflexão</p>
            </div>
            <audio controls className="w-full h-10 accent-primary">
              <source src={day.audio_url} type="audio/mpeg" />
            </audio>
          </Card>
        )}
      </main>

      {/* Floating Sticky Navigation Bar */}
      <div className="fixed bottom-16 md:bottom-8 left-4 right-4 z-40 animate-slide-up" style={{ animationDelay: "500ms" }}>
        <Card className="max-w-lg mx-auto bg-background/80 backdrop-blur-xl border-border/40 shadow-2xl-soft rounded-3xl p-4 md:p-6 ring-1 ring-white/20">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                Passo 1 de {totalItems}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Dia {day.day_number} da Jornada
              </span>
            </div>
            {isDayCompleted && (
               <Badge className="bg-green-500/10 text-green-600 border-0 rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-tighter">
                  Completado
               </Badge>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-border/40 bg-white/50 shadow-soft group font-black uppercase text-[10px] tracking-widest" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Sair
            </Button>

            {hasVerse ? (
              <Button className="flex-1 h-14 rounded-2xl bg-primary text-white shadow-soft group font-black uppercase text-[10px] tracking-widest" onClick={goToNext}>
                Continuar
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : !isDayCompleted ? (
              <Button
                className="flex-[1.5] h-14 rounded-2xl bg-primary text-white shadow-soft font-black uppercase text-[10px] tracking-[0.2em]"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 mr-2 stroke-[3]" />
                )}
                Concluir Dia
              </Button>
            ) : (
              <Button className="flex-1 h-14 rounded-2xl bg-secondary text-foreground font-black uppercase text-[10px] tracking-widest" onClick={goBack}>
                Ver Progresso
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Completion Experience Modal */}
      {plan && (
        <DayCompletionModal
          open={showCompletionModal}
          onClose={handleCloseModal}
          plan={plan}
          dayNumber={day.day_number}
          pointsEarned={POINTS.COMPLETE_DAILY_PLAN}
        />
      )}
    </div>
  );
};

export default PlanDevotional;
