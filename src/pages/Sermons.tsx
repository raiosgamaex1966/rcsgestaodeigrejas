import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSermons, useThemes } from "@/hooks/useSermons";
import { useAuth } from "@/hooks/useAuth";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Search, Play, Clock, Eye, Filter, Mic, Music2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Sermons = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Todos");
  const { canRecord, getTenantPath } = useAuth();
  const { settings } = useChurchSettings();

  const { data: sermons = [], isLoading: sermonsLoading } = useSermons();
  const { data: themes = [], isLoading: themesLoading } = useThemes();

  const churchLogo = settings?.logo_url;

  const allThemes = ["Todos", ...themes.map(t => t.name)];

  const filteredSermons = sermons.filter((sermon) => {
    const matchesSearch = sermon.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sermon.preacher?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTheme = selectedTheme === "Todos" || sermon.theme?.name === selectedTheme;
    return matchesSearch && matchesTheme;
  });

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h${m}min` : `${m}min`;
  };

  return (
    <div className="w-full max-w-lg md:max-w-6xl mx-auto pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">
              Ministrações
            </h1>
            {canRecord && (
              <Button variant="gold" size="sm" asChild>
                <Link to={getTenantPath("/sermons/record")}>
                  <Mic className="w-4 h-4 mr-2" />
                  Gravar
                </Link>
              </Button>
            )}
          </div>

          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ministração..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground text-foreground"
              />
            </div>

            {/* Theme Filter */}
            <div className="flex gap-2 overflow-x-auto md:overflow-visible md:flex-wrap pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
              {themesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-20 shrink-0" />
                ))
              ) : (
                allThemes.map((theme) => (
                  <Button
                    key={theme}
                    variant={selectedTheme === theme ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTheme(theme)}
                    className={cn(
                      "shrink-0 text-xs",
                      selectedTheme === theme && "shadow-soft"
                    )}
                  >
                    {theme}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-6 py-4 md:py-6 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />

        {sermonsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-0 overflow-hidden border-border/20 bg-card/40 backdrop-blur-md">
                <div className="flex gap-4">
                  <Skeleton className="w-28 h-28 shrink-0 rounded-none bg-muted/20" />
                  <div className="flex-1 p-4 space-y-3">
                    <Skeleton className="h-4 w-12 rounded-full bg-muted/20" />
                    <Skeleton className="h-5 w-full bg-muted/20" />
                    <Skeleton className="h-4 w-24 bg-muted/20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-3 w-10 bg-muted/10" />
                      <Skeleton className="h-3 w-10 bg-muted/10" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredSermons.length === 0 ? (
          <div className="py-20 text-center animate-fade-in bg-card/30 backdrop-blur-sm rounded-3xl border border-border/20">
            <div className="w-20 h-20 bg-muted/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              Ops! Nada por aqui
            </h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {sermons.length === 0
                ? "As ministrações ainda estão sendo preparadas. Volte em breve!"
                : "Não encontramos nada com esses filtros. Que tal tentar outra busca?"
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSermons.map((sermon, index) => (
              <Link key={sermon.id} to={getTenantPath(`/sermons/${sermon.id}`)} className="group">
                <Card
                  className="overflow-hidden cursor-pointer bg-card/40 backdrop-blur-md border border-border/30 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 animate-slide-up h-full active:scale-[0.98]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex gap-0">
                    <div className="relative flex-shrink-0 w-28 h-28 md:w-32 md:h-32 overflow-hidden">
                      {sermon.thumbnail_url ? (
                        <img
                          src={sermon.thumbnail_url}
                          alt={sermon.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : churchLogo ? (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center p-4">
                          <img
                            src={churchLogo}
                            alt="Logo"
                            className="w-full h-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-background flex items-center justify-center">
                          <Music2 className="w-10 h-10 text-primary/40" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-[2px]">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transform scale-75 group-hover:scale-100 transition-transform duration-500">
                          <Play className="w-6 h-6 text-white fill-white" />
                        </div>
                      </div>

                      {sermon.is_featured && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 text-[8px] font-black bg-gold text-gold-foreground rounded-full shadow-lg z-10">
                          DESTAQUE
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {sermon.theme && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter"
                            style={{
                              backgroundColor: `${sermon.theme.color}15`,
                              color: sermon.theme.color,
                              border: `1px solid ${sermon.theme.color}30`
                            }}
                          >
                            {sermon.theme.name}
                          </span>
                        )}
                        {sermon.recorded_at && (
                          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase">
                            {new Date(sermon.recorded_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors text-base leading-snug">
                        {sermon.title}
                      </h3>
                      <p className="text-xs text-muted-foreground/80 mb-2 truncate font-medium underline decoration-primary/20">
                        {sermon.preacher?.name || "Pregador não informado"}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-primary/50" />
                          {formatDuration(sermon.duration_minutes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3 text-secondary/50" />
                          {sermon.views.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sermons;
