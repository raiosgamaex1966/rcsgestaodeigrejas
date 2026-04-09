import { Link } from "react-router-dom";
import { Calendar, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { PhotoAlbum } from "@/hooks/usePhotoAlbums";

interface AlbumCardProps {
  album: PhotoAlbum;
  className?: string;
}

export const AlbumCard = ({ album, className }: AlbumCardProps) => {
  return (
    <Link
      to={`/gallery/${album.id}`}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:border-primary/30",
        className
      )}
    >
      {/* Cover Image */}
      <div className="aspect-[4/3] relative overflow-hidden">
        {album.cover_url ? (
          <img
            src={album.cover_url}
            alt={album.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          {album.photos_count}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {album.name}
        </h3>
        
        {album.event_date && (
          <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {format(new Date(album.event_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
            </span>
          </div>
        )}
        
        {album.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {album.description}
          </p>
        )}
      </div>
    </Link>
  );
};
