import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useReadingPlans, ReadingPlanDay } from "@/hooks/useReadingPlans";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  Check,
  BookOpen,
  Lock,
  Loader2,
  MoreHorizontal,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PlanDetail = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    plans,
    getPlanProgress,
    fetchPlanDays,
    fetchCompletedDays,
    isInPlan,
  } = useReadingPlans();

  const [days, setDays] = useState<ReadingPlanDay[]>([]);
  const [completedDayIds, setCompletedDayIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const plan = plans.find((p) => p.id === planId);
  const progress = planId ? getPlanProgress(planId) : null;
  const currentDay = progress?.current_day || 1;
  const progressPercent = plan
    ? Math.round(((currentDay - 1) / plan.duration_days) * 100)
    : 0;

  useEffect(() => {
    const loadDays = async () => {
      if (!planId) return;

      setLoading(true);
      try {
        const [daysData, completed] = await Promise.all([
          fetchPlanDays(planId),
          fetchCompletedDays(planId),
        ]);
        setDays(daysData);
        setCompletedDayIds(completed);

        const currentIndex = daysData.findIndex((d) => d.day_number === currentDay);
        setSelectedDayIndex(currentIndex >= 0 ? currentIndex : 0);
      } catch (error) {
        console.error("Error loading plan days:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDays();
  }, [planId, currentDay, fetchPlanDays, fetchCompletedDays]);

  useEffect(() => {
    if (scrollRef.current && days.length > 0) {
      const dayElement = scrollRef.current.children[selectedDayIndex] as HTMLElement;
      if (dayElement) {
        dayElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDayIndex, days.length]);

  const isDayCompleted = (dayId: string) => completedDayIds.includes(dayId);
  const isDayLocked = (dayNumber: number) => dayNumber > currentDay;

  const selectedDay = days[selectedDayIndex];

  const getDateForDay = (dayNumber: number) => {
    if (!progress?.started_at) return null;
    const startDate = new Date(progress.started_at);
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayNumber - 1);
    return date;
  };

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
           <BookOpen className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Plano não encontrado</h2>
        <Button variant="link" onClick={() => navigate(getTenantPath("/plans"))} className="text-primary font-bold">
          Ver todos os planos
        </Button>
      </div>
    );
  }

  if (!isInPlan(plan.id)) {
    navigate(getTenantPath(`/plans/${planId}`));
    return null;
  }

  return (
    <div className="w-full max-w-lg md:max-w-4xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(getTenantPath("/plans"))}
            className="rounded-full bg-secondary/50 flex-shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0 text-center">
            <h1 className="text-base font-serif font-bold text-foreground truncate">
              {plan.title}
            </h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Sua Jornada Diária</p>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full bg-secondary/20">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="mt-6 px-2">
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-0.5">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Progresso Geral</p>
               <p className="text-xs font-bold">Dia {currentDay} de {plan.duration_days}</p>
            </div>
            <span className="text-lg font-black text-primary font-serif">
              {progressPercent}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full shadow-inner bg-secondary/50" />
        </div>
      </header>

      {/* Cover Backdrop (Premium look) */}
      <div className="relative h-48 md:h-64 w-full overflow-hidden">
        {plan.thumbnail_url ? (
          <>
            <img
              src={plan.thumbnail_url}
              alt={plan.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10" />
        )}
      </div>

      <main className="relative -mt-12 md:-mt-16 px-4 space-y-8">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-4 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando dias...</p>
          </div>
        ) : (
          <>
            {/* Day Selector Carousel */}
            <section className="bg-card/40 backdrop-blur-md rounded-3xl p-4 shadow-soft border border-white/20">
              <ScrollArea className="w-full whitespace-nowrap">
                <div ref={scrollRef} className="flex gap-3 px-2 pb-4">
                  {days.map((day, index) => {
                    const completed = isDayCompleted(day.id);
                    const locked = isDayLocked(day.day_number);
                    const isCurrent = day.day_number === currentDay;
                    const isSelected = index === selectedDayIndex;
                    const date = getDateForDay(day.day_number);

                    return (
                      <button
                        key={day.id}
                        onClick={() => !locked && setSelectedDayIndex(index)}
                        disabled={locked}
                        className={cn(
                          "flex-shrink-0 w-20 flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all duration-300 relative group",
                          isSelected
                            ? "border-primary bg-primary/5 shadow-soft scale-105"
                            : "border-transparent bg-secondary/20 grayscale translate-y-1",
                          completed && "border-green-500/20 grayscale-0",
                          locked && "opacity-30 cursor-not-allowed scale-95"
                        )}
                      >
                        <p className={cn(
                          "text-[9px] font-black uppercase tracking-tighter",
                          isSelected ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {date ? format(date, "d MMM", { locale: ptBR }) : `Dia ${day.day_number}`}
                        </p>
                        
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                            completed
                              ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
                              : isCurrent
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "bg-white text-foreground/40"
                          )}
                        >
                          {completed ? (
                            <Check className="w-6 h-6 stroke-[3]" />
                          ) : locked ? (
                            <Lock className="w-5 h-5 opacity-40" />
                          ) : (
                            <span className="text-sm font-black">{day.day_number}</span>
                          )}
                        </div>
                        
                        {isCurrent && !completed && (
                           <div className="absolute -top-1 -right-1">
                              <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-bounce" />
                           </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </section>

            {/* Selected Day Content Details */}
            {selectedDay && (
              <div className="animate-slide-up space-y-6">
                <div className="flex items-start justify-between px-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Atividades do Dia</p>
                    <h2 className="text-2xl font-serif font-bold text-foreground">
                       {selectedDay.title || `Caminhada do Dia ${selectedDay.day_number}`}
                    </h2>
                  </div>
                  {selectedDay.day_number === currentDay && (
                    <Badge className="bg-orange-500/10 text-orange-600 border-0 rounded-full px-3 py-1 flex items-center gap-1.5">
                      <Flame className="w-3 h-3 fill-current" />
                      <span className="text-[9px] font-black uppercase tracking-tighter">Hoje</span>
                    </Badge>
                  )}
                </div>

                {/* Day Content Cards */}
                <Card className="divide-y border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                  {/* Devotional Link */}
                  {selectedDay.devotional_title && (
                    <Link
                      to={getTenantPath(`/plans/${planId}/day/${selectedDay.id}/devotional`)}
                      className={cn(
                        "group flex items-center gap-4 p-6 transition-all",
                        isDayLocked(selectedDay.day_number)
                          ? "pointer-events-none opacity-50"
                          : "hover:bg-primary/5"
                      )}
                    >
                      <div className={cn(
                         "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                         isDayCompleted(selectedDay.id) ? "bg-green-500/10 text-green-600" : "bg-primary/10 text-primary border-2 border-primary/20"
                      )}>
                        {isDayCompleted(selectedDay.id) ? (
                          <Check className="w-6 h-6 stroke-[3]" />
                        ) : (
                          <Flame className="w-6 h-6" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Meditação diária</p>
                        <p className="font-serif font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {selectedDay.devotional_title}
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                  )}

                  {/* Verse Link */}
                  {selectedDay.verse_reference && (
                    <Link
                      to={getTenantPath(`/plans/${planId}/day/${selectedDay.id}/verse`)}
                      className={cn(
                        "group flex items-center gap-4 p-6 transition-all",
                        isDayLocked(selectedDay.day_number)
                          ? "pointer-events-none opacity-50"
                          : "hover:bg-primary/5"
                      )}
                    >
                      <div className={cn(
                         "w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center border-2 border-gold/20",
                         isDayCompleted(selectedDay.id) && "bg-green-500/10 text-green-600 border-green-500/10"
                      )}>
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-0.5">Versículo do Dia</p>
                        <p className="font-serif font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {selectedDay.verse_reference}
                        </p>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-muted-foreground rotate-180 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Link>
                  )}

                  {/* Bible Readings Section */}
                  {selectedDay.readings.length > 0 && (
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 rounded-lg bg-indigo-light/10">
                           <BookOpen className="w-4 h-4 text-indigo-light" />
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Leituras Bíblicas</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedDay.readings.map((reading, idx) => (
                          <Link
                            key={idx}
                            to={getTenantPath(`/bible/${reading.book.toLowerCase()}/${reading.chapter}`)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl transition-all border border-border/50 bg-white/50 hover:bg-white hover:shadow-soft hover:scale-[1.02] shadow-sm",
                              isDayLocked(selectedDay.day_number)
                                ? "pointer-events-none opacity-50"
                                : ""
                            )}
                          >
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-xs font-black">
                                  {idx + 1}
                               </div>
                               <span className="font-bold text-sm">{reading.book} {reading.chapter}</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-30" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Primary Action Button */}
                {!isDayLocked(selectedDay.day_number) && !isDayCompleted(selectedDay.id) && (
                  <Button
                    className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-soft hover:opacity-90 active:scale-95 transition-all"
                    onClick={() => {
                      if (selectedDay.devotional_title) {
                        navigate(getTenantPath(`/plans/${planId}/day/${selectedDay.id}/devotional`));
                      } else if (selectedDay.verse_reference) {
                        navigate(getTenantPath(`/plans/${planId}/day/${selectedDay.id}/verse`));
                      } else if (selectedDay.readings.length > 0) {
                        const r = selectedDay.readings[0];
                        navigate(getTenantPath(`/bible/${r.book.toLowerCase()}/${r.chapter}`));
                      }
                    }}
                  >
                    Começar minha Jornada
                  </Button>
                )}

                {isDayCompleted(selectedDay.id) && (
                  <div className="text-center py-10 bg-green-500/5 rounded-3xl border-2 border-dashed border-green-500/20 animate-scale-in">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                       <Check className="w-10 h-10 stroke-[3]" />
                    </div>
                    <p className="font-serif font-black text-xl text-green-600">Dia Concluído!</p>
                    <p className="text-xs font-bold text-green-600/60 uppercase tracking-widest mt-1">Glória a Deus por sua constância</p>
                  </div>
                )}
              </div>
            )}

            {days.length === 0 && !loading && (
              <div className="px-6 py-20 text-center bg-secondary/10 rounded-3xl border-2 border-dashed border-border/50 opacity-50 translate-y-4">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="font-serif font-bold text-lg">Sem cronograma definido</h3>
                <p className="text-sm text-muted-foreground">Esta jornada está sendo preparada.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PlanDetail;
