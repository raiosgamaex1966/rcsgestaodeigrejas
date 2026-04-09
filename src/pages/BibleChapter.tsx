import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bibleBooks } from "@/data/bible";
import { fetchChapter, BibleChapter as BibleChapterType } from "@/services/bibleApi";
import { useBible } from "@/hooks/useBible";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useBibleVersion } from "@/hooks/useBibleVersion";
import { VersionSelector } from "@/components/bible/VersionSelector";
import { VerseActionSheet } from "@/components/bible/VerseActionSheet";
import { NoteModal } from "@/components/bible/NoteModal";
import { VerseAnalysisModal } from "@/components/bible/VerseAnalysisModal";
import { FloatingSelectionBar } from "@/components/bible/FloatingSelectionBar";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  Settings,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";

interface SelectedVerse {
  number: number;
  text: string;
}

const BibleChapter = () => {
  const { bookId, chapter: chapterParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, getTenantPath } = useAuth();
  const {
    addFavorite,
    fetchFavorites,
    favorites,
    fetchHighlightsForChapter,
    highlightWithColor,
    removeHighlight,
    addNote,
    fetchAllNotes,
    getNoteForVerse,
  } = useBible();
  const { markChapterRead } = useGamification();
  const { version } = useBibleVersion();

  const [chapterData, setChapterData] = useState<BibleChapterType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerse, setSelectedVerse] = useState<SelectedVerse | null>(null);
  const [highlights, setHighlights] = useState<Record<number, { id: string; color: string }>>({});
  const [fontSize, setFontSize] = useState(16);
  const [markedAsRead, setMarkedAsRead] = useState(false);
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState<SelectedVerse[]>([]);

  const chapterNumber = parseInt(chapterParam || "1");

  const book = bibleBooks.find(
    (b) => b.abbrev.toLowerCase() === bookId?.toLowerCase()
  );

  useEffect(() => {
    const loadChapter = async () => {
      if (!book) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchChapter(book.abbrev, chapterNumber, version);
        setChapterData(data);

        if (user) {
          const userHighlights = await fetchHighlightsForChapter(book.name, chapterNumber);
          const highlightsMap: Record<number, { id: string; color: string }> = {};
          userHighlights.forEach((h) => {
            highlightsMap[h.verse] = { id: h.id, color: h.color };
          });
          setHighlights(highlightsMap);
        }
      } catch (err) {
        console.error("Error loading chapter:", err);
        setError("Erro ao carregar capítulo. Tente novamente.");
      } finally {
        setLoading(false);
      }
    };

    loadChapter();
    setMarkedAsRead(false);
    setSelectedVerses([]);
  }, [book, chapterNumber, version, user, fetchHighlightsForChapter]);


  const handleVerseClick = (verseNumber: number, verseText: string) => {
    if (!user) {
      toast({ title: "Faça login para interagir", variant: "destructive" });
      return;
    }

    setSelectedVerses(prev => {
      const exists = prev.find(v => v.number === verseNumber);
      if (exists) {
        return prev.filter(v => v.number !== verseNumber);
      }
      return [...prev, { number: verseNumber, text: verseText }];
    });
  };

  const handleClearSelection = () => {
    setSelectedVerses([]);
  };

  const handleMultiVerseCopy = async () => {
    if (!book || selectedVerses.length === 0) return;

    const sortedVerses = [...selectedVerses].sort((a, b) => a.number - b.number);
    const verseRange = sortedVerses.length === 1
      ? sortedVerses[0].number.toString()
      : `${sortedVerses[0].number}-${sortedVerses[sortedVerses.length - 1].number}`;

    const combinedText = sortedVerses.map(v => `${v.number} ${v.text}`).join(' ');
    const shareText = `"${combinedText}" - ${book.name} ${chapterNumber}:${verseRange}`;

    if (navigator.share) {
      await navigator.share({
        title: `${book.name} ${chapterNumber}:${verseRange}`,
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Versículos copiados!" });
    }
    handleClearSelection();
  };

  const handleMultiVerseAnalyze = () => {
    setAnalysisModalOpen(true);
  };

  const handleMultiVerseHighlight = async (color: string) => {
    let successCount = 0;
    for (const verse of selectedVerses) {
      const result = await highlightWithColor(book.name, chapterNumber, verse.number, color);
      if (result) {
        successCount++;
        setHighlights(prev => ({
          ...prev,
          [verse.number]: { id: result.id, color: result.color },
        }));
      }
    }

    if (successCount > 0) {
      toast({ title: `${successCount} versículo(s) grifado(s)!` });
    }
    handleClearSelection();
  };

  const handleMultiVerseFavorite = async () => {
    let successCount = 0;
    for (const verse of selectedVerses) {
      const result = await addFavorite(book.name, chapterNumber, verse.number, verse.text);
      if (result) successCount++;
    }

    if (successCount > 0) {
      toast({ title: `${successCount} versículo(s) salvo(s)!` });
    }
    handleClearSelection();
  };

  const handleMultiVerseNote = () => {
    if (selectedVerses.length === 1) {
      setSelectedVerse(selectedVerses[0]);
      setNoteModalOpen(true);
    }
  };

  const handleMarkAsRead = async () => {
    if (!user || !book || markedAsRead) return;

    const result = await markChapterRead(book.name, chapterNumber);
    setMarkedAsRead(true);

    if (result) {
      toast({
        title: `+${result.points} pontos!`,
        description: result.bonusPoints
          ? `🔥 Bônus de sequência: +${result.bonusPoints}pts!`
          : `Sequência: ${result.streak} dias`,
      });
    } else {
      toast({
        title: "Capítulo marcado como lido!",
        description: "Seus pontos serão atualizados em breve.",
      });
    }
  };

  const handleHighlight = async (color: string) => {
    if (!book || !selectedVerse) return;

    const result = await highlightWithColor(book.name, chapterNumber, selectedVerse.number, color);
    if (result) {
      setHighlights((prev) => ({
        ...prev,
        [selectedVerse.number]: { id: result.id, color: result.color },
      }));
      toast({ title: "Versículo grifado!" });
    }
  };

  const handleRemoveHighlight = async () => {
    if (!selectedVerse || !highlights[selectedVerse.number]) return;

    await removeHighlight(highlights[selectedVerse.number].id);
    setHighlights((prev) => {
      const updated = { ...prev };
      delete updated[selectedVerse.number];
      return updated;
    });
    toast({ title: "Grifo removido" });
    setActionSheetOpen(false);
  };

  const handleFavorite = async () => {
    if (!book || !selectedVerse) return;

    const result = await addFavorite(book.name, chapterNumber, selectedVerse.number, selectedVerse.text);
    if (result) {
      toast({ title: "Versículo favoritado!" });
    }
  };

  const handleSaveNote = async (noteText: string) => {
    if (!book || !selectedVerse) return;

    await addNote(book.name, chapterNumber, selectedVerse.number, noteText);
    toast({ title: "Anotação salva!" });
    setActionSheetOpen(false);
  };

  const handleCopy = async () => {
    if (!book || !selectedVerse) return;

    const shareText = `"${selectedVerse.text}" - ${book.name} ${chapterNumber}:${selectedVerse.number}`;

    if (navigator.share) {
      await navigator.share({
        title: `${book.name} ${chapterNumber}:${selectedVerse.number}`,
        text: shareText,
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Versículo copiado!" });
    }
  };

  const goToChapter = (newChapter: number) => {
    navigate(getTenantPath(`/bible/${bookId}/${newChapter}`));
  };

  const isFavorited = (verse: number) => {
    return favorites.some(
      (f) => f.book === book?.name && f.chapter === chapterNumber && f.verse === verse
    );
  };

  const hasNote = (verse: number) => {
    if (!book) return false;
    return !!getNoteForVerse(book.name, chapterNumber, verse);
  };

  const getExistingNote = () => {
    if (!book || !selectedVerse) return "";
    const note = getNoteForVerse(book.name, chapterNumber, selectedVerse.number);
    return note?.note || "";
  };

  const isVerseSelected = (verseNumber: number) => {
    return selectedVerses.some(v => v.number === verseNumber);
  };

  if (!book) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button variant="link" onClick={() => navigate(getTenantPath("/bible"))}>
          Voltar para a Bíblia
        </Button>
      </div>
    );
  }

  return (
    <div
      className="w-full md:max-w-5xl mx-auto pb-40 md:pb-24 px-4"
      style={{ transform: 'translateZ(0)' }}
    >
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="py-2 flex items-center justify-between">
          <Link
            to={getTenantPath(`/bible/${bookId}`)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">{book.name}</span>
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="font-serif font-bold text-foreground">
              Cap. {chapterNumber}
            </h1>
            <VersionSelector />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>Configurações de Leitura</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Tamanho da fonte: {fontSize}px</p>
                  <Slider
                    value={[fontSize]}
                    onValueChange={(v) => setFontSize(v[0])}
                    min={12}
                    max={24}
                    step={1}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="py-2">
        {loading && (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        )}

        {error && (
          <div className="py-8 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </div>
        )}

        {chapterData && (
          <div className="space-y-0.5 py-2">
            {chapterData.verses.map((verse) => (
              <div
                key={verse.number}
                className={cn(
                  "py-0.5 px-2 rounded-lg cursor-pointer select-none active:bg-primary/20 transition-colors",
                  isVerseSelected(verse.number) && "bg-primary/20 ring-1 ring-primary/30"
                )}
                style={{
                  backgroundColor: !isVerseSelected(verse.number) && highlights[verse.number]
                    ? `${highlights[verse.number].color}40`
                    : undefined,
                }}
                onClick={() => handleVerseClick(verse.number, verse.text)}
              >
                <span
                  className="leading-tight text-foreground bible-text"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  <span className="inline-flex items-center gap-0.5 mr-1 select-none">
                    <sup className="text-primary font-bold text-[10px]">
                      {verse.number}
                    </sup>
                    {isVerseSelected(verse.number) && (
                      <Check className="w-3 h-3 text-primary inline" />
                    )}
                    {isFavorited(verse.number) && (
                      <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" />
                    )}
                    {hasNote(verse.number) && (
                      <MessageSquare className="w-3 h-3 text-primary fill-primary/30 inline" />
                    )}
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: verse.text }} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-30">
        <Card className="p-2 flex items-center justify-between bg-card/95 backdrop-blur-md shadow-card border-border/50">
          <Button
            variant="ghost"
            size="sm"
            disabled={chapterNumber <= 1}
            onClick={() => goToChapter(chapterNumber - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="text-xs">Anterior</span>
          </Button>

          {user && (
            <Button
              size="sm"
              variant={markedAsRead ? "outline" : "default"}
              onClick={handleMarkAsRead}
              disabled={markedAsRead}
              className="px-4"
            >
              {markedAsRead ? (
                <><Check className="w-4 h-4 mr-1" /> Lido</>
              ) : (
                "Marcar lido"
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            disabled={chapterNumber >= book.chapters}
            onClick={() => goToChapter(chapterNumber + 1)}
          >
            <span className="text-xs">Próximo</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>
      </div>

      <FloatingSelectionBar
        selectedVerses={selectedVerses}
        onAnalyze={handleMultiVerseAnalyze}
        onCopy={handleMultiVerseCopy}
        onClear={handleClearSelection}
        onHighlight={handleMultiVerseHighlight}
        onFavorite={handleMultiVerseFavorite}
        onNote={handleMultiVerseNote}
      />

      {selectedVerse && book && (
        <NoteModal
          open={noteModalOpen}
          onOpenChange={setNoteModalOpen}
          bookName={book.name}
          chapter={chapterNumber}
          verseNumber={selectedVerse.number}
          verseText={selectedVerse.text}
          existingNote={getExistingNote()}
          onSave={handleSaveNote}
        />
      )}

      {book && (selectedVerses.length > 0 || selectedVerse) && (
        <VerseAnalysisModal
          open={analysisModalOpen}
          onOpenChange={(open) => {
            setAnalysisModalOpen(open);
            if (!open) handleClearSelection();
          }}
          bookName={book.name}
          chapter={chapterNumber}
          verses={selectedVerses.length > 0 ? selectedVerses : selectedVerse ? [selectedVerse] : []}
          onSaveAsNote={(noteText) => {
            if (selectedVerse) handleSaveNote(noteText);
            setAnalysisModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default BibleChapter;
