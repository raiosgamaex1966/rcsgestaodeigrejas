import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, PenTool, Loader2, BookOpen, Clock, Calendar, Target, MessageSquare, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const CreateSermon = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { user, canCreateSermon, getTenantPath } = useAuth();

  // AI Generation fields
  const [aiDate, setAiDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [aiTheme, setAiTheme] = useState("");
  const [aiDuration, setAiDuration] = useState("30");
  const [aiSubject, setAiSubject] = useState("");
  const [aiExpectation, setAiExpectation] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);

  // Manual creation fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [manualReferences, setManualReferences] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [preachers, setPreachers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) setUserProfile(profile);

      const { data: preachersList } = await supabase
        .from('preachers')
        .select('id, name')
        .eq('is_active', true);

      if (preachersList) setPreachers(preachersList);

      if (draftId) {
        const { data: draft, error } = await supabase
          .from('sermon_drafts')
          .select('*')
          .eq('id', draftId)
          .single();

        if (error) {
          toast.error("Erro ao carregar rascunho");
          return;
        }

        if (draft) {
          if (draft.is_ai_generated) {
            setAiDate(draft.target_date || new Date().toLocaleDateString('en-CA'));
            setAiTheme(draft.theme || "");
            setAiDuration(draft.duration_minutes?.toString() || "30");
            setGeneratedContent(draft.content);
            setAiSubject(draft.title || "");
          } else {
            setManualTitle(draft.title || "");
            setManualContent(draft.content.content || "");
            setManualReferences(Array.isArray(draft.bible_references) ? draft.bible_references.join(', ') : "");
          }
        }
      }
    };

    fetchData();
  }, [user, draftId]);

  if (!canCreateSermon) {
    return (
      <div className="p-6 pt-safe flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-primary/10 rounded-[32px] flex items-center justify-center text-primary">
           <Info className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-serif font-black uppercase tracking-widest">Escritório Restrito</h2>
          <p className="text-sm text-muted-foreground font-medium max-w-[280px]">Somente ministros autorizados podem criar novos sermões.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-2xl px-8 h-12 font-black uppercase text-[10px] tracking-widest">
          Voltar
        </Button>
      </div>
    );
  }

  const handleGenerateWithAI = async () => {
    if (!aiSubject) {
      toast.error("Informe o assunto da ministração");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sermon', {
        body: {
          date: aiDate,
          theme: aiTheme,
          duration: parseInt(aiDuration),
          subject: aiSubject,
          expectation: aiExpectation,
          message: aiMessage
        }
      });

      if (error) throw error;

      setGeneratedContent(data);
      toast.success("Ministração estruturada com sucesso!");
    } catch (error: any) {
      toast.error(`Erro na geração: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const updateGeneratedContent = (field: string, value: any) => {
    setGeneratedContent((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const updateTopic = (index: number, field: string, value: string) => {
    setGeneratedContent((prev: any) => {
      const newTopics = [...prev.topics];
      newTopics[index] = {
        ...newTopics[index],
        [field]: value
      };
      return {
        ...prev,
        topics: newTopics
      };
    });
  };

  const handleSaveDraft = async (isAI: boolean) => {
    setIsSaving(true);
    try {
      const content = isAI ? generatedContent : {
        title: manualTitle,
        content: manualContent,
        references: manualReferences.split(',').map(r => r.trim()).filter(Boolean)
      };

      if (draftId) {
        const { error } = await supabase
          .from('sermon_drafts')
          .update({
            title: isAI ? generatedContent?.title : manualTitle,
            content,
            bible_references: isAI ? generatedContent?.references : content.references,
            is_ai_generated: isAI,
            duration_minutes: isAI ? parseInt(aiDuration) : null,
            theme: isAI ? aiTheme : null,
            target_date: isAI ? aiDate : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', draftId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('sermon_drafts')
          .insert({
            user_id: user!.id,
            title: isAI ? generatedContent?.title : manualTitle,
            content,
            bible_references: isAI ? generatedContent?.references : content.references,
            is_ai_generated: isAI,
            duration_minutes: isAI ? parseInt(aiDuration) : null,
            theme: isAI ? aiTheme : null,
            target_date: isAI ? aiDate : null
          });

        if (error) throw error;
      }

      toast.success("Rascunho preservado com sucesso!");
      navigate(getTenantPath('/profile'));
    } catch (error: any) {
      toast.error(`Falha ao salvar rascunho: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSermon = async (isAI: boolean) => {
    setIsSaving(true);
    try {
      const title = isAI ? generatedContent?.title : manualTitle;
      const references = isAI ? generatedContent?.references : manualReferences.split(',').map(r => r.trim()).filter(Boolean);

      let description = "";
      let transcript = "";

      if (isAI) {
        description = generatedContent.introduction || "";
        transcript = [
          generatedContent.introduction,
          ...(generatedContent.topics?.map((t: any) => `${t.title}\n${t.content}${t.verse ? `\n📖 ${t.verse}` : ""}`) || []),
          generatedContent.application,
          generatedContent.conclusion
        ].filter(Boolean).join('\n\n');
      } else {
        transcript = manualContent;
      }

      let preacherId = null;
      if (userProfile && preachers.length > 0) {
        const normalizeName = (name: string) => {
          return name.toLowerCase().replace(/^(pr\.|pastor\s+|pra\.|pastora\s+)/, '').trim();
        };

        const userFullName = normalizeName(userProfile.full_name || '');
        const userFirstName = userFullName.split(' ')[0];

        let match = preachers.find(p => normalizeName(p.name) === userFullName);
        if (!match) {
          match = preachers.find(p => normalizeName(p.name).includes(userFirstName));
        }
        if (match) preacherId = match.id;
      }

      const { error } = await supabase
        .from('sermons')
        .insert({
          title,
          description: description || null,
          transcript,
          bible_references: references,
          is_published: true,
          recorded_at: isAI ? aiDate : new Date().toLocaleDateString('en-CA'),
          duration_minutes: isAI ? parseInt(aiDuration) : null,
          preacher_id: preacherId
        });

      if (error) throw error;

      if (draftId) {
        await supabase.from('sermon_drafts').delete().eq('id', draftId);
      }

      toast.success("Ministração publicada com êxito!");
      navigate(getTenantPath('/sermons'));
    } catch (error: any) {
      toast.error(`Erro na publicação: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-32 animate-fade-in space-y-8">
      {/* Dynamic Immersive Header */}
      <header className="flex items-center gap-6 mb-12">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full bg-secondary/50 backdrop-blur-md active:scale-95 transition-all">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="space-y-1">
           <h1 className="text-3xl md:text-5xl font-serif font-black text-foreground tracking-tight">
             {draftId ? "Refinar Rascunho" : "Criar Ministração"}
           </h1>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/60">Artesão da Palavra</p>
        </div>
      </header>

      <Tabs defaultValue="ai" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1.5 bg-secondary/40 backdrop-blur-md rounded-3xl h-16 border border-border/40 mb-12">
          <TabsTrigger value="ai" className="rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:shadow-soft gap-3" disabled={!!draftId && generatedContent && !generatedContent.is_ai_generated === false}>
            <Sparkles className="w-4 h-4 fill-primary/20" />
            Com Inteligência Artificial
          </TabsTrigger>
          <TabsTrigger value="manual" className="rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-background data-[state=active]:shadow-soft gap-3" disabled={!!draftId && generatedContent && generatedContent.is_ai_generated === true}>
            <PenTool className="w-4 h-4" />
            Redação Manual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="mt-0 space-y-8 animate-slide-up">
           {!generatedContent ? (
            <Card className="rounded-[40px] border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl-soft overflow-hidden">
               <div className="p-8 md:p-12 space-y-8">
                  <div className="flex flex-col items-center text-center space-y-4 mb-4">
                     <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Sparkles className="w-8 h-8" />
                     </div>
                     <h3 className="text-xl font-serif font-bold">Gerador de Estrutura Homilética</h3>
                     <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">Nossa IA ajuda a organizar seus pensamentos em uma estrutura clara com introdução, tópicos exegéticos e aplicação prática.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" /> Data da Entrega
                        </Label>
                        <Input type="date" value={aiDate} onChange={(e) => setAiDate(e.target.value)} className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6 font-medium" />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5" /> Duração Prevista
                        </Label>
                        <Select value={aiDuration} onValueChange={setAiDuration}>
                          <SelectTrigger className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="15">15 minutos (Briefing)</SelectItem>
                            <SelectItem value="30">30 minutos (Padrão)</SelectItem>
                            <SelectItem value="45">45 minutos (Exegético)</SelectItem>
                            <SelectItem value="60">60 minutos (Seminário)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                          <BookOpen className="w-3.5 h-3.5" /> Tema Central
                        </Label>
                        <Input value={aiTheme} onChange={(e) => setAiTheme(e.target.value)} placeholder="Ex: A Fidelidade de Deus" className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6 font-medium" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                          <Target className="w-3.5 h-3.5" /> Assunto Principal *
                        </Label>
                        <Input value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} placeholder="O foco da sua mensagem..." className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-6 font-medium" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expectativa do Ministro</Label>
                        <Textarea value={aiExpectation} onChange={(e) => setAiExpectation(e.target.value)} placeholder="O que deseja que a igreja sinta ou aprenda?" className="h-40 rounded-[28px] bg-secondary/30 border-border/40 p-6 font-medium resize-none" />
                      </div>
                    </div>
                  </div>

                  <Button variant="gold" className="w-full h-20 rounded-[32px] bg-primary text-white font-black uppercase text-sm tracking-[0.3em] shadow-xl shadow-primary/20 hover:opacity-95 active:scale-[0.98] transition-all" onClick={handleGenerateWithAI} disabled={isGenerating}>
                    {isGenerating ? (
                      <div className="flex items-center gap-4">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>Sintonizando Inspiração...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <Sparkles className="w-6 h-6" />
                        <span>Gerar Estrutura</span>
                      </div>
                    )}
                  </Button>
               </div>
            </Card>
           ) : (
            <Card className="rounded-[40px] border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl-soft overflow-hidden animate-scale-in">
                <div className="p-8 md:p-12 space-y-10">
                  <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/40 pb-8">
                     <div className="space-y-2 flex-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Título da Ministração</Label>
                        <Input value={generatedContent.title} onChange={(e) => updateGeneratedContent('title', e.target.value)} className="text-3xl md:text-5xl font-serif font-black border-none shadow-none bg-transparent px-0 h-auto focus-visible:ring-0 leading-none" />
                     </div>
                     <Button variant="ghost" className="h-12 px-6 rounded-2xl bg-secondary/50 font-black uppercase text-[10px] tracking-widest" onClick={() => setGeneratedContent(null)}>
                        Reiniciar IA
                     </Button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                       <section className="space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-1.5 h-6 bg-primary/40 rounded-full" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pórtico de Entrada</h4>
                          </div>
                          <Textarea value={generatedContent.introduction} onChange={(e) => updateGeneratedContent('introduction', e.target.value)} className="min-h-[180px] rounded-[32px] bg-secondary/20 border-border/40 p-6 font-serif text-lg leading-relaxed focus:ring-primary/20 resize-none" />
                       </section>

                       <section className="space-y-6">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-1.5 h-6 bg-gold/40 rounded-full" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Corpo da Mensagem</h4>
                          </div>
                          {generatedContent.topics?.map((topic: any, index: number) => (
                            <div key={index} className="space-y-4 p-8 rounded-[40px] bg-white/40 border border-border/20 shadow-sm relative group">
                              <span className="absolute -left-3 top-8 w-8 h-8 rounded-xl bg-gold/20 text-gold flex items-center justify-center font-black text-xs">
                                {index + 1}
                              </span>
                              <Input value={topic.title} onChange={(e) => updateTopic(index, 'title', e.target.value)} className="text-lg font-serif font-bold border-none bg-transparent p-0 h-auto focus-visible:ring-0" />
                              <Textarea value={topic.content} onChange={(e) => updateTopic(index, 'content', e.target.value)} className="min-h-[140px] border-none bg-transparent p-0 focus-visible:ring-0 font-serif text-base leading-relaxed resize-none" />
                              {topic.verse && (
                                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                                   <BookOpen className="w-4 h-4 text-primary" />
                                   <Input value={topic.verse} onChange={(e) => updateTopic(index, 'verse', e.target.value)} className="text-xs font-black uppercase tracking-widest text-primary border-none bg-transparent p-0 h-8 focus-visible:ring-0" />
                                </div>
                              )}
                            </div>
                          ))}
                       </section>
                    </div>

                    <div className="space-y-10">
                       <section className="space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-1.5 h-6 bg-green-500/40 rounded-full" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Frutos e Aplicação</h4>
                          </div>
                          <Textarea value={generatedContent.application} onChange={(e) => updateGeneratedContent('application', e.target.value)} className="min-h-[160px] rounded-[32px] bg-secondary/20 border-border/40 p-6 font-serif text-lg leading-relaxed focus:ring-primary/20 resize-none" />
                       </section>

                       <section className="space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                             <div className="w-1.5 h-6 bg-destructive/40 rounded-full" />
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Selamento e Conclusão</h4>
                          </div>
                          <Textarea value={generatedContent.conclusion} onChange={(e) => updateGeneratedContent('conclusion', e.target.value)} className="min-h-[160px] rounded-[32px] bg-secondary/20 border-border/40 p-6 font-serif text-lg leading-relaxed focus:ring-primary/20 resize-none" />
                       </section>

                       {generatedContent.references && (
                         <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-6">Referências de Apoio</h4>
                           <div className="flex flex-wrap gap-2">
                             {generatedContent.references.map((ref: string, index: number) => (
                               <Badge key={index} className="px-4 py-2 bg-white text-primary border-primary/10 rounded-xl font-bold font-serif text-sm">
                                 {ref}
                               </Badge>
                             ))}
                           </div>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12 border-t border-border/40">
                    <Button variant="outline" className="h-16 rounded-[24px] border-border/40 bg-white/50 font-black uppercase text-[10px] tracking-widest shadow-soft transition-all active:scale-[0.98]" onClick={() => handleSaveDraft(true)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                      Salvar Rascunho
                    </Button>
                    <Button variant="gold" className="h-16 rounded-[24px] bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" onClick={() => handleSaveSermon(true)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                      Consagrar e Publicar
                    </Button>
                  </div>
                </div>
            </Card>
           )}
        </TabsContent>

        <TabsContent value="manual" className="mt-0 space-y-8 animate-slide-up">
          <Card className="rounded-[40px] border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl-soft overflow-hidden">
             <div className="p-8 md:p-12 space-y-10">
                <div className="space-y-6">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Título do Sermão *</Label>
                     <Input value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} placeholder="Ex: O Culto Racional" className="h-16 rounded-2xl bg-secondary/30 border-border/40 px-8 text-2xl font-serif font-black focus:ring-primary/20 transition-all" />
                   </div>

                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Manuscrito de Mensagem</Label>
                     <Textarea value={manualContent} onChange={(e) => setManualContent(e.target.value)} placeholder="Escreva aqui sua revelação..." className="min-h-[500px] rounded-[32px] bg-secondary/20 border-border/40 p-8 font-serif text-xl leading-relaxed focus:ring-primary/20 resize-none" />
                   </div>

                   <div className="space-y-2">
                     <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Citações Bíblicas (Separadas por vírgula)</Label>
                     <Input value={manualReferences} onChange={(e) => setManualReferences(e.target.value)} placeholder="Ex: João 3:16, Efésios 2:8, Salmos 1:1" className="h-14 rounded-2xl bg-secondary/30 border-border/40 px-8 font-serif font-bold text-primary" />
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-border/40">
                  <Button variant="outline" className="h-16 rounded-[24px] border-border/40 bg-white/50 font-black uppercase text-[10px] tracking-widest shadow-soft transition-all active:scale-[0.98]" onClick={() => handleSaveDraft(false)} disabled={isSaving || !manualTitle}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                    Preservar Cópia
                  </Button>
                  <Button variant="gold" className="h-16 rounded-[24px] bg-primary text-white font-black uppercase text-[10px] tracking-[0.3em] shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" onClick={() => handleSaveSermon(false)} disabled={isSaving || !manualTitle}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-3" />}
                    Finalizar e Publicar
                  </Button>
                </div>
             </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateSermon;
