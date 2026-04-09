import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Trash2, Copy } from "lucide-react";
import { EventImageUpload } from "@/components/admin/events/EventImageUpload";
import { EventBanner } from "@/components/admin/events/EventBanner";
import { EventGeneralTab } from "@/components/admin/events/tabs/EventGeneralTab";
import { EventAttendeesTab } from "@/components/admin/events/tabs/EventAttendeesTab";
import { EventSettingsTab } from "@/components/admin/events/tabs/EventSettingsTab";
import { EventReportTab } from "@/components/admin/events/tabs/EventReportTab";
import { EventPaymentTab } from "@/components/admin/events/tabs/EventPaymentTab";
import { useUpdateEvent, useDeleteEvent, useCreateEvent } from "@/hooks/useEvents";
import { useEventCategories } from "@/hooks/useEventCategories";
import { toast } from "sonner";

const AdminEventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const createEvent = useCreateEvent();
  const { data: categories = [] } = useEventCategories();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const { data: event, isLoading, refetch } = useQuery({
    queryKey: ["event-detail", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          category:category_id(id, name, color, icon)
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { data: attendeesCount = 0 } = useQuery({
    queryKey: ["event-attendees-count", eventId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("event_attendees")
        .select("*", { count: "exact", head: true })
        .eq("event_id", eventId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!eventId,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "culto",
    location: "",
    start_date: "",
    start_time: "",
    end_time: "",
    is_recurring: false,
    recurrence_pattern: null as string | null,
    recurrence_day: null as number | null,
    is_featured: false,
    is_active: true,
    image_url: null as string | null,
    category_id: null as string | null,
  });

  const openEditDialog = () => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description || "",
        event_type: event.event_type,
        location: event.location || "",
        start_date: event.start_date,
        start_time: event.start_time || "",
        end_time: event.end_time || "",
        is_recurring: event.is_recurring || false,
        recurrence_pattern: event.recurrence_pattern,
        recurrence_day: event.recurrence_day,
        is_featured: event.is_featured || false,
        is_active: event.is_active,
        image_url: event.image_url || null,
        category_id: event.category_id || null,
      });
    }
    setEditDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    
    try {
      await updateEvent.mutateAsync({
        id: eventId,
        ...formData,
        description: formData.description || null,
        location: formData.location || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        image_url: formData.image_url || null,
      });
      setEditDialogOpen(false);
      refetch();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDelete = async () => {
    if (!eventId) return;
    if (confirm("Tem certeza que deseja excluir este evento?")) {
      await deleteEvent.mutateAsync(eventId);
      navigate("/admin/events");
    }
  };

  const handleDuplicate = async () => {
    if (!event) return;
    try {
      await createEvent.mutateAsync({
        title: `${event.title} (cópia)`,
        description: event.description,
        event_type: event.event_type,
        location: event.location,
        start_date: event.start_date,
        start_time: event.start_time,
        end_time: event.end_time,
        is_recurring: event.is_recurring,
        recurrence_pattern: event.recurrence_pattern,
        recurrence_day: event.recurrence_day,
        is_featured: false,
        is_active: true,
        image_url: event.image_url,
      });
      toast.success("Evento duplicado com sucesso!");
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Evento não encontrado.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/events")}>
          Voltar para lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/admin/events")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista de eventos
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Banner */}
      <EventBanner 
        event={{ ...event, attendees_count: attendeesCount }} 
        onEdit={openEditDialog} 
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full flex overflow-x-auto">
          <TabsTrigger value="general" className="flex-shrink-0">Geral</TabsTrigger>
          <TabsTrigger value="attendees" className="flex-shrink-0">
            Inscritos
            {attendeesCount > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                {attendeesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex-shrink-0">Pagamento</TabsTrigger>
          <TabsTrigger value="settings" className="flex-shrink-0">Config</TabsTrigger>
          <TabsTrigger value="report" className="flex-shrink-0">Relatório</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
          <EventGeneralTab event={event} />
        </TabsContent>
        <TabsContent value="attendees" className="mt-6">
          <EventAttendeesTab 
            eventId={event.id} 
            registrationLimit={(event as any).registration_limit} 
          />
        </TabsContent>
        <TabsContent value="payment" className="mt-6">
          <EventPaymentTab event={event as any} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <EventSettingsTab event={event} />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <EventReportTab event={event} />
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Evento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, category_id: value === "none" ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <EventImageUpload
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
            />

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Templo principal"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Horário Início</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">Horário Término</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label htmlFor="is_featured">Destaque</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateEvent.isPending}>
                {updateEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEventDetail;
