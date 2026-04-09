import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface NoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookName: string;
  chapter: number;
  verseNumber: number;
  verseText: string;
  existingNote?: string;
  onSave: (note: string) => Promise<void>;
}

export const NoteModal = ({
  open,
  onOpenChange,
  bookName,
  chapter,
  verseNumber,
  verseText,
  existingNote = "",
  onSave,
}: NoteModalProps) => {
  const [note, setNote] = useState(existingNote);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNote(existingNote);
  }, [existingNote, open]);

  const handleSave = async () => {
    if (!note.trim()) return;
    
    setSaving(true);
    try {
      await onSave(note.trim());
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif">
            {bookName} {chapter}:{verseNumber}
          </DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-3 pt-1">
            "{verseText}"
          </p>
        </DialogHeader>

        <div className="py-2">
          <Textarea
            placeholder="Escreva sua anotação..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!note.trim() || saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
