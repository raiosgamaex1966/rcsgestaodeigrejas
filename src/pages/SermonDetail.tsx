import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AudioPlayer } from "@/components/sermons/AudioPlayer";
import { SermonCover } from "@/components/sermons/SermonCover";
import { useIncrementViews } from "@/hooks/useSermons";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { bibleBooks } from "@/data/bible";
import { cn } from "@/lib/utils";
import { useChurchSettings } from "@/hooks/useChurchSettings";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft, Clock, Eye, Calendar,
  FileText, ListOrdered, BookOpen, Sparkles, Loader2,
  Copy, Check, Edit3, Share2
} from "lucide-react";

interface SermonDetailData {
  id: string;
  title: string;
  description: string | null;
  audio_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  transcript: string | null;
  summary: string | null;
  topics: any;
  bible_references: string[] | null;
  duration_minutes: number | null;
  views: number;
  recorded_at: string | null;
  processed_at: string | null;
  preacher: { name: string } | null;
  theme: { name: string; color: string } | null;
}

const SermonDetail = () => {
  const { sermonId } = useParams();
  const navigate = useNavigate();
  const incrementViews = useIncrementViews();
  const { canRecord, getTenantPath } = useAuth();
  const { settings } = useChurchSettings();

  const [sermon, setSermon] = useState<SermonDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [activeTab, setActiveTab] = useState<'transcript' | 'summary' | 'references'>('transcript');
  const [copied, setCopied] = useState(false);

  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualTranscript, setManualTranscript] = useState("");
  const [isProcessingManual, setIsProcessingManual] = useState(false);

  const handleShare = async () => {
    const url = getShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: sermon?.title || "Ministração",
          text: sermon?.description || "",
          url: url
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copiado para a área de transferência!");
      }
    } catch {
      toast.error("Erro ao compartilhar conteúdo");
    }
  };

  const bookNameToAbbrev: Record<string, string> = {};
  bibleBooks.forEach(book => {
    bookNameToAbbrev[book.name.toLowerCase()] = book.abbrev;
  });

  useEffect(() => {
    if (sermonId) {
      fetchSermon();
      incrementViews.mutate(sermonId);
    }
  }, [sermonId]);

  const fetchSermon = async () => {
    const { data, error } = await supabase
      .from('sermons')
      .select(`
        *,
        preacher:preachers(name),
        theme:themes(name, color)
      `)
      .eq('id', sermonId)
      .single();

    if (error) {
      toast.error("Erro ao carregar ministração");
      navigate(getTenantPath('/sermons'));
    } else {
      setSermon(data);
      document.title = data.title;
    }
    setLoading(false);
  };

  const processWithAI = async () => {
    if (!sermon?.transcript && !sermon?.audio_url) {
      toast.error("Esta ministração não possui transcrição ou áudio para processar");
      return;
    }

    setIsProcessing(true);
    setProcessingStatus("Iniciando processamento...");

    try {
      const { data, error } = await supabase.functions.invoke('process-sermon', {
        body: {
          sermonId: sermon.id,
          transcript: sermon.transcript,
          audioUrl: sermon.audio_url
        }
      });

      if (error) {
        const errorMessage = data?.error || error.message || 'Erro desconhecido';
        if (errorMessage.includes("muito grande") || errorMessage.includes("limite")) {
          setShowManualDialog(true);
        }
        throw new Error(errorMessage);
      }

      await fetchSermon();
      toast.success("Processamento concluído com sucesso!");
    } catch (error: any) {
      toast.error(`Falha no processamento: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  const processWithManualTranscript = async () => {
    if (!manualTranscript.trim()) {
      toast.error("Por favor, insira a transcrição");
      return;
    }

    setIsProcessingManual(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-sermon', {
        body: {
          sermonId: sermon?.id,
          transcript: manualTranscript.trim(),
          audioUrl: null
        }
      });

      if (error) throw new Error(data?.error || error.message);
      
      setShowManualDialog(false);
      setManualTranscript("");
      await fetchSermon();
      toast.success("Transcrição manual processada!");
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsProcessingManual(false);
    }
  };

  const parseReference = (ref: string) => {
    const match = ref.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
    if (match) {
      const bookName = match[1].toLowerCase();
      const chapter = match[2];
      const abbrev = bookNameToAbbrev[bookName];
      if (abbrev) return { abbrev, chapter, verse: match[3] };
    }
    return null;
  };

  const copyTranscript = async () => {
    if (sermon?.transcript) {
      await navigator.clipboard.writeText(sermon.transcript);
      setCopied(true);
      toast.success("Transcrição copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getShareUrl = () => {
    if (!sermon) return '';
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    return `${supabaseUrl}/functions/v1/og-meta?type=sermon&id=${sermon.id}`;
  };

  const tabs = [
    { id: 'transcript' as const, label: 'Transcrição', icon: FileText },
    { id: 'summary' as const, label: 'Resumo', icon: ListOrdered },
    { id: 'references' as const, label: 'Versículos', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="p-6 pt-safe pb-24 max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
           <Skeleton className="aspect-square rounded-[40px]" />
           <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
           </div>
        </div>
      </div>
    );
  }

  if (!sermon) return null;

  const themeColor = sermon.theme?.color || "hsl(var(--primary))";

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      {/* Dynamic Immersive Background */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20 blur-[120px] transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${themeColor}, transparent 70%)`
        }}
      />

      <div className="relative px-4 pt-safe pb-24 max-w-6xl mx-auto">
        {/* Header Navigation */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-secondary/50 backdrop-blur-md border border-white/20 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full bg-secondary/50 backdrop-blur-md border border-white/20 active:scale-95 transition-all"
            >
              <Share2 className="w-5 h-5" />
            </Button>

            {!sermon.processed_at && canRecord && (
              <Button
                variant="outline"
                size="sm"
                onClick={processWithAI}
                disabled={isProcessing}
                className="rounded-xl h-10 px-4 gap-2 bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 shadow-soft active:scale-95 transition-all"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span className="hidden sm:inline font-black uppercase text-[9px] tracking-widest">
                  {isProcessing ? "Analisando..." : "Gerar com IA"}
                </span>
              </Button>
            )}

            {canRecord && !sermon.processed_at && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowManualDialog(true)}
                className="rounded-full bg-secondary/50 backdrop-blur-md border border-white/20 active:scale-95 transition-all"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>

        {/* Layout Grid */}
        <main className="grid grid-cols-1 lg:grid-cols-[1fr,1.4fr] gap-12 items-start">
          {/* Left Wing: Presentation & Audio */}
          <div className="space-y-8 animate-slide-up">
            <div className="group relative">
               <SermonCover
                  thumbnailUrl={sermon.thumbnail_url}
                  title={sermon.title}
                  themeColor={themeColor}
                  isPlaying={isPlaying}
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/20 blur-xl rounded-full opacity-50 transition-opacity group-hover:opacity-100" />
            </div>

            {/* Title & Metadata (Centering on Mobile, Leading on Desktop) */}
            <div className="text-center lg:text-left space-y-4 px-2">
              <div className="space-y-1">
                 <Badge 
                    className="rounded-full px-4 py-1 border-0 font-black text-[9px] uppercase tracking-[0.2em] mb-2"
                    style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                 >
                   {sermon.theme?.name || "Ministração"}
                 </Badge>
                 <h1 className="text-2xl md:text-3xl font-serif font-black text-foreground leading-[1.1]">{sermon.title}</h1>
                 <p className="text-lg font-serif font-medium text-muted-foreground">{sermon.preacher?.name || "Ministro da Fé"}</p>
              </div>

              {sermon.description && (
                <p className="text-sm text-muted-foreground/80 leading-relaxed font-serif italic border-l-2 border-primary/20 pl-4">{sermon.description}</p>
              )}

              {/* Stats Bar */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/40">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{sermon.views} visualizações</span>
                </div>
                {sermon.recorded_at && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 bg-secondary/30 px-3 py-1.5 rounded-full border border-border/40">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(sermon.recorded_at + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
                {sermon.duration_minutes && (
                   <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{sermon.duration_minutes} min</span>
                   </div>
                )}
              </div>
            </div>

            {/* Audio Hero Module */}
            {(sermon.audio_url || sermon.video_url) && (
              <div className="bg-card/40 backdrop-blur-xl rounded-[40px] p-2 border border-white/20 shadow-2xl-soft overflow-hidden">
                <AudioPlayer
                  audioUrl={sermon.audio_url || ''}
                  videoUrl={sermon.video_url}
                  title={sermon.title}
                  artist={sermon.preacher?.name}
                  artwork={sermon.thumbnail_url}
                  shareUrl={getShareUrl()}
                  onPlayingChange={setIsPlaying}
                  showShareButton={false}
                />
              </div>
            )}
          </div>

          {/* Right Wing: Deep Insights */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: "150ms" }}>
            {/* Intelligent Tabs */}
            <nav className="flex gap-2.5 p-1.5 bg-secondary/40 backdrop-blur-md rounded-3xl border border-border/40 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-background text-primary shadow-soft shadow-black/5 scale-[1.02]"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-white/50"
                  )}
                >
                  <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-primary fill-primary/20" : "")} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Rich Content Viewer */}
            <Card className="border-border/40 shadow-soft bg-card/60 backdrop-blur-xl rounded-[40px] overflow-hidden min-h-[500px]">
              <div className="p-8 md:p-10">
                {/* Transcript Viewer */}
                {activeTab === 'transcript' && (
                  <div className="space-y-6 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-border/40 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-1.5 h-6 bg-primary/30 rounded-full" />
                         <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Transcrição Integral</h3>
                      </div>
                      {sermon.transcript && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyTranscript}
                          className="h-10 rounded-xl px-4 gap-2 text-[9px] font-black uppercase tracking-widest bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copiado' : 'Capturar'}
                        </Button>
                      )}
                    </div>
                    {sermon.transcript ? (
                      <div className="text-foreground/80 leading-[1.8] font-serif text-lg whitespace-pre-wrap select-text">
                        {sermon.transcript}
                      </div>
                    ) : (
                      <EmptyState icon={FileText} message="O texto ainda não foi extraído desta ministração." action={processWithAI} canAction={canRecord} isProcessing={isProcessing} showProcessingButton />
                    )}
                  </div>
                )}

                {/* Summary Viewer */}
                {activeTab === 'summary' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                       <div className="w-1.5 h-6 bg-gold/30 rounded-full" />
                       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Pérolas da Ministração</h3>
                    </div>
                    
                    {sermon.summary ? (
                      <div className="space-y-10">
                        <p className="text-xl font-serif leading-relaxed italic text-foreground/70 text-center px-4">
                          "{sermon.summary}"
                        </p>

                        {sermon.topics && Array.isArray(sermon.topics) && sermon.topics.length > 0 && (
                          <div className="grid gap-4">
                            {sermon.topics.map((topic: any, index: number) => (
                              <div key={index} className="group flex items-start gap-5 p-5 rounded-3xl bg-secondary/20 border border-transparent hover:border-gold/30 hover:bg-gold/5 transition-all">
                                <div className="w-10 h-10 rounded-2xl bg-gold/10 text-gold flex items-center justify-center font-black text-sm flex-shrink-0 group-hover:scale-110 transition-transform">
                                  {String(index + 1).padStart(2, '0')}
                                </div>
                                <span className="text-base font-serif font-bold text-foreground/80 pt-2 leading-tight">
                                  {typeof topic === 'string' ? topic : topic.title || topic.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <EmptyState icon={ListOrdered} message="A síntese inteligente aguarda o processamento." action={processWithAI} canAction={canRecord} isProcessing={isProcessing} showProcessingButton />
                    )}
                  </div>
                )}

                {/* Bible References Viewer */}
                {activeTab === 'references' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                       <div className="w-1.5 h-6 bg-indigo-light/30 rounded-full" />
                       <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Fundamento Bíblico</h3>
                    </div>

                    {sermon.bible_references && sermon.bible_references.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sermon.bible_references.map((ref, index) => {
                          const parsed = parseReference(ref);
                          if (parsed) {
                            return (
                              <Link
                                key={index}
                                to={getTenantPath(`/bible/${parsed.abbrev}/${parsed.chapter}`)}
                                className="group flex items-center justify-between p-5 rounded-[24px] bg-indigo-light/5 border border-indigo-light/20 hover:bg-indigo-light/10 hover:border-indigo-light/40 transition-all active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-white/50 text-indigo-light flex items-center justify-center shadow-sm">
                                      <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                   </div>
                                   <span className="font-serif font-black text-lg text-indigo-light/80">{ref}</span>
                                </div>
                                <ArrowLeft className="w-4 h-4 text-indigo-light/40 rotate-180 group-hover:translate-x-1 transition-transform" />
                              </Link>
                            );
                          }
                          return (
                            <span key={index} className="p-5 rounded-[24px] bg-muted/30 text-muted-foreground font-serif text-lg text-center border-2 border-dashed border-border/50">
                              {ref}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <EmptyState icon={BookOpen} message="Nenhuma referência bíblica foi mapeada ainda." action={processWithAI} canAction={canRecord} isProcessing={isProcessing} showProcessingButton />
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </main>
      </div>

      {/* Intelligent Modals */}
      <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <DialogContent className="max-w-2xl bg-card rounded-[40px] border-border/40 shadow-2xl p-8 overflow-hidden">
          <DialogHeader className="space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
               <Edit3 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-2xl font-serif font-black">Transcrição Manual</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-relaxed">
              O arquivo de áudio excede o limite automático. Cole o texto para que nossa IA possa extrair as notas e passagens fundamentais desta ministração.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="relative group">
              <Textarea
                placeholder="Insira o texto da mensagem aqui..."
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                className="min-h-[350px] rounded-[32px] bg-secondary/20 border-border/40 p-6 font-serif text-lg leading-relaxed focus:ring-primary/20 transition-all resize-none"
              />
              <div className="absolute bottom-6 right-6 flex flex-col items-end opacity-40 group-focus-within:opacity-100 transition-opacity">
                <span className="text-[10px] font-black uppercase tracking-widest">{manualTranscript.split(/\s+/).filter(Boolean).length} palavras</span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                variant="ghost"
                className="flex-1 h-16 rounded-2xl font-black uppercase text-[10px] tracking-widest"
                onClick={() => setShowManualDialog(false)}
                disabled={isProcessingManual}
              >
                Cancelar
              </Button>
              <Button
                onClick={processWithManualTranscript}
                disabled={isProcessingManual || !manualTranscript.trim()}
                className="flex-[2] h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-soft shadow-primary/20 transition-all active:scale-95"
              >
                {isProcessingManual ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-3" />
                )}
                Sincronizar Mensagem
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// UI Components
const EmptyState = ({ icon: Icon, message, action, canAction, isProcessing, showProcessingButton }: any) => (
  <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 opacity-60">
    <div className="w-20 h-20 bg-secondary/50 rounded-[32px] flex items-center justify-center rotate-6">
       <Icon className="w-10 h-10 text-muted-foreground/30" />
    </div>
    <div className="space-y-2 max-w-[280px]">
       <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground">Conteúdo Pendente</p>
       <p className="text-base font-serif font-medium leading-relaxed">{message}</p>
    </div>
    
    {canAction && showProcessingButton && (
      <Button
        variant="outline"
        onClick={action}
        disabled={isProcessing}
        className="rounded-xl h-12 px-6 gap-3 border-primary/20 bg-primary/5 text-primary hover:bg-primary/20 transition-all shadow-soft"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        <span className="font-black uppercase text-[10px] tracking-widest">Processar com IA</span>
      </Button>
    )}
  </div>
);

export default SermonDetail;