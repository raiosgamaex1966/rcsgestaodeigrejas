import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Calendar, ImageIcon, Search, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { PhotoLightbox } from "@/components/gallery/PhotoLightbox";
import { FaceSearchModal } from "@/components/gallery/FaceSearchModal";
import { usePhotoAlbum } from "@/hooks/usePhotoAlbums";
import { usePhotos, Photo } from "@/hooks/usePhotos";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";

const GalleryAlbum = () => {
  const { albumId } = useParams();
  const { getTenantPath } = useAuth();
  const { data: album, isLoading: albumLoading } = usePhotoAlbum(albumId);
  const {
    photos,
    isLoading: photosLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePhotos(albumId);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [faceSearchOpen, setFaceSearchOpen] = useState(false);
  const [filteredPhotoIds, setFilteredPhotoIds] = useState<Set<string> | null>(null);

  const displayedPhotos = useMemo(() => {
    if (!filteredPhotoIds) return photos;
    return photos.filter((p) => filteredPhotoIds.has(p.id));
  }, [photos, filteredPhotoIds]);

  const handlePhotoClick = (photo: Photo, index: number) => {
    const actualIndex = photos.findIndex((p) => p.id === photo.id);
    setLightboxIndex(actualIndex >= 0 ? actualIndex : index);
    setLightboxOpen(true);
  };

  const handleFaceSearchResults = (matchingPhotos: Photo[]) => {
    const ids = new Set(matchingPhotos.map((p) => p.id));
    setFilteredPhotoIds(ids);
  };

  const clearFaceFilter = () => {
    setFilteredPhotoIds(null);
  };

  const photosWithFaces = photos.filter((p) => p.faces_count > 0).length;

  if (albumLoading) {
    return (
      <div className="min-h-screen bg-background p-6 pt-safe animate-fade-in">
        <Skeleton className="h-10 w-48 mb-8 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(15)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl shadow-soft" />
          ))}
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
          <ImageIcon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-serif font-bold mb-2">Álbum não encontrado</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">Este álbum pode ter sido removido ou o link está incorreto.</p>
        <Button variant="outline" className="rounded-xl px-8 h-12 uppercase text-[10px] font-black tracking-widest" asChild>
          <Link to={getTenantPath("/gallery")}>Voltar à Galeria</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50 pt-safe">
        <div className="px-4 py-4 md:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Button variant="ghost" size="icon" asChild className="rounded-full bg-secondary/50 flex-shrink-0">
                <Link to={getTenantPath("/gallery")}>
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-serif font-bold text-foreground truncate">
                  {album.name}
                </h1>
                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                  {album.event_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(album.event_date), "dd MMM yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  )}
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span>{album.photos_count} fotos</span>
                </div>
              </div>
            </div>

            {/* Face search button */}
            {photosWithFaces > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFaceSearchOpen(true)}
                className="rounded-xl h-10 px-4 gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 shadow-soft transition-all active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Buscar meu rosto</span>
              </Button>
            )}
          </div>

          {/* Active face filter indicator */}
          {filteredPhotoIds && (
            <div className="mt-4 flex items-center justify-between bg-primary/10 rounded-2xl px-4 py-3 border border-primary/20 animate-scale-in">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                   Mostrando {filteredPhotoIds.size} foto{filteredPhotoIds.size !== 1 ? "s" : ""} com você
                 </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFaceFilter}
                className="h-8 rounded-lg text-primary hover:text-primary hover:bg-primary/10 font-bold uppercase text-[9px] tracking-widest"
              >
                Limpar filtro
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Photos Content */}
      <main className="p-4 md:p-6 pb-24">
        {photosLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Carregando memórias...</p>
          </div>
        ) : displayedPhotos.length === 0 ? (
          <div className="text-center py-24 space-y-6 animate-slide-up">
            <div className="w-20 h-20 bg-secondary/50 rounded-3xl flex items-center justify-center mx-auto rotate-6">
               <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
               <h3 className="text-xl font-serif font-bold text-foreground">
                 {filteredPhotoIds ? "Nenhuma foto encontrada" : "Álbum vazio"}
               </h3>
               <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                 {filteredPhotoIds
                   ? "Não conseguimos identificar seu rosto nessas fotos. Tente outra imagem ou verifique a iluminação."
                   : "Este álbum ainda não possui fotografias registradas."}
               </p>
            </div>
            {filteredPhotoIds && (
              <Button variant="outline" onClick={clearFaceFilter} className="rounded-xl px-8 h-12 uppercase text-[10px] font-black tracking-widest shadow-soft">
                Ver todas as fotos
              </Button>
            )}
          </div>
        ) : (
          <div className="animate-slide-up">
            <PhotoGrid
              photos={displayedPhotos}
              onPhotoClick={handlePhotoClick}
              onLoadMore={filteredPhotoIds ? undefined : fetchNextPage}
              hasMore={filteredPhotoIds ? false : hasNextPage}
              isLoadingMore={isFetchingNextPage}
            />
          </div>
        )}
      </main>

      {/* Overlay Components */}
      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />

      <FaceSearchModal
        isOpen={faceSearchOpen}
        onClose={() => setFaceSearchOpen(false)}
        photos={photos}
        onResults={handleFaceSearchResults}
      />
    </div>
  );
};

export default GalleryAlbum;
