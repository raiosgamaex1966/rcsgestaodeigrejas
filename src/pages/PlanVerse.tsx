import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useReadingPlans, ReadingPlanDay } from "@/hooks/useReadingPlans";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { bibleBooks } from "@/data/bible";
import { useBibleVersion } from "@/hooks/useBibleVersion";
import { DayCompletionModal } from "@/components/plans/DayCompletionModal";
import {
  ChevronLeft,
  Share2,
  Type,
  Loader2,
  Check,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const parseVerseReference = (ref: string) => {
  const match = ref.match(/^(\d?\s*[A-Za-zÀ-ú]+)\s*(\d+):?(\d+)?/);
  if (!match) return null;

  const bookName = match[1].trim();
  const chapter = parseInt(match[2]);
  const verse = match[3] ? parseInt(match[3]) : null;

  const book = bibleBooks.find(
    (b) =>
      b.name.toLowerCase() === bookName.toLowerCase() ||
      b.abbrev.toLowerCase() === bookName.toLowerCase()
  );

  return {
    bookName,
    bookAbbrev: book?.abbrev || bookName.toLowerCase(),
    chapter,
    verse,
  };
};

const PlanVerse = () => {
  const { planId, dayId } = useParams();
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const { plans, fetchPlanDays, completeDay, fetchCompletedDays } = useReadingPlans();
  const { addPoints, POINTS } = useGamification();
  const { versionInfo } = useBibleVersion();

  const [day, setDay] = useState<ReadingPlanDay | null>(null);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("lg");
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
        setCompletedDayIds(completed);

        const currentDay = daysData.find((d) => d.id === dayId);
        setDay(currentDay || null);
      } catch (error) {
        console.error("Error loading verse data:", error);
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

  const goBack = () => {
    if (day?.devotional_title) {
      navigate(getTenantPath(`/plans/${planId}/day/${dayId}/devotional`));
    } else {
      navigate(getTenantPath(`/plans/${planId}/days`));
    }
  };

  const handleShare = () => {
    if (day?.verse_reference && day?.verse_text && navigator.share) {
      navigator.share({
        title: day.verse_reference,
        text: `"${day.verse_text}" - ${day.verse_reference}`,
      });
    }
  };

  const cycleFontSize = () => {
    setFontSize((prev) => {
      if (prev === "sm") return "base";
      if (prev === "base") return "lg";
      if (prev === "lg") return "xl";
      return "sm";
    });
  };

  const isDayCompleted = completedDayIds.includes(dayId || "");
  const parsedRef = day?.verse_reference ? parseVerseReference(day.verse_reference) : null;
  const hasDevotional = !!day?.devotional_title;
  const totalItems = (hasDevotional ? 1 : 0) + (day?.verse_reference ? 1 : 0);
  const currentItem = hasDevotional ? 2 : 1;

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 opacity-50 animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Inspirando versículos...</p>
      </div>
    );
  }

  if (!day || !plan) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
           <BookOpen className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Conteúdo não encontrado</h2>
        <Button variant="link" onClick={() => navigate(getTenantPath("/plans"))} className="text-primary font-bold">
          Ver todos os planos
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg md:max-w-3xl mx-auto pb-48 animate-fade-in">
      {/* Immersive Reader Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" size="icon" onClick={goBack} className="rounded-full bg-secondary/50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
             <h1 className="text-lg font-serif font-black text-foreground">{day.verse_reference}</h1>
             <p className="text-[9px] font-black uppercase tracking-widest text-primary/60">{versionInfo?.name || "ARA"}</p>
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

      {/* Heroic Verse Visualization */}
      <main className="px-8 py-16 flex flex-col items-center justify-center min-h-[55vh] relative overflow-hidden">
        {/* Background Decorative Element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-12 text-center animate-slide-up">
           <div className="w-16 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto rounded-full" />
           
           <blockquote
             className={cn(
               "font-serif font-bold text-foreground leading-[1.6] transition-all duration-500",
               fontSize === "sm" && "text-xl",
               fontSize === "base" && "text-2xl md:text-3xl",
               fontSize === "lg" && "text-3xl md:text-4xl",
               fontSize === "xl" && "text-4xl md:text-5xl"
             )}
           >
             <span className="text-primary/20 text-6xl font-serif absolute -top-8 -left-4">“</span>
             {day.verse_text}
             <span className="text-primary/20 text-6xl font-serif relative top-8 left-2">”</span>
           </blockquote>

           <div className="space-y-2">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Palavra de Vida</p>
             <p className="text-lg md:text-xl font-serif font-black text-primary/80">{day.verse_reference}</p>
           </div>
        </div>
      </main>

      <section className="px-6 space-y-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
        {/* Deep Dive Action */}
        {parsedRef && (
          <Link to={getTenantPath(`/bible/${parsedRef.bookAbbrev}/${parsedRef.chapter}`)}>
            <Card className="p-6 md:p-8 flex items-center justify-between group bg-card/40 backdrop-blur-md border-border/40 rounded-[32px] hover:bg-primary/5 hover:border-primary/20 transition-all shadow-soft overflow-hidden relative">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center text-primary transition-transform group-hover:scale-110">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-serif font-bold text-lg text-foreground group-hover:text-primary transition-colors">Estudar Capítulo</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Ver contexto completo</p>
                </div>
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 group-hover:translate-x-1 transition-transform" />
            </Card>
          </Link>
        )}

        {/* Version Attribution Card */}
        <div className="text-center py-6">
           <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 mb-1">Versão utilizada</p>
           <p className="text-xs font-bold text-muted-foreground/60">
             {versionInfo?.fullName || "Almeida Revista e Atualizada"}
           </p>
        </div>
      </section>

      {/* Floating Interactive Action Bar */}
      <div className="fixed bottom-16 md:bottom-8 left-4 right-4 z-40 animate-slide-up" style={{ animationDelay: "400ms" }}>
        <Card className="max-w-lg mx-auto bg-background/80 backdrop-blur-xl border-border/40 shadow-2xl-soft rounded-[32px] p-4 md:p-6 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                Passo {currentItem} de {totalItems}
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                Finalizando o Dia {day.day_number}
              </span>
            </div>
            {isDayCompleted && (
               <Badge className="bg-green-500/10 text-green-600 border-0 rounded-full px-4 py-1 font-black text-[9px] uppercase tracking-tighter">
                  Semente Plantada
               </Badge>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-border/40 bg-white/50 shadow-soft group font-black uppercase text-[10px] tracking-widest" onClick={goBack}>
              <ChevronLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {hasDevotional ? "Texto" : "Sair"}
            </Button>

            {!isDayCompleted ? (
              <Button
                className="flex-[1.5] h-14 rounded-2xl bg-primary text-white shadow-soft font-black uppercase text-[10px] tracking-[0.2em] shadow-primary/20"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Check className="w-5 h-5 mr-2 stroke-[3]" />
                )}
                Finalizar Dia
              </Button>
            ) : (
              <Button
                className="flex-1 h-14 rounded-2xl bg-green-500 text-white shadow-soft font-black uppercase text-[10px] tracking-widest"
                onClick={() => navigate(getTenantPath(`/plans/${planId}/days`))}
              >
                <Check className="w-5 h-5 mr-2 stroke-[3]" />
                Concluído
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

export default PlanVerse;
