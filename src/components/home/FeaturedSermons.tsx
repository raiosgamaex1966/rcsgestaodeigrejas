import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Play, Clock, Eye, ChevronRight, Headphones, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSermons } from "@/hooks/useSermons";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { Skeleton } from "@/components/ui/skeleton";

export const FeaturedSermons = () => {
  const { data: sermons = [], isLoading } = useSermons();
  const { settings } = useChurchSettings();
  
  const featured = sermons.filter(s => s.is_featured).slice(0, 3);
  const churchLogo = settings?.logo_url;

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "0min";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}min`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (featured.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif font-semibold text-foreground">Ministrações em Destaque</h2>
        <Link to="/sermons" className="text-sm text-accent font-medium flex items-center gap-1 hover:gap-2 transition-all">
          Ver todas <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {featured.map((sermon, index) => (
          <Link key={sermon.id} to={`/sermons/${sermon.id}`}>
            <Card 
              variant="bordered"
              className="p-4 hover:shadow-soft transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex gap-4">
                {/* Thumbnail with fallback */}
                <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden group cursor-pointer">
                  {sermon.thumbnail_url ? (
                    <img 
                      src={sermon.thumbnail_url} 
                      alt={sermon.title}
                      className="w-full h-full object-cover"
                    />
                  ) : churchLogo ? (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center p-2">
                      <img 
                        src={churchLogo} 
                        alt="Logo da Igreja"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                      <Music2 className="w-8 h-8 text-primary-foreground" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {sermon.theme && (
                    <span 
                      className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mb-1"
                      style={{ 
                        backgroundColor: `${sermon.theme.color}20`,
                        color: sermon.theme.color 
                      }}
                    >
                      {sermon.theme.name}
                    </span>
                  )}
                  <h3 className="font-medium text-foreground line-clamp-1 mb-1">
                    {sermon.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {sermon.preacher?.name || "Pregador não informado"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(sermon.duration_minutes)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {sermon.views}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
      
      <Button variant="subtle" className="w-full" asChild>
        <Link to="/sermons">
          <Headphones className="w-4 h-4 mr-2" />
          Explorar Biblioteca
        </Link>
      </Button>
    </div>
  );
};
