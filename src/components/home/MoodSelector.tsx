import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Smile } from "lucide-react";

interface MoodSelectorProps {
  currentMood?: string | null;
  onMoodChange?: (mood: string) => void;
}

const moods = [
  { emoji: "😊", label: "Feliz", value: "happy" },
  { emoji: "🙏", label: "Grato", value: "grateful" },
  { emoji: "😌", label: "Em paz", value: "peaceful" },
  { emoji: "💪", label: "Forte", value: "strong" },
  { emoji: "😔", label: "Triste", value: "sad" },
  { emoji: "😰", label: "Ansioso", value: "anxious" },
  { emoji: "😤", label: "Frustrado", value: "frustrated" },
  { emoji: "🤔", label: "Pensativo", value: "thoughtful" },
];

const suggestions: Record<string, string> = {
  happy: "Que maravilha! Aproveite para compartilhar sua alegria com alguém.",
  grateful: "A gratidão transforma a vida! Experimente ler Salmos 100.",
  peaceful: "A paz de Deus que excede todo entendimento está com você.",
  strong: "O Senhor é a sua força! Continue firme na fé.",
  sad: "Deus está perto dos quebrantados de coração. Filipenses 4:6-7 pode ajudar.",
  anxious: "Não andeis ansiosos. Leia Mateus 6:25-34 para encontrar paz.",
  frustrated: "Respire fundo. Tiago 1:2-4 nos ensina sobre paciência.",
  thoughtful: "Medite na Palavra. Provérbios é ótimo para sabedoria.",
};

export const MoodSelector = ({ currentMood, onMoodChange }: MoodSelectorProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(currentMood || null);
  const [showSuggestion, setShowSuggestion] = useState(false);

  const currentMoodData = moods.find((m) => m.value === selectedMood);

  const handleMoodSelect = async (mood: typeof moods[0]) => {
    setSelectedMood(mood.value);
    setShowSuggestion(true);

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({
            current_mood: mood.value,
            mood_updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        onMoodChange?.(mood.value);
      } catch (error) {
        console.error("Error saving mood:", error);
      }
    }

    // Show suggestion briefly then close
    setTimeout(() => {
      setOpen(false);
      setShowSuggestion(false);
      toast.success(`Humor registrado: ${mood.label} ${mood.emoji}`);
    }, 2500);
  };

  return (
    <>
      {/* Mood Pill Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 transition-all hover:from-primary/20 hover:to-accent/20 hover:scale-[1.02] active:scale-[0.98]"
      >
        {currentMoodData ? (
          <>
            <span className="text-lg">{currentMoodData.emoji}</span>
            <span className="text-sm font-medium text-foreground">
              Estou {currentMoodData.label.toLowerCase()}
            </span>
          </>
        ) : (
          <>
            <Smile className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Como está se sentindo?
            </span>
          </>
        )}
      </button>

      {/* Mood Selection Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">
              {showSuggestion
                ? `${currentMoodData?.emoji} ${currentMoodData?.label}`
                : "Como você está se sentindo hoje?"}
            </DialogTitle>
          </DialogHeader>

          {showSuggestion && selectedMood ? (
            <div className="py-4 text-center animate-fade-in">
              <p className="text-muted-foreground text-sm leading-relaxed">
                {suggestions[selectedMood]}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 py-4">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => handleMoodSelect(mood)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                    selectedMood === mood.value
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
