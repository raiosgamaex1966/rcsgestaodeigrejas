import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, X, CheckSquare, Heart, Highlighter, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SelectedVerse {
  number: number;
  text: string;
}

const highlightColors = [
  { name: "yellow", color: "#FEF08A" },
  { name: "blue", color: "#93C5FD" },
  { name: "green", color: "#86EFAC" },
  { name: "orange", color: "#FDBA74" },
  { name: "pink", color: "#F9A8D4" },
];

interface FloatingSelectionBarProps {
  selectedVerses: SelectedVerse[];
  onAnalyze: () => void;
  onCopy: () => void;
  onClear: () => void;
  onHighlight?: (color: string) => void;
  onFavorite?: () => void;
  onNote?: () => void;
}

export const FloatingSelectionBar = ({
  selectedVerses,
  onAnalyze,
  onCopy,
  onClear,
  onHighlight,
  onFavorite,
  onNote,
}: FloatingSelectionBarProps) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  if (selectedVerses.length === 0) return null;

  const sortedVerses = [...selectedVerses].sort((a, b) => a.number - b.number);
  const verseRange = sortedVerses.length === 1 
    ? `v. ${sortedVerses[0].number}`
    : `v. ${sortedVerses[0].number}-${sortedVerses[sortedVerses.length - 1].number}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-32 md:bottom-20 left-4 right-4 z-50"
      >
        <div className="max-w-lg md:max-w-4xl mx-auto">
          <div className="bg-card border border-border shadow-lg rounded-xl p-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <CheckSquare className="w-4 h-4 text-primary shrink-0" />
                <Badge variant="secondary" className="shrink-0">
                  {selectedVerses.length} versículo{selectedVerses.length > 1 ? 's' : ''}
                </Badge>
                <span className="text-sm text-muted-foreground truncate">
                  {verseRange}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClear}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions row */}
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Highlight with color picker */}
              {onHighlight && (
                <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Highlighter className="w-4 h-4" />
                      <span className="hidden sm:inline">Grifar</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="center">
                    <div className="flex gap-2">
                      {highlightColors.map((c) => (
                        <button
                          key={c.name}
                          className="w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                          style={{ backgroundColor: c.color }}
                          onClick={() => {
                            onHighlight(c.color);
                            setColorPickerOpen(false);
                          }}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Favorite */}
              {onFavorite && (
                <Button size="sm" variant="outline" onClick={onFavorite} className="gap-1">
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Salvar</span>
                </Button>
              )}

              {/* Note */}
              {onNote && selectedVerses.length === 1 && (
                <Button size="sm" variant="outline" onClick={onNote} className="gap-1">
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Nota</span>
                </Button>
              )}

              {/* Copy */}
              <Button size="sm" variant="outline" onClick={onCopy} className="gap-1">
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copiar</span>
              </Button>

              {/* Analyze */}
              <Button size="sm" onClick={onAnalyze} className="gap-1">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Analisar</span>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
