import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useBibleVersion } from "@/hooks/useBibleVersion";
import {
  Sparkles,
  BookOpen,
  History,
  Languages,
  Lightbulb,
  Link2,
  Copy,
  MessageSquare,
  Loader2,
} from "lucide-react";

interface VerseAnalysis {
  pretext: string;
  historicalContext: {
    author: string;
    audience: string;
    date: string;
    circumstances: string;
  };
  textAnalysis: string;
  originalWords: Array<{
    word: string;
    original: string;
    language: string;
    meaning: string;
    strongs?: string;
  }>;
  practicalApplication: string;
  crossReferences: Array<{
    reference: string;
    text: string;
    connection: string;
  }>;
}

interface SelectedVerse {
  number: number;
  text: string;
}

interface VerseAnalysisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookName: string;
  chapter: number;
  verses: SelectedVerse[];
  onSaveAsNote?: (text: string) => void;
}

export const VerseAnalysisModal = ({
  open,
  onOpenChange,
  bookName,
  chapter,
  verses,
  onSaveAsNote,
}: VerseAnalysisModalProps) => {
  const { toast } = useToast();
  const { version } = useBibleVersion();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<VerseAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzedKey, setLastAnalyzedKey] = useState<string>("");

  const sortedVerses = [...verses].sort((a, b) => a.number - b.number);
  
  const reference = sortedVerses.length === 1
    ? `${bookName} ${chapter}:${sortedVerses[0].number}`
    : `${bookName} ${chapter}:${sortedVerses[0]?.number}-${sortedVerses[sortedVerses.length - 1]?.number}`;

  const combinedText = sortedVerses.map(v => v.text).join(' ');
  const currentKey = `${bookName}-${chapter}-${sortedVerses.map(v => v.number).join(',')}-${version}`;

  const fetchAnalysis = async () => {
    if (sortedVerses.length === 0) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('analyze-verse', {
        body: {
          book: bookName,
          chapter,
          verses: sortedVerses.map(v => ({ number: v.number, text: v.text })),
          version,
        },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      setAnalysis(data.analysis);
      setLastAnalyzedKey(currentKey);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'Erro ao analisar versículo');
      toast({
        title: "Erro na análise",
        description: err.message || 'Tente novamente',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset and fetch when modal opens with new verses
  useEffect(() => {
    if (open && currentKey !== lastAnalyzedKey && !loading) {
      setAnalysis(null);
      fetchAnalysis();
    }
  }, [open, currentKey]);

  const handleCopyAnalysis = async () => {
    if (!analysis) return;

    const text = `📖 ${reference}\n"${combinedText}"\n\n` +
      `📜 PRETEXTO\n${analysis.pretext}\n\n` +
      `📚 CONTEXTO HISTÓRICO\n` +
      `Autor: ${analysis.historicalContext.author}\n` +
      `Audiência: ${analysis.historicalContext.audience}\n` +
      `Data: ${analysis.historicalContext.date}\n` +
      `Circunstâncias: ${analysis.historicalContext.circumstances}\n\n` +
      `📝 ANÁLISE DO TEXTO\n${analysis.textAnalysis}\n\n` +
      `🔤 PALAVRAS NO ORIGINAL\n` +
      analysis.originalWords.map(w => 
        `• ${w.word} (${w.original} - ${w.language}): ${w.meaning}`
      ).join('\n') + '\n\n' +
      `💡 APLICAÇÃO PRÁTICA\n${analysis.practicalApplication}\n\n` +
      `🔗 REFERÊNCIAS CRUZADAS\n` +
      analysis.crossReferences.map(r => 
        `• ${r.reference}: ${r.connection}`
      ).join('\n');

    await navigator.clipboard.writeText(text);
    toast({ title: "Análise copiada!" });
  };

  const handleSaveAsNote = () => {
    if (!analysis || !onSaveAsNote) return;

    const noteText = `📖 Análise de ${reference}\n\n` +
      `📜 Pretexto: ${analysis.pretext}\n\n` +
      `📝 Análise: ${analysis.textAnalysis}\n\n` +
      `💡 Aplicação: ${analysis.practicalApplication}`;

    onSaveAsNote(noteText);
    toast({ title: "Salvo como anotação!" });
    onOpenChange(false);
  };

  if (verses.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg md:max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-4 pt-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <DialogTitle className="font-serif">Análise com IA</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {reference}
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-4 py-4 space-y-4">
            {/* Verse Text */}
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
              <p className="text-sm italic text-foreground">"{combinedText}"</p>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="space-y-4">
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={fetchAnalysis}>
                  Tentar novamente
                </Button>
              </div>
            )}

            {/* Analysis Content */}
            {analysis && !loading && (
              <Accordion type="multiple" defaultValue={["pretext", "text", "words"]} className="space-y-2">
                {/* Pretexto */}
                <AccordionItem value="pretext" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium">Pretexto</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.pretext}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Contexto Histórico */}
                <AccordionItem value="context" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-primary" />
                      <span className="font-medium">Contexto Histórico</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex gap-2">
                        <Badge variant="outline">Autor</Badge>
                        <span className="text-muted-foreground">{analysis.historicalContext.author}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Audiência</Badge>
                        <span className="text-muted-foreground">{analysis.historicalContext.audience}</span>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">Data</Badge>
                        <span className="text-muted-foreground">{analysis.historicalContext.date}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-muted-foreground leading-relaxed">
                          {analysis.historicalContext.circumstances}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Análise do Texto */}
                <AccordionItem value="text" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" />
                      <span className="font-medium">Análise do Texto</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.textAnalysis}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Palavras no Original */}
                <AccordionItem value="words" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-primary" />
                      <span className="font-medium">Palavras no Original</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {analysis.originalWords.map((word, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{word.word}</span>
                            <Badge variant="secondary" className="text-xs">
                              {word.language}
                            </Badge>
                          </div>
                          <p className="text-sm font-serif text-primary mb-1">
                            {word.original}
                            {word.strongs && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (Strong: {word.strongs})
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {word.meaning}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Aplicação Prática */}
                <AccordionItem value="application" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      <span className="font-medium">Aplicação Prática</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {analysis.practicalApplication}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                {/* Referências Cruzadas */}
                <AccordionItem value="references" className="border rounded-lg px-3">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-primary" />
                      <span className="font-medium">Referências Cruzadas</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {analysis.crossReferences.map((ref, idx) => (
                        <div key={idx} className="border-l-2 border-primary/30 pl-3">
                          <p className="font-medium text-sm text-foreground">
                            {ref.reference}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {ref.connection}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        {analysis && !loading && (
          <div className="px-4 py-3 border-t border-border/50 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleCopyAnalysis}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copiar
            </Button>
            {onSaveAsNote && verses.length === 1 && (
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={handleSaveAsNote}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Salvar como nota
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
