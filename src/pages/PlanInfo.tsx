import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReadingPlans } from "@/hooks/useReadingPlans";
import { useAuth } from "@/hooks/useAuth";
import {
  ChevronLeft,
  Play,
  Bookmark,
  BookmarkCheck,
  Calendar,
  User,
  Eye,
  Loader2,
  Clock,
  Layout,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TAG_COLORS: Record<string, string> = {
  AMOR: "bg-rose-500/10 text-rose-600",
  CURA: "bg-emerald-500/10 text-emerald-600",
  ESPERANÇA: "bg-sky-500/10 text-sky-600",
  FÉ: "bg-amber-500/10 text-amber-600",
  ANSIEDADE: "bg-violet-500/10 text-violet-600",
  RAIVA: "bg-orange-500/10 text-orange-600",
  DEPRESSÃO: "bg-slate-500/10 text-slate-600",
  RELACIONAMENTOS: "bg-pink-500/10 text-pink-600",
  PERDÃO: "bg-teal-500/10 text-teal-600",
  GRATIDÃO: "bg-lime-500/10 text-lime-600",
  PAZ: "bg-cyan-500/10 text-cyan-600",
  FORÇA: "bg-red-500/10 text-red-600",
  SABEDORIA: "bg-indigo-500/10 text-indigo-600",
  FAMÍLIA: "bg-purple-500/10 text-purple-600",
  TRABALHO: "bg-blue-500/10 text-blue-600",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

const PlanInfo = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, getTenantPath } = useAuth();
  const {
    plans,
    startPlan,
    savePlanForLater,
    unsavePlan,
    isPlanSaved,
    isInPlan,
    loading,
  } = useReadingPlans();

  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);

  const plan = plans.find((p) => p.id === planId);
  const saved = planId ? isPlanSaved(planId) : false;
  const alreadyInPlan = planId ? isInPlan(planId) : false;

  const handleStartPlan = async () => {
    if (!user) {
      toast.error("Faça login para iniciar");
      navigate("/auth");
      return;
    }
    if (!planId) return;

    setStarting(true);
    const result = await startPlan(planId);
    setStarting(false);

    if (result) {
      toast.success("Plano iniciado!");
      navigate(getTenantPath(`/plans/${planId}/days`));
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("Faça login para salvar");
      return;
    }
    if (!planId) return;

    setSaving(true);
    if (saved) {
      await unsavePlan(planId);
      toast.success("Plano removido dos salvos");
    } else {
      await savePlanForLater(planId);
      toast.success("Plano salvo para depois!");
    }
    setSaving(false);
  };

  const handlePreview = () => {
    if (planId) {
      navigate(getTenantPath(`/plans/${planId}/preview`));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4 opacity-50 animate-fade-in">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Consultando planos...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Layout className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Plano não encontrado</h2>
        <Button variant="link" onClick={() => navigate(getTenantPath("/plans"))} className="text-primary font-bold">
          Ver todos os planos
        </Button>
      </div>
    );
  }

  if (alreadyInPlan) {
    navigate(getTenantPath(`/plans/${planId}/days`));
    return null;
  }

  return (
    <div className="max-w-lg md:max-w-3xl mx-auto pb-24 animate-fade-in">
      {/* Dynamic Immersive Header */}
      <div className="relative group">
        {plan.thumbnail_url ? (
          <div className="h-72 md:h-96 w-full overflow-hidden transition-all duration-700 group-hover:scale-105">
            <img
              src={plan.thumbnail_url}
              alt={plan.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        ) : (
          <div className="h-56 bg-gradient-to-br from-primary/20 via-accent/10 to-background" />
        )}

        {/* Floating Top Controls */}
        <div className="absolute top-safe left-0 right-0 p-6 flex items-center justify-between z-20">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all active:scale-95 shadow-xl"
            onClick={() => navigate(getTenantPath("/plans"))}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full backdrop-blur-md border border-white/20 transition-all active:scale-95 shadow-xl",
              saved ? "bg-primary text-white border-primary" : "bg-white/10 text-white hover:bg-white/20"
            )}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : saved ? (
              <BookmarkCheck className="w-5 h-5 fill-current" />
            ) : (
              <Bookmark className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Content Section */}
      <main className="px-6 -mt-20 md:-mt-32 relative z-10 space-y-6">
        <Card className="p-8 md:p-10 border-border/40 shadow-2xl-soft bg-card/60 backdrop-blur-xl rounded-[40px] overflow-hidden">
          <div className="space-y-6">
             <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                   <Badge variant="secondary" className="bg-primary/10 text-primary border-0 rounded-full px-4 py-1.5 font-black text-[10px] uppercase tracking-widest">
                     {plan.category || "Plano Bíblico"}
                   </Badge>
                   {plan.difficulty && (
                    <Badge variant="outline" className="border-border/50 text-muted-foreground bg-white/50 rounded-full px-4 py-1 font-bold text-[10px] uppercase tracking-tight">
                      {DIFFICULTY_LABELS[plan.difficulty] || plan.difficulty}
                    </Badge>
                   )}
                </div>
                
                <h1 className="text-3xl md:text-5xl font-serif font-black text-foreground leading-tight">
                  {plan.title}
                </h1>

                <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground/80 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{plan.duration_days} dias</span>
                  </div>
                  {plan.author && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <span>{plan.author}</span>
                    </div>
                  )}
                </div>
             </div>

            {/* Tags Visualization */}
            {plan.tags && plan.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {plan.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className={cn("rounded-lg border-0 font-black text-[9px] uppercase tracking-tighter px-3 py-1", TAG_COLORS[tag] || "bg-secondary text-foreground/60")}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

            {/* Content Description */}
            {plan.description && (
              <p className="text-muted-foreground leading-[1.8] text-lg font-serif">
                {plan.description}
              </p>
            )}

            {/* Primary Actions Grid */}
            <div className="pt-4 space-y-4">
              <Button 
                className="w-full h-16 rounded-3xl bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-soft shadow-primary/20 hover:opacity-90 active:scale-95 transition-all" 
                size="lg" 
                onClick={handleStartPlan} 
                disabled={starting}
              >
                {starting ? (
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                ) : (
                  <Play className="w-6 h-6 mr-3 fill-white" />
                )}
                Iniciar Jornada
              </Button>

              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl border-border/40 bg-white/50 font-bold uppercase text-[10px] tracking-widest shadow-soft hover:bg-white" onClick={handleSave} disabled={saving}>
                  {saved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 mr-2 text-primary" />
                      Salvo
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button variant="outline" className="h-14 rounded-2xl border-border/40 bg-white/50 font-bold uppercase text-[10px] tracking-widest shadow-soft hover:bg-white" onClick={handlePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Informational Quick-Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-6 text-center border-border/30 bg-card shadow-soft rounded-3xl group hover:border-primary/30 transition-colors">
            <Calendar className="w-5 h-5 mx-auto mb-2 text-primary/40 group-hover:text-primary transition-colors" />
            <p className="text-2xl font-serif font-black text-foreground leading-none">{plan.duration_days}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">Dias</p>
          </Card>
          <Card className="p-6 text-center border-border/30 bg-card shadow-soft rounded-3xl group hover:border-indigo-light/30 transition-colors">
            <Clock className="w-5 h-5 mx-auto mb-2 text-indigo-light/40 group-hover:text-indigo-light transition-colors" />
            <p className="text-2xl font-serif font-black text-foreground leading-none">~5</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">Min/Dia</p>
          </Card>
          <Card className="p-6 text-center border-border/30 bg-card shadow-soft rounded-3xl group hover:border-gold/30 transition-colors">
            <Layout className="w-5 h-5 mx-auto mb-2 text-gold/40 group-hover:text-gold transition-colors" />
            <p className="text-2xl font-serif font-black text-foreground leading-none">
              {(plan.category || "Plano").charAt(0)}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-2">Tema</p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PlanInfo;
