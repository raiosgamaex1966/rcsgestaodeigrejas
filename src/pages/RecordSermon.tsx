import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { usePreachers, useThemes } from "@/hooks/useSermons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mic, Square, Upload, Loader2, Video, ArrowLeft, Info } from "lucide-react";

const RecordSermon = () => {
  const navigate = useNavigate();
  const { user, canRecord, getTenantPath } = useAuth();
  const { data: preachers } = usePreachers();
  const { data: themes } = useThemes();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [preacherId, setPreacherId] = useState("");
  const [themeId, setThemeId] = useState("");
  const [recordedAt, setRecordedAt] = useState(new Date().toISOString().split('T')[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  if (!canRecord) {
    return (
      <div className="p-6 pt-safe flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-destructive/10 rounded-[32px] flex items-center justify-center text-destructive">
           <Info className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-serif font-black uppercase tracking-widest">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-[280px]">Você não tem permissão para realizar gravações nesta plataforma.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-widest">
          Voltar
        </Button>
      </div>
    );
  }

  const getSupportedMimeType = () => {
    const types = [
      'audio/mp4',
      'audio/aac',
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } 
      });
      
      const mimeType = getSupportedMimeType();
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: 128000,
      };
      if (mimeType) {
        options.mimeType = mimeType;
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`Arquivo muito grande (${Math.round(file.size / 1024 / 1024)}MB). O limite é 50MB.`);
        e.target.value = '';
        return;
      }
      setUploadedFile(file);
      setAudioBlob(null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (!title || !preacherId) {
      toast.error("Preencha o título e selecione o pregador");
      return;
    }

    const getExtensionFromMime = (mimeType: string) => {
      if (mimeType.includes('mp4') || mimeType.includes('aac')) return 'm4a';
      if (mimeType.includes('ogg')) return 'ogg';
      return 'webm';
    };
    
    const blobMimeType = audioBlob?.type || 'audio/webm';
    const extensionExt = getExtensionFromMime(blobMimeType);
    const fileToUpload = uploadedFile || (audioBlob ? new File([audioBlob], `recording.${extensionExt}`, { type: blobMimeType }) : null);
    
    if (!fileToUpload) {
      toast.error("Grave ou faça upload de um arquivo de áudio");
      return;
    }

    setIsUploading(true);

    try {
      const sanitizeFileName = (name: string) => {
        return name
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9.-]/g, '_')
          .replace(/_+/g, '_');
      };
      
      const originalName = fileToUpload.name || 'recording.webm';
      const extension = originalName.split('.').pop() || 'webm';
      const baseName = originalName.replace(/\.[^/.]+$/, '');
      const fileName = `${Date.now()}-${sanitizeFileName(baseName)}.${extension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('sermon-recordings')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('sermon-recordings')
        .getPublicUrl(fileName);

      const durationMinutes = audioBlob ? Math.ceil(recordingTime / 60) : null;

      const { error: insertError } = await supabase
        .from('sermons')
        .insert({
          title,
          description: description || null,
          preacher_id: preacherId,
          theme_id: themeId || null,
          audio_url: publicUrl,
          recorded_at: recordedAt,
          duration_minutes: durationMinutes,
          is_published: true
        });

      if (insertError) throw insertError;

      toast.success("Ministração publicada com sucesso!");
      navigate(getTenantPath('/sermons'));
    } catch (error: any) {
      toast.error(`Falha ao publicar: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 animate-fade-in space-y-8">
      {/* Dynamic Immersive Header */}
      <header className="flex items-center gap-6 mb-12">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-secondary/50 backdrop-blur-md active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="space-y-1">
           <h1 className="text-3xl md:text-5xl font-serif font-black text-foreground tracking-tight">Estúdio Digital</h1>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Capturando a voz do céu</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Recording Hub */}
        <section className="space-y-8 animate-slide-up">
          <Card className="rounded-[40px] border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl-soft overflow-hidden group">
            <div className="p-8 md:p-12 flex flex-col items-center gap-8">
               <div className="space-y-2 text-center">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">Capturar Áudio</h3>
                  <p className="text-xl font-serif font-bold">Ministração ao Vivo</p>
               </div>

               {isRecording ? (
                <div className="space-y-8 text-center animate-pulse">
                  <div className="relative">
                    <div className="absolute inset-0 bg-destructive/20 blur-[60px] rounded-full scale-150" />
                    <div className="w-32 h-32 rounded-[48px] bg-destructive text-white flex items-center justify-center relative z-10 shadow-2xl shadow-destructive/40">
                      <Mic className="w-16 h-16 stroke-[1.5]" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <p className="text-5xl font-mono font-black text-foreground tabular-nums tracking-tighter">
                      {formatTime(recordingTime)}
                    </p>
                    <Button 
                      variant="destructive" 
                      onClick={stopRecording}
                      className="h-16 px-10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-destructive/20 active:scale-95 transition-all"
                    >
                      <Square className="w-5 h-5 mr-3 fill-current" />
                      Finalizar Gravação
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 w-full">
                  <div className="flex flex-col gap-4">
                    <Button 
                      onClick={startRecording} 
                      className="w-full h-20 rounded-[32px] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                      <Mic className="w-6 h-6 mr-4" />
                      Abrir Microfone
                    </Button>
                    
                    <div className="relative flex items-center gap-4 py-2">
                       <div className="h-px bg-border/40 flex-1" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Ou Arquivo</span>
                       <div className="h-px bg-border/40 flex-1" />
                    </div>

                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border/40 rounded-[32px] bg-secondary/20 hover:bg-secondary/40 hover:border-primary/40 transition-all group/upload">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground/60 group-hover/upload:text-primary group-hover/upload:scale-110 transition-all" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 group-hover/upload:text-primary">Selecionar da Biblioteca</span>
                        <span className="text-[9px] text-muted-foreground/40 mt-1 uppercase tracking-tighter">MP3, M4A, WAV (Máx 50MB)</span>
                      </div>
                      <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
                    </Label>
                  </div>

                  {/* Playback Preview */}
                  {(audioBlob || uploadedFile) && !isRecording && (
                    <Card className="rounded-3xl bg-secondary/50 border-border/20 p-6 space-y-4 animate-scale-in">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pronto para Enviar</p>
                         </div>
                         <p className="text-[10px] font-bold text-muted-foreground/60 truncate max-w-[120px]">
                           {uploadedFile ? uploadedFile.name : `Gravação ${formatTime(recordingTime)}`}
                         </p>
                      </div>
                      {audioBlob && (
                        <audio controls className="w-full h-10 brightness-95 opacity-80" src={URL.createObjectURL(audioBlob)} />
                      )}
                    </Card>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Right: Sermon Details Form */}
        <section className="space-y-8 animate-slide-up" style={{ animationDelay: "150ms" }}>
          <Card className="rounded-[40px] border-border/40 bg-card/60 backdrop-blur-xl shadow-soft overflow-hidden">
             <div className="p-8 md:p-10 space-y-8">
                <div className="flex items-center gap-3">
                   <div className="w-1.5 h-6 bg-primary rounded-full" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Identificação</h3>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título da Ministração *</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: A Graça que Transforma"
                      className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6 font-medium focus:ring-primary/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Pregador *</Label>
                      <Select value={preacherId} onValueChange={setPreacherId}>
                        <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                          {preachers?.map(preacher => (
                            <SelectItem key={preacher.id} value={preacher.id} className="rounded-xl py-3 font-medium">
                              {preacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Série / Tema</Label>
                      <Select value={themeId} onValueChange={setThemeId}>
                        <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6">
                          <SelectValue placeholder="Opcional" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                          {themes?.map(theme => (
                            <SelectItem key={theme.id} value={theme.id} className="rounded-xl py-3 font-medium">
                              {theme.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Data de Registro</Label>
                    <Input
                      type="date"
                      value={recordedAt}
                      onChange={(e) => setRecordedAt(e.target.value)}
                      className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6 font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notas de Rodapé</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Breve resumo ou palavras-chave..."
                      className="min-h-[120px] rounded-[24px] bg-secondary/30 border-border/40 p-6 font-medium resize-none focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>

                <Button 
                  className="w-full h-16 rounded-[24px] bg-primary text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20 hover:opacity-95 active:scale-95 transition-all"
                  onClick={handleSubmit}
                  disabled={isUploading || isRecording}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Sincronizando...</span>
                    </div>
                  ) : (
                    "Publicar Ministração"
                  )}
                </Button>
             </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default RecordSermon;
