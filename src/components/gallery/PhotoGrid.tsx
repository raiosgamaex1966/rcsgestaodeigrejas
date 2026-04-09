import { useState, useEffect, useRef, useCallback } from "react";
import { Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo } from "@/hooks/usePhotos";

interface PhotoGridProps {
  photos: Photo[];
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onPhotoClick?: (photo: Photo, index: number) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
}

export const PhotoGrid = ({
  photos,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  onPhotoClick,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: PhotoGridProps) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [onLoadMore, hasMore, isLoadingMore]);

  const handleImageLoad = useCallback((id: string) => {
    setLoadedImages((prev) => new Set(prev).add(id));
  }, []);

  const toggleSelection = (photoId: string, e: React.MouseEvent) => {
    if (!selectable || !onSelectionChange) return;
    e.stopPropagation();
    
    const newSelection = new Set(selectedIds);
    if (newSelection.has(photoId)) {
      newSelection.delete(photoId);
    } else {
      newSelection.add(photoId);
    }
    onSelectionChange(newSelection);
  };

  const handleClick = (photo: Photo, index: number, e: React.MouseEvent) => {
    if (selectable) {
      toggleSelection(photo.id, e);
    } else if (onPhotoClick) {
      onPhotoClick(photo, index);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
      {photos.map((photo, index) => {
        const isSelected = selectedIds.has(photo.id);
        const isLoaded = loadedImages.has(photo.id);
        
        return (
          <div
            key={photo.id}
            className={cn(
              "relative aspect-square overflow-hidden rounded-lg cursor-pointer group transition-all duration-200",
              isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
            )}
            onClick={(e) => handleClick(photo, index, e)}
          >
            {/* Skeleton placeholder */}
            {!isLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse" />
            )}
            
            {/* Image */}
            <img
              src={photo.thumbnail_url || photo.image_url}
              alt=""
              className={cn(
                "w-full h-full object-cover transition-all duration-300",
                "group-hover:scale-105",
                !isLoaded && "opacity-0"
              )}
              loading="lazy"
              onLoad={() => handleImageLoad(photo.id)}
            />

            {/* Hover overlay */}
            <div className={cn(
              "absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors",
              isSelected && "bg-primary/20"
            )} />

            {/* Selection checkbox */}
            {selectable && (
              <div
                className={cn(
                  "absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-white/80 border-white/80 opacity-0 group-hover:opacity-100"
                )}
              >
                {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
            )}

            {/* Face count indicator */}
            {photo.faces_count > 0 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                {photo.faces_count}
              </div>
            )}
          </div>
        );
      })}

      {/* Load more trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="col-span-full flex justify-center py-4">
          {isLoadingMore && (
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
};
