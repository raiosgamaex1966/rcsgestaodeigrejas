import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Pencil, Trash2, ChevronLeft, Loader2, BookOpen, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Reading {
  book: string;
  chapter: number;
}

interface PlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string | null;
  readings: Reading[];
  reflection: string | null;
  devotional_title: string | null;
  devotional_content: string | null;
  practical_action: string | null;
  prayer: string | null;
  audio_url: string | null;
  verse_reference: string | null;
  verse_text: string | null;
}

interface Plan {
  id: string;
  title: string;
  duration_days: number;
}

const AdminPlanDays = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDay, setEditingDay] = useState<PlanDay | null>(null);
  const [formData, setFormData] = useState({
    day_number: 1,
    title: "",
    devotional_title: "",
    devotional_content: "",
    practical_action: "",
    prayer: "",
    verse_reference: "",
    verse_text: "",
    audio_url: "",
    reflection: "",
    readings: [{ book: "", chapter: 1 }] as Reading[],
  });

  const fetchPlan = async () => {
    if (!planId) return;
    
    const { data, error } = await supabase
      .from("reading_plans")
      .select("id, title, duration_days")
      .eq("id", planId)
      .single();
    
    if (!error && data) {
      setPlan(data);
    }
  };

  const fetchDays = async () => {
    if (!planId) return;
    
    const { data, error } = await supabase
      .from("reading_plan_days")
      .select("*")
      .eq("plan_id", planId)
      .order("day_number", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar dias", variant: "destructive" });
    } else {
      setDays((data || []).map(d => ({
        ...d,
        readings: (d.readings as unknown as Reading[]) || [],
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([fetchPlan(), fetchDays()]);
  }, [planId]);

  const resetForm = () => {
    const nextDayNumber = days.length > 0 ? Math.max(...days.map(d => d.day_number)) + 1 : 1;
    setEditingDay(null);
    setFormData({
      day_number: nextDayNumber,
      title: "",
      devotional_title: "",
      devotional_content: "",
      practical_action: "",
      prayer: "",
      verse_reference: "",
      verse_text: "",
      audio_url: "",
      reflection: "",
      readings: [{ book: "", chapter: 1 }],
    });
  };

  const handleEdit = (day: PlanDay) => {
    setEditingDay(day);
    setFormData({
      day_number: day.day_number,
      title: day.title || "",
      devotional_title: day.devotional_title || "",
      devotional_content: day.devotional_content || "",
      practical_action: day.practical_action || "",
      prayer: day.prayer || "",
      verse_reference: day.verse_reference || "",
      verse_text: day.verse_text || "",
      audio_url: day.audio_url || "",
      reflection: day.reflection || "",
      readings: day.readings.length > 0 ? day.readings : [{ book: "", chapter: 1 }],
    });
    setDialogOpen(true);
  };

  const handleDuplicate = (day: PlanDay) => {
    const nextDayNumber = days.length > 0 ? Math.max(...days.map(d => d.day_number)) + 1 : 1;
    setEditingDay(null);
    setFormData({
      day_number: nextDayNumber,
      title: day.title || "",
      devotional_title: day.devotional_title || "",
      devotional_content: day.devotional_content || "",
      practical_action: day.practical_action || "",
      prayer: day.prayer || "",
      verse_reference: day.verse_reference || "",
      verse_text: day.verse_text || "",
      audio_url: day.audio_url || "",
      reflection: day.reflection || "",
      readings: [...day.readings],
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!planId || formData.day_number < 1) {
      toast({ title: "Número do dia inválido", variant: "destructive" });
      return;
    }

    const validReadings = formData.readings.filter(r => r.book.trim() !== "");

    const dayData = {
      plan_id: planId,
      day_number: formData.day_number,
      title: formData.title || null,
      devotional_title: formData.devotional_title || null,
      devotional_content: formData.devotional_content || null,
      practical_action: formData.practical_action || null,
      prayer: formData.prayer || null,
      verse_reference: formData.verse_reference || null,
      verse_text: formData.verse_text || null,
      audio_url: formData.audio_url || null,
      reflection: formData.reflection || null,
      readings: JSON.parse(JSON.stringify(validReadings)),
    };

    if (editingDay) {
      const { error } = await supabase
        .from("reading_plan_days")
        .update(dayData)
        .eq("id", editingDay.id);

      if (error) {
        toast({ title: "Erro ao atualizar dia", variant: "destructive" });
      } else {
        toast({ title: "Dia atualizado!" });
        setDialogOpen(false);
        fetchDays();
      }
    } else {
      const { error } = await supabase
        .from("reading_plan_days")
        .insert(dayData);

      if (error) {
        toast({ title: "Erro ao criar dia", variant: "destructive" });
      } else {
        toast({ title: "Dia criado!" });
        setDialogOpen(false);
        fetchDays();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este dia?")) return;

    const { error } = await supabase.from("reading_plan_days").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Dia excluído!" });
      fetchDays();
    }
  };

  const addReading = () => {
    setFormData(prev => ({
      ...prev,
      readings: [...prev.readings, { book: "", chapter: 1 }]
    }));
  };

  const removeReading = (index: number) => {
    setFormData(prev => ({
      ...prev,
      readings: prev.readings.filter((_, i) => i !== index)
    }));
  };

  const updateReading = (index: number, field: "book" | "chapter", value: string | number) => {
    setFormData(prev => ({
      ...prev,
      readings: prev.readings.map((r, i) => 
        i === index ? { ...r, [field]: value } : r
      )
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin/plans")}
            className="mb-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {plan?.title || "Carregando..."}
          </h1>
          <p className="text-muted-foreground">
            Gerencie os dias do plano ({days.length}/{plan?.duration_days || 0} dias configurados)
          </p>
        </div>
        <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Dia
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : days.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum dia configurado</p>
            <Button className="mt-4" onClick={() => { resetForm(); setDialogOpen(true); }}>
              Criar primeiro dia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {days.map((day) => (
            <AccordionItem key={day.id} value={day.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {day.day_number}
                  </div>
                  <div>
                    <p className="font-semibold">Dia {day.day_number}</p>
                    {day.title && <p className="text-sm text-muted-foreground">{day.title}</p>}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-3">
                {day.devotional_title && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Devocional</Label>
                    <p className="font-medium">{day.devotional_title}</p>
                  </div>
                )}
                {day.verse_reference && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Versículo</Label>
                    <p className="font-medium">{day.verse_reference}</p>
                  </div>
                )}
                {day.readings.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Leituras</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {day.readings.map((r, i) => (
                        <span key={i} className="text-sm bg-primary/10 px-2 py-1 rounded">
                          {r.book} {r.chapter}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(day)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDuplicate(day)}>
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(day.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDay ? `Editar Dia ${editingDay.day_number}` : "Novo Dia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número do Dia *</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.day_number}
                  onChange={(e) => setFormData({ ...formData, day_number: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Título do Dia</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: A Criação"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Devocional</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Título do Devocional</Label>
                  <Input
                    value={formData.devotional_title}
                    onChange={(e) => setFormData({ ...formData, devotional_title: e.target.value })}
                    placeholder="Ex: Cultivando a Humildade"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reflexão</Label>
                  <Textarea
                    value={formData.devotional_content}
                    onChange={(e) => setFormData({ ...formData, devotional_content: e.target.value })}
                    placeholder="Texto da reflexão..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ação Prática</Label>
                  <Textarea
                    value={formData.practical_action}
                    onChange={(e) => setFormData({ ...formData, practical_action: e.target.value })}
                    placeholder="Ex: Hoje, pratique um ato de bondade..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Oração</Label>
                  <Textarea
                    value={formData.prayer}
                    onChange={(e) => setFormData({ ...formData, prayer: e.target.value })}
                    placeholder="Texto da oração..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Versículo do Dia</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Referência (ex: João 3:16)</Label>
                  <Input
                    value={formData.verse_reference}
                    onChange={(e) => setFormData({ ...formData, verse_reference: e.target.value })}
                    placeholder="1João 1:8"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto do Versículo</Label>
                  <Textarea
                    value={formData.verse_text}
                    onChange={(e) => setFormData({ ...formData, verse_text: e.target.value })}
                    placeholder="Se dissermos que não temos pecado..."
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Leituras do Dia</h3>
                <Button type="button" size="sm" variant="outline" onClick={addReading}>
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {formData.readings.map((reading, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      value={reading.book}
                      onChange={(e) => updateReading(index, "book", e.target.value)}
                      placeholder="Livro (ex: Gênesis)"
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={reading.chapter}
                      onChange={(e) => updateReading(index, "chapter", parseInt(e.target.value) || 1)}
                      className="w-20"
                      placeholder="Cap."
                    />
                    {formData.readings.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeReading(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2">
                <Label>URL do Áudio (opcional)</Label>
                <Input
                  value={formData.audio_url}
                  onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <Button className="w-full" onClick={handleSubmit}>
              {editingDay ? "Salvar Alterações" : "Criar Dia"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlanDays;
