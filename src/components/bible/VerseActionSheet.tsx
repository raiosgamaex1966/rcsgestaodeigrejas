import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Copy, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerseActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  currentHighlightColor?: string;
  isFavorited: boolean;
  hasNote: boolean;
  onHighlight: (color: string) => void;
  onRemoveHighlight: () => void;
  onFavorite: () => void;
  onNote: () => void;
  onCopy: () => void;
  onAnalyze?: () => void;
}

const HIGHLIGHT_COLORS = [
  { color: "#FEF08A", name: "Amarelo" },
  { color: "#93C5FD", name: "Azul" },
  { color: "#86EFAC", name: "Verde" },
  { color: "#FDBA74", name: "Laranja" },
  { color: "#F9A8D4", name: "Rosa" },
];

export const VerseActionSheet = ({
  open,
  onOpenChange,
  bookName,
  chapter,
  verseNumber,
  verseText,
  currentHighlightColor,
  isFavorited,
  hasNote,
  onHighlight,
  onRemoveHighlight,
  onFavorite,
  onNote,
  onCopy,
  onAnalyze,
}: VerseActionSheetProps) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-border/50 pb-3">
          <DrawerTitle className="text-left font-serif">
            {bookName} {chapter}:{verseNumber}
          </DrawerTitle>
          <p className="text-sm text-muted-foreground line-clamp-2 text-left mt-1">
            "{verseText}"
          </p>
        </DrawerHeader>

        <div className="p-4 space-y-5">
          {/* Highlight Colors */}
          <div>
            <p className="text-sm font-medium mb-3">Cor do Grifo</p>
            <div className="flex items-center gap-3 flex-wrap">
              {HIGHLIGHT_COLORS.map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => onHighlight(color)}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 transition-all hover:scale-110",
                    currentHighlightColor === color
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
              {currentHighlightColor && (
                <button
                  onClick={onRemoveHighlight}
                  className="w-10 h-10 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center hover:border-destructive hover:bg-destructive/10 transition-all"
                  title="Remover grifo"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {onAnalyze && (
              <Button
                variant="outline"
                className="flex-col h-auto py-4 gap-2 col-span-4 bg-primary/5 border-primary/20 hover:bg-primary/10"
                onClick={() => {
                  onAnalyze();
                  onOpenChange(false);
                }}
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs">Analisar com IA</span>
              </Button>
            )}

            <Button
              variant={isFavorited ? "default" : "outline"}
              className="flex-col h-auto py-4 gap-2"
              onClick={() => {
                onFavorite();
                onOpenChange(false);
              }}
            >
              <Heart
                className={cn("w-5 h-5", isFavorited && "fill-current")}
              />
              <span className="text-xs">
                {isFavorited ? "Salvo" : "Salvar"}
              </span>
            </Button>

            <Button
              variant={hasNote ? "default" : "outline"}
              className="flex-col h-auto py-4 gap-2"
              onClick={onNote}
            >
              <MessageSquare
                className={cn("w-5 h-5", hasNote && "fill-current")}
              />
              <span className="text-xs">Anotação</span>
            </Button>

            <Button
              variant="outline"
              className="flex-col h-auto py-4 gap-2 col-span-2"
              onClick={() => {
                onCopy();
                onOpenChange(false);
              }}
            >
              <Copy className="w-5 h-5" />
              <span className="text-xs">Copiar</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
