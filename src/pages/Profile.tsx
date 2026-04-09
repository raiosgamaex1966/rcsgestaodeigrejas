import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { StreakCounter } from "@/components/gamification/StreakCounter";
import { PointsBadge } from "@/components/gamification/PointsBadge";
import { Leaderboard } from "@/components/gamification/Leaderboard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogOut,
  BookOpen,
  Heart,
  FileText,
  Calendar,
  Trophy,
  Settings,
  ChevronRight,
  Shield,
  UserCheck
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const Profile = () => {
  const { user, signOut, isAdmin, isMember, isVisitor, getTenantPath } = useAuth();
  const { gamification, achievements, userAchievements, leaderboard, loading } = useGamification();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [stats, setStats] = useState({ chapters: 0, favorites: 0, notes: 0, days: 0 });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single();
      setProfile(data);
    };

    const fetchStats = async () => {
      try {
        const [chaptersRes, favoritesRes, notesRes, historyRes] = await Promise.all([
          supabase.from("reading_history").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("bible_favorites").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("bible_notes").select("id", { count: "exact" }).eq("user_id", user.id),
          supabase.from("reading_history").select("read_at").eq("user_id", user.id),
        ]);

        const uniqueDays = new Set(
          (historyRes.data || []).map((r) => new Date(r.read_at!).toDateString())
        ).size;

        setStats({
          chapters: chaptersRes.count || 0,
          favorites: favoritesRes.count || 0,
          notes: notesRes.count || 0,
          days: uniqueDays,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchProfile();
    fetchStats();
  }, [user, navigate]);

  const earnedAchievementIds = new Set(userAchievements);
  const earnedAchievements = achievements.filter((a) => earnedAchievementIds.has(a.id));

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  const initials = profile?.full_name
    ?.split(" ")
    .filter(n => n.length > 0)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="w-full max-w-lg md:max-w-5xl mx-auto pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="flex items-center gap-2 px-4 md:px-6 py-4">
          <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground flex-1">Meu Perfil</h1>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button variant="ghost" size="sm" asChild className="hidden md:flex gap-2 text-primary bg-primary/5 hover:bg-primary/10 rounded-xl">
                <Link to={getTenantPath("/admin")}>
                  <Shield className="w-4 h-4" />
                  Painel Admin
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="icon" asChild className="md:hidden text-primary bg-primary/5 rounded-xl">
                <Link to={getTenantPath("/admin")}>
                  <Shield className="w-5 h-5" />
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild className="bg-secondary/50 rounded-xl">
              <Link to={getTenantPath("/settings")}>
                <Settings className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4 md:px-6 py-6">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Personal Info & Stats */}
          <div className="space-y-6">
            {/* Identity Card */}
            <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md overflow-hidden rounded-3xl">
              <CardContent className="pt-8 flex items-center gap-5">
                <Avatar className="w-20 h-20 md:w-24 md:h-24 border-4 border-white shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-secondary text-foreground text-2xl font-serif">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground leading-tight">
                    {profile?.full_name || "Membro de Fé"}
                  </h2>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{user.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Gamification Hub */}
            {isMember && (
              <div className="space-y-6">
                {loading ? (
                  <Skeleton className="h-48 w-full rounded-3xl" />
                ) : (
                  <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                    <CardHeader className="pb-2">
                       <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Sua Jornada Virtual</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <LevelProgress points={gamification?.total_points || 0} />
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-secondary/30 flex flex-col items-center text-center gap-1 group transition-colors hover:bg-secondary/50">
                           <StreakCounter streak={gamification?.current_streak || 0} />
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Dina em Sequência</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-primary/5 flex flex-col items-center text-center gap-1 group transition-colors hover:bg-primary/10">
                           <PointsBadge points={gamification?.total_points || 0} showLevel={false} />
                           <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">Pontos Totais</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Reading Stats Grid */}
            {isMember && (
              <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-serif font-bold">Resumo Devocional</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-light/5 border border-indigo-light/10 space-y-2">
                      <BookOpen className="w-5 h-5 text-indigo-light" />
                      <div>
                        <p className="text-xl font-black text-foreground">{stats.chapters}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lidos</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-burgundy/5 border border-burgundy/10 space-y-2">
                      <Heart className="w-5 h-5 text-burgundy" />
                      <div>
                        <p className="text-xl font-black text-foreground">{stats.favorites}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Favoritos</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 space-y-2">
                      <FileText className="w-5 h-5 text-accent" />
                      <div>
                        <p className="text-xl font-black text-foreground">{stats.notes}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Notas</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-gold/5 border border-gold/10 space-y-2">
                      <Calendar className="w-5 h-5 text-gold" />
                      <div>
                        <p className="text-xl font-black text-foreground">{stats.days}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Dias Ativos</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isVisitor && (
              <Card className="border-primary/20 shadow-soft bg-primary/5 rounded-3xl p-8 text-center space-y-6 animate-pulse-slow">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto text-primary rotate-3">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-xl text-primary leading-tight">Quer ser parte da nossa família?</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Membros têm acesso a planos exclusivos, conquistas digitais e muito mais.
                  </p>
                </div>
                <Button asChild className="w-full h-14 rounded-2xl bg-gold text-white font-black uppercase tracking-[0.2em] shadow-gold hover:opacity-90 active:scale-95 transition-all" variant="gold">
                  <Link to={getTenantPath("/become-member")}>Solicitar Membresia</Link>
                </Button>
              </Card>
            )}
          </div>

          {/* Right Column: Achievements & Leaderboard */}
          <div className="space-y-6">
            {/* Achievements Card */}
            {isMember && (
              <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-gold" />
                      Troféus
                    </CardTitle>
                    <Badge variant="secondary" className="bg-gold/10 text-gold border-0 font-black text-[10px] px-3 shadow-none">
                      {earnedAchievements.length}/{achievements.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {earnedAchievements.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {earnedAchievements.slice(0, 6).map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-3 p-3 bg-white/50 rounded-2xl border border-border/30 hover:border-gold/50 transition-colors group"
                          title={achievement.description || ""}
                        >
                          <span className="text-xl group-hover:scale-125 transition-transform duration-300">🏆</span>
                          <span className="text-[10px] font-black uppercase tracking-tighter text-foreground/80">{achievement.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-2 opacity-50">
                       <Trophy className="w-10 h-10 mx-auto text-muted-foreground/30" />
                       <p className="text-xs font-bold uppercase tracking-widest">Sua galeria está vazia</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Leaderboard Card */}
            {isMember && (
              <Card className="border-border/40 shadow-soft bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-serif font-bold flex items-center gap-2">
                     <span className="text-xl">🏅</span>
                     Ranking da Comunidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-64 w-full rounded-2xl" />
                  ) : (
                    <Leaderboard entries={leaderboard} />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Account Quick Actions */}
            <div className="space-y-3">
              {isMember && (
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="h-14 rounded-2xl justify-between px-6 border-border/40 bg-white shadow-soft group" asChild>
                    <Link to={getTenantPath("/plans")}>
                      <span className="flex items-center gap-3 font-serif font-bold">
                        <BookOpen className="w-5 h-5 text-indigo-light" />
                        Planos de Leitura
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  <Button variant="outline" className="h-14 rounded-2xl justify-between px-6 border-border/40 bg-white shadow-soft group" asChild>
                    <Link to={getTenantPath("/my-contributions")}>
                      <span className="flex items-center gap-3 font-serif font-bold">
                        <Heart className="w-5 h-5 text-burgundy" />
                        Minhas Ofertas
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              )}

              <Button
                variant="ghost"
                className="w-full h-14 rounded-2xl justify-start px-6 text-burgundy hover:text-burgundy hover:bg-burgundy/10 md:hidden font-bold uppercase text-[10px] tracking-[0.2em]"
                onClick={handleSignOut}
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sair da Conta
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
