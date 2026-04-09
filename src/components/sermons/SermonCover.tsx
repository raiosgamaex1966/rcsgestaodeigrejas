import { cn } from "@/lib/utils";
import { Music2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface SermonCoverProps {
  thumbnailUrl?: string | null;
  title: string;
  themeColor?: string | null;
  isPlaying?: boolean;
  className?: string;
}

export const SermonCover = ({ 
  thumbnailUrl, 
  title, 
  themeColor,
  isPlaying,
  className 
}: SermonCoverProps) => {
  const { settings } = useTheme();
  const bgColor = themeColor || "hsl(var(--primary))";
  const churchLogo = settings?.logo_url;

  // Determine what to display: thumbnail > church logo > fallback icon
  const hasImage = thumbnailUrl || churchLogo;

  return (
    <div 
      className={cn(
        "relative aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden",
        "shadow-2xl transition-transform duration-500",
        isPlaying && "animate-pulse-slow",
        className
      )}
    >
      {thumbnailUrl ? (
        <img 
          src={thumbnailUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
      ) : churchLogo ? (
        <div 
          className="w-full h-full flex items-center justify-center p-8"
          style={{ 
            background: `linear-gradient(135deg, ${bgColor}20, ${bgColor}40)` 
          }}
        >
          <img 
            src={churchLogo} 
            alt="Logo da Igreja"
            className="w-full h-full object-contain"
          />
        </div>
      ) : (
        <div 
          className="w-full h-full flex items-center justify-center"
          style={{ 
            background: `linear-gradient(135deg, ${bgColor}, ${bgColor}dd)` 
          }}
        >
          <Music2 className="w-20 h-20 text-white/60" />
        </div>
      )}
      
      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  );
};
