import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllSermons, useThemes, usePreachers } from "@/hooks/useSermons";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, Clock, Loader2, Sparkles, CheckCircle, Upload, Image, X, Music2, PenTool, Video, Youtube } from "lucide-react";

const AdminSermons = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingInDialog, setProcessingInDialog] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    preacher_id: "",
    theme_id: "",
    duration_minutes: "",
    is_featured: false,
    is_published: true,
    recorded_at: "",
    audio_url: "",
    video_url: "",
    transcript: "",
    processed_at: "",
    thumbnail_url: "",
  });

  const { data: sermons = [], isLoading } = useAllSermons();
  const { data: themes = [] } = useThemes();
  const { data: preachers = [] } = usePreachers();
  const { settings } = useTheme();

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const churchLogo = settings?.logo_url;

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      preacher_id: "",
      theme_id: "",
      duration_minutes: "",
      is_featured: false,
      is_published: true,
      recorded_at: new Date().toISOString().split('T')[0],
      audio_url: "",
      video_url: "",
      transcript: "",
      processed_at: "",
      thumbnail_url: "",
    });
    setEditingId(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `sermon-${Date.now()}.${fileExt}`;
      const filePath = `sermon-thumbnails/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('church-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('church-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast({ title: "Imagem enviada!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate video type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de vídeo",
        variant: "destructive"
      });
      return;
    }

    setUploadingVideo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `sermon-video-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('sermon-recordings')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sermon-recordings')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, video_url: publicUrl }));
      toast({ title: "Vídeo enviado com sucesso!" });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar vídeo",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploadingVideo(false);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, thumbnail_url: "" }));
  };

  const processWithAI = async (sermon: any) => {
    if (!sermon.transcript && !sermon.audio_url) {
      toast({
        title: "Dados insuficientes",
        description: "Adicione uma transcrição ou envie um áudio para processar com IA.",
        variant: "destructive"
      });
      return;
    }

    setProcessingId(sermon.id);
    try {
      const { data, error } = await supabase.functions.invoke('process-sermon', {
        body: {
          sermonId: sermon.id,
          transcript: sermon.transcript,
          audioUrl: sermon.audio_url
        }
      });

      if (error) {
        console.error("Functions invoke error:", error);
        let errorMessage = error.message;

        // Handle Supabase Function error structure
        if (error instanceof Error && 'context' in error) {
          try {
            const context = (error as any).context;
            if (context?.response) {
              const body = await context.response.json();
              if (body?.error) errorMessage = body.error;
            }
          } catch (e) {
            console.error("Failed to parse error body:", e);
          }
        }
        throw new Error(errorMessage);
      }

      queryClient.invalidateQueries({ queryKey: ["sermons"] });
      toast({ title: "Processamento concluído!" });
    } catch (error: any) {
      toast({
        title: "Erro ao processar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleEdit = (sermon: any) => {
    setFormData({
      title: sermon.title,
      description: sermon.description || "",
      preacher_id: sermon.preacher_id || "",
      theme_id: sermon.theme_id || "",
      duration_minutes: sermon.duration_minutes?.toString() || "",
      is_featured: sermon.is_featured,
      is_published: sermon.is_published,
      recorded_at: sermon.recorded_at || "",
      audio_url: sermon.audio_url || "",
      video_url: sermon.video_url || "",
      transcript: sermon.transcript || "",
      processed_at: sermon.processed_at || "",
      thumbnail_url: sermon.thumbnail_url || "",
    });
    setEditingId(sermon.id);
    setIsOpen(true);
  };

  const processWithAIInDialog = async () => {
    if (!editingId) return;

    if (!formData.transcript && !formData.audio_url) {
      toast({
        title: "Dados insuficientes",
        description: "Adicione uma transcrição ou envie um áudio para processar com IA.",
        variant: "destructive"
      });
      return;
    }

    setProcessingInDialog(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-sermon', {
        body: {
          sermonId: editingId,
          transcript: formData.transcript,
          audioUrl: formData.audio_url
        }
      });

      if (error) {
        console.error("Functions invoke error within dialog:", error);
        let errorMessage = error.message;

        if (error instanceof Error && 'context' in error) {
          try {
            const context = (error as any).context;
            if (context?.response) {
              const body = await context.response.json();
              if (body?.error) errorMessage = body.error;
            }
          } catch (e) {
            console.error("Failed to parse error body:", e);
          }
        }
        throw new Error(errorMessage);
      }

      setFormData(prev => ({ ...prev, processed_at: new Date().toISOString() }));
      queryClient.invalidateQueries({ queryKey: ["sermons"] });
      toast({ title: "Processamento concluído!" });
    } catch (error: any) {
      toast({
        title: "Erro ao processar",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setProcessingInDialog(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data: any = {
      title: formData.title,
      description: formData.description || null,
      preacher_id: formData.preacher_id || null,
      theme_id: formData.theme_id || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      is_featured: formData.is_featured,
      is_published: formData.is_published,
      recorded_at: formData.recorded_at || null,
      thumbnail_url: formData.thumbnail_url || null,
      video_url: formData.video_url || null,
    };

    // Include transcript when editing
    if (editingId && formData.transcript) {
      data.transcript = formData.transcript;
    }

    try {
      if (editingId) {
        const { error } = await supabase.from("sermons").update(data).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Ministração atualizada!" });
      } else {
        const { error } = await supabase.from("sermons").insert(data);
        if (error) throw error;
        toast({ title: "Ministração criada!" });
      }

      queryClient.invalidateQueries({ queryKey: ["sermons"] });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta ministração?")) return;

    try {
      const { error } = await supabase.from("sermons").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Ministração excluída!" });
      queryClient.invalidateQueries({ queryKey: ["sermons"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  // Helper to get display image for sermon
  const getSermonImage = (sermon: any) => {
    if (sermon.thumbnail_url) return sermon.thumbnail_url;
    if (churchLogo) return churchLogo;
    return null;
  };

  // Fetch Drafts
  const { data: drafts = [], isLoading: draftsLoading } = useQuery({
    queryKey: ['sermon_drafts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sermon_drafts')
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDeleteDraft = async (id: string) => {
    if (!confirm("Deseja realmente excluir este rascunho?")) return;
    try {
      const { error } = await supabase.from("sermon_drafts").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Rascunho excluído!" });
      queryClient.invalidateQueries({ queryKey: ["sermon_drafts"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Gerenciamento de Ministrações</h1>
          <p className="text-muted-foreground">Gerencie as ministrações publicadas e rascunhos</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Nova Ministração
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Ministração" : "Nova Ministração"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>Imagem de Capa</Label>
                <div className="flex items-start gap-4">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center">
                    {formData.thumbnail_url ? (
                      <>
                        <img
                          src={formData.thumbnail_url}
                          alt="Capa"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : churchLogo ? (
                      <img
                        src={churchLogo}
                        alt="Logo da Igreja"
                        className="w-12 h-12 object-contain opacity-50"
                      />
                    ) : (
                      <Music2 className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('thumbnail-upload')?.click()}
                      disabled={uploadingImage}
                      className="w-full"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploadingImage ? "Enviando..." : "Enviar Imagem"}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {formData.thumbnail_url
                        ? "Imagem personalizada"
                        : "Sem imagem, usará o logo da igreja"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título *</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título da ministração"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pregador</Label>
                  <Select value={formData.preacher_id} onValueChange={(v) => setFormData({ ...formData, preacher_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {preachers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select value={formData.theme_id} onValueChange={(v) => setFormData({ ...formData, theme_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Duração (min)</Label>
                  <Input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                    placeholder="45"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.recorded_at}
                    onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da ministração..."
                  rows={3}
                />
              </div>

              {/* Video Section */}
              <div className="space-y-2">
                <Label>Vídeo (Opcional)</Label>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Cole o link do YouTube ou envie um arquivo..."
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      disabled={uploadingVideo}
                      className="hidden"
                      id="video-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('video-upload')?.click()}
                      disabled={uploadingVideo}
                      className="w-full"
                    >
                      {uploadingVideo ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      {uploadingVideo ? "Enviando vídeo..." : "Fazer upload de vídeo"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suporta links do YouTube ou upload direto de arquivos (.mp4, .mov, etc)
                  </p>
                </div>
              </div>

              {/* Audio player section - only show when editing */}
              {editingId && formData.audio_url && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <Label className="flex items-center gap-2">
                    <span>Áudio da Ministração</span>
                    {formData.processed_at && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Processado
                      </span>
                    )}
                  </Label>
                  <audio
                    src={formData.audio_url}
                    controls
                    className="w-full"
                  />
                </div>
              )}

              {/* Transcription section - only show when editing */}
              {editingId && (
                <div className="space-y-2">
                  <Label>Transcrição</Label>
                  <Textarea
                    value={formData.transcript}
                    onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                    placeholder="Cole ou digite a transcrição da ministração aqui..."
                    rows={5}
                  />
                  {!formData.processed_at && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={processWithAIInDialog}
                      disabled={processingInDialog || (!formData.transcript && !formData.audio_url)}
                    >
                      {processingInDialog ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Processar com IA
                        </>
                      )}
                    </Button>
                  )}
                  {!formData.transcript && (
                    <p className="text-xs text-muted-foreground">
                      Adicione a transcrição da ministração para gerar resumo, tópicos e referências bíblicas automaticamente.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Destaque</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Publicado</span>
                </label>
              </div>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sermons" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="sermons">Ministrações</TabsTrigger>
          <TabsTrigger value="drafts">Rascunhos</TabsTrigger>
        </TabsList>

        <TabsContent value="sermons" className="mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : sermons.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhuma ministração cadastrada</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {sermons.map((sermon) => (
                <Card key={sermon.id} variant="elevated" className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                      {getSermonImage(sermon) ? (
                        <img
                          src={getSermonImage(sermon)}
                          alt={sermon.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {sermon.theme && (
                          <span
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ backgroundColor: `${sermon.theme.color}20`, color: sermon.theme.color }}
                          >
                            {sermon.theme.name}
                          </span>
                        )}
                        {sermon.is_featured && (
                          <span className="px-2 py-0.5 text-xs bg-accent/20 text-accent rounded-full">★ Destaque</span>
                        )}
                        {!sermon.is_published && (
                          <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">Rascunho</span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{sermon.title}</h3>
                      <p className="text-sm text-muted-foreground">{sermon.preacher?.name || "Sem pregador"}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {sermon.duration_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {sermon.duration_minutes}min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {sermon.views}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {sermon.processed_at ? (
                        <Button variant="ghost" size="icon" title="Já processado" disabled>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Processar com IA"
                          onClick={() => processWithAI(sermon)}
                          disabled={processingId === sermon.id}
                        >
                          {processingId === sermon.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-primary" />
                          )}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(sermon)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sermon.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="drafts" className="mt-4">
          {draftsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : drafts.length === 0 ? (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum rascunho encontrado</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {drafts.map((draft: any) => (
                <Card key={draft.id} variant="elevated" className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted/50 flex-shrink-0 flex items-center justify-center">
                      <PenTool className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs bg-yellow-500/10 text-yellow-600 rounded-full">Rascunho</span>
                        {draft.is_ai_generated && (
                          <span className="px-2 py-0.5 text-xs bg-purple-500/10 text-purple-600 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> IA
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-foreground">{draft.title || "Sem título"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {draft.profiles?.full_name ? `Criado por: ${draft.profiles.full_name}` : "Autor desconhecido"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        {draft.updated_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Atualizado em {new Date(draft.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/sermons/create?draftId=${draft.id}`)} title="Editar rascunho">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteDraft(draft.id)} title="Excluir rascunho">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSermons;
