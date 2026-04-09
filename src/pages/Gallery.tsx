import { useState, useMemo } from "react";
import { Camera, ImageIcon } from "lucide-react";
import { AlbumCard } from "@/components/gallery/AlbumCard";
import { GalleryFilters } from "@/components/gallery/GalleryFilters";
import { usePhotoAlbums } from "@/hooks/usePhotoAlbums";
import { Skeleton } from "@/components/ui/skeleton";

const Gallery = () => {
  const { albums, isLoading } = usePhotoAlbums(true); // Only published albums
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  // Extract unique years from albums
  const years = useMemo(() => {
    const yearSet = new Set<number>();
    albums.forEach((album) => {
      if (album.event_date) {
        yearSet.add(new Date(album.event_date).getFullYear());
      }
    });
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [albums]);

  // Filter albums
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      const matchesSearch =
        !search ||
        album.name.toLowerCase().includes(search.toLowerCase()) ||
        album.description?.toLowerCase().includes(search.toLowerCase());

      const matchesYear =
        !selectedYear ||
        (album.event_date &&
          new Date(album.event_date).getFullYear().toString() === selectedYear);

      return matchesSearch && matchesYear;
    });
  }, [albums, search, selectedYear]);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-soft">
              <Camera className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-foreground">
              Galeria de Fotos
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Reviva os melhores momentos dos nossos cultos e eventos
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 py-6 md:px-6">
        {/* Filters */}
        <div className="mb-8">
          <GalleryFilters
            onSearchChange={setSearch}
            onYearChange={setSelectedYear}
            years={years}
            selectedYear={selectedYear}
          />
        </div>

        {/* Albums Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden animate-pulse">
                <Skeleton className="aspect-[4/3]" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="text-center py-20 animate-fade-in bg-card/30 backdrop-blur-sm rounded-3xl border border-border/20">
            <div className="w-20 h-20 rounded-full bg-muted/10 flex items-center justify-center mx-auto mb-6">
              <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-serif font-bold text-foreground mb-2">
              {search || selectedYear ? "Nenhum álbum encontrado" : "Nenhum álbum disponível"}
            </h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {search || selectedYear
                ? "Tente ajustar os filtros de busca para encontrar o que procura."
                : "Os álbuns de fotos aparecerão aqui quando forem publicados pela igreja."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredAlbums.map((album, index) => (
              <div key={album.id} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                <AlbumCard album={album} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Gallery;
