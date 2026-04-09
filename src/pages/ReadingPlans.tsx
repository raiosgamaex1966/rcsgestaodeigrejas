import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useReadingPlans, ReadingPlan } from "@/hooks/useReadingPlans";
import { useAuth } from "@/hooks/useAuth";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  Play,
  CheckCircle2,
  Loader2,
  Bookmark,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TAG_COLORS: Record<string, string> = {
  AMOR: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  CURA: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  ESPERANÇA: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  FÉ: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  ANSIEDADE: "bg-violet-500/10 text-violet-600 border-violet-500/30",
  RAIVA: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  DEPRESSÃO: "bg-slate-500/10 text-slate-600 border-slate-500/30",
  RELACIONAMENTOS: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  PERDÃO: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  GRATIDÃO: "bg-lime-500/10 text-lime-600 border-lime-500/30",
  PAZ: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  FORÇA: "bg-red-500/10 text-red-600 border-red-500/30",
  SABEDORIA: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  FAMÍLIA: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  TRABALHO: "bg-blue-500/10 text-blue-600 border-blue-500/30",
};

const PlanCard = ({ plan, progress, onClick }: { 
  plan: ReadingPlan; 
  progress?: { current_day: number } | null;
  onClick: () => void;
}) => {
  const progressPercent = progress
    ? Math.round(((progress.current_day - 1) / plan.duration_days) * 100)
    : 0;

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-card transition-all border border-border/50 bg-card/40 backdrop-blur-md group"
      onClick={onClick}
    >
      {plan.thumbnail_url && (
        <div className="h-32 rounded-lg overflow-hidden mb-3 bg-muted">
          <img
            src={plan.thumbnail_url}
            alt={plan.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">{plan.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Calendar className="w-3 h-3" />
            <span>{plan.duration_days} dias</span>
            {plan.author && (
              <>
                <span>•</span>
                <User className="w-3 h-3" />
                <span className="truncate">{plan.author}</span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
      </div>
      {progress && (
        <div className="mt-4">
          <Progress value={progressPercent} className="h-1.5" />
          <div className="flex justify-between items-center mt-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Dia {progress.current_day} de {plan.duration_days}
            </p>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
              {progressPercent}%
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};

const FeaturedCard = ({ plan, onClick }: { plan: ReadingPlan; onClick: () => void }) => (
  <Card
    className="relative overflow-hidden cursor-pointer min-w-[300px] h-[180px] flex-shrink-0 shadow-soft group border-0"
    onClick={onClick}
  >
    {plan.thumbnail_url ? (
      <img
        src={plan.thumbnail_url}
        alt={plan.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5" />
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="bg-gold/20 backdrop-blur-md p-1 rounded">
          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
        </div>
        <span className="text-[10px] font-black tracking-widest uppercase text-gold">Destaque</span>
      </div>
      <h3 className="font-bold text-xl leading-tight mb-1 group-hover:underline decoration-gold/50">{plan.title}</h3>
      <p className="text-xs text-white/70 font-medium uppercase tracking-widest">{plan.duration_days} dias</p>
    </div>
  </Card>
);

const ReadingPlans = () => {
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const {
    plans,
    loading,
    getPlanProgress,
    getActivePlans,
    getSavedPlansList,
    getCompletedPlans,
    getFeaturedPlans,
    getAllTags,
    getPlansByCategory,
    getAllCategories,
    isInPlan,
  } = useReadingPlans();
  
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const activePlans = getActivePlans();
  const savedPlans = getSavedPlansList();
  const completedPlans = getCompletedPlans();
  const featuredPlans = getFeaturedPlans();
  const allTags = getAllTags();
  const allCategories = getAllCategories();

  const filteredPlans = selectedTag
    ? plans.filter(p => p.tags?.includes(selectedTag) && !isInPlan(p.id))
    : plans.filter(p => !isInPlan(p.id));

  const handlePlanClick = (planId: string) => {
    if (isInPlan(planId)) {
      navigate(getTenantPath(`/plans/${planId}/info`)); // Changed to info/details as starting point
    } else {
      navigate(getTenantPath(`/plans/${planId}`));
    }
  };

  return (
    <div className="w-full max-w-lg md:max-w-4xl mx-auto pb-24 px-0 animate-fade-in">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4">
          <h1 className="text-xl font-serif font-bold text-foreground">
            Planos de Leitura
          </h1>
          <p className="text-sm text-muted-foreground">Estude a palavra diariamente</p>
        </div>
      </header>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Sincronizando seus planos...</p>
        </div>
      ) : (
        <Tabs defaultValue="discover" className="w-full">
          <div className="px-4 py-4">
            <TabsList className="w-full bg-secondary/50 p-1 h-auto gap-1 rounded-xl">
              <TabsTrigger value="active" className="flex-1 text-[10px] py-2 px-1 font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-soft">
                Meus
                {activePlans.length > 0 && (
                  <span className="ml-2 bg-primary/10 text-primary px-1.5 py-0.5 rounded-md text-[9px]">
                    {activePlans.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="discover" className="flex-1 text-[10px] py-2 px-1 font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-soft">Descobrir</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1 text-[10px] py-2 px-1 font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-soft">Salvos</TabsTrigger>
              <TabsTrigger value="completed" className="flex-1 text-[10px] py-2 px-1 font-bold uppercase tracking-widest rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-soft">Histórico</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="active" className="mt-0 focus-visible:outline-none">
            <div className="px-4 py-2 space-y-4">
              {activePlans.length === 0 ? (
                <div className="py-20 text-center animate-fade-in bg-card/30 backdrop-blur-sm rounded-3xl border border-border/20 border-dashed m-4">
                  <Play className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">Você não tem planos ativos</p>
                  <Button variant="link" onClick={() => navigate(getTenantPath("/plans"))} className="text-primary font-bold">
                    Descobrir um novo plano
                  </Button>
                </div>
              ) : (
                activePlans.map((plan, index) => (
                  <div key={plan.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <PlanCard
                      plan={plan}
                      progress={getPlanProgress(plan.id)}
                      onClick={() => handlePlanClick(plan.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="discover" className="mt-0 focus-visible:outline-none">
            <div className="py-2 space-y-8">
              {featuredPlans.length > 0 && (
                <section>
                  <h2 className="px-4 text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">
                    Recomendados para você
                  </h2>
                  <ScrollArea className="w-full">
                    <div className="flex gap-4 px-4 pb-4">
                      {featuredPlans.map((plan) => (
                        <FeaturedCard
                          key={plan.id}
                          plan={plan}
                          onClick={() => handlePlanClick(plan.id)}
                        />
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </section>
              )}

              {allTags.length > 0 && (
                <section className="px-4">
                  <h2 className="text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">Temas</h2>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={cn(
                          "cursor-pointer transition-all rounded-full px-4 py-1.5 border-border/50 hover:border-primary/50",
                          TAG_COLORS[tag] || "bg-gray-500/10 text-gray-600",
                          selectedTag === tag && "ring-2 ring-primary bg-primary/10"
                        )}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {selectedTag && (
                <section className="px-4 animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-serif font-bold">Planos de {selectedTag}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTag(null)} className="text-xs font-bold uppercase text-muted-foreground">
                      Limpar
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPlans.map((plan) => (
                      <PlanCard
                        key={plan.id}
                        plan={plan}
                        onClick={() => handlePlanClick(plan.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {!selectedTag && allCategories.map((category) => {
                const categoryPlans = getPlansByCategory(category);
                if (categoryPlans.length === 0) return null;

                return (
                  <section key={category}>
                    <h2 className="px-4 text-xs font-black text-muted-foreground/60 uppercase tracking-[0.2em] mb-4">
                      {category}
                    </h2>
                    <ScrollArea className="w-full">
                      <div className="flex gap-4 px-4 pb-4">
                        {categoryPlans.map((plan) => (
                          <div key={plan.id} className="min-w-[280px]">
                            <PlanCard
                              plan={plan}
                              onClick={() => handlePlanClick(plan.id)}
                            />
                          </div>
                        ))}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </section>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-0 focus-visible:outline-none">
            <div className="px-4 py-2 space-y-4">
              {savedPlans.length === 0 ? (
                <div className="py-20 text-center animate-fade-in bg-card/30 backdrop-blur-sm rounded-3xl border border-border/20 border-dashed m-4">
                  <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">Nenhum plano salvo para depois</p>
                </div>
              ) : (
                savedPlans.map((plan, index) => (
                  <div key={plan.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <PlanCard
                      plan={plan}
                      onClick={() => handlePlanClick(plan.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-0 focus-visible:outline-none">
            <div className="px-4 py-2 space-y-4">
              {completedPlans.length === 0 ? (
                <div className="py-20 text-center animate-fade-in bg-card/30 backdrop-blur-sm rounded-3xl border border-border/20 border-dashed m-4">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">Você ainda não concluiu nenhum plano</p>
                </div>
              ) : (
                completedPlans.map((plan, index) => (
                  <div key={plan.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                    <Card className="p-5 bg-card/40 backdrop-blur-md border border-border/40 hover:shadow-soft transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{plan.title}</h3>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">
                            {plan.duration_days} dias • Concluído
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ReadingPlans;
