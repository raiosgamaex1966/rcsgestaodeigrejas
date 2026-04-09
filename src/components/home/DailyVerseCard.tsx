import { getTodayVerse } from "@/data/bible";
import { Card } from "@/components/ui/card";
import { Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBible } from "@/hooks/useBible";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useChurchSettings } from "@/hooks/useChurchSettings";

export const DailyVerseCard = () => {
  const verse = getTodayVerse();
  const { isFavorite, addFavorite, removeFavorite, fetchFavorites, favorites } = useBible();
  const { settings } = useChurchSettings();

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const favorite = favorites.find(
    (f) => f.book === verse.book && f.chapter === verse.chapter && f.verse === verse.verse
  );

  const favorited = !!favorite;

  const handleToggleFavorite = async () => {
    try {
      if (favorited) {
        await removeFavorite(favorite.id);
        toast({
          title: "Removido dos favoritos",
          description: "O versículo foi removido da sua lista.",
        });
      } else {
        await addFavorite(verse.book, verse.chapter, verse.verse, verse.text);
        toast({
          title: "Adicionado aos favoritos",
          description: "O versículo foi salvo na sua lista.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o favorito.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = settings?.website_url?.replace(/\/$/, '') || "https://igrejateste03022026.vercel.app";
    const shareText = `"${verse.text}"\n\n— ${verse.reference.toUpperCase()}\n\n📖 Leia mais e acompanhe nossa igreja:\n${shareUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "Copiado!",
        description: "Mensagem de compartilhamento copiada para a área de transferência.",
      });
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Erro",
        description: "Não foi possível copiar o texto.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="relative overflow-hidden bg-card border-border shadow-2xl group border-l-4 border-l-primary/50">
      <div className="p-8 relative">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform duration-500">
              <span className="text-2xl">📖</span>
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground block mb-0.5">Versículo do Dia</span>
              <span className="text-lg font-serif font-black text-foreground">Palavra Viva</span>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold px-4 py-1.5 backdrop-blur-md">
            {verse.theme}
          </Badge>
        </div>

        <blockquote className="mb-8 relative">
          <p className="text-xl md:text-2xl leading-relaxed text-foreground font-serif font-bold italic tracking-tight">
            <span className="text-4xl text-primary/30 font-serif mr-1 leading-none">“</span>
            {verse.text}
            <span className="text-4xl text-primary/30 font-serif ml-1 leading-none">”</span>
          </p>
        </blockquote>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-border" />
            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
              {verse.reference}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="h-11 w-11 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-border"
            >
              <Share2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
              className={cn(
                "h-11 w-11 transition-all border border-border rounded-2xl",
                favorited
                  ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
                  : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              )}
            >
              <Heart className={cn("w-5 h-5", favorited && "fill-current")} />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
