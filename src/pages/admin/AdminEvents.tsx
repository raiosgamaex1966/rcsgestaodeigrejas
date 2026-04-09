import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAllEvents, useCreateEvent, EventInsert } from "@/hooks/useEvents";
import { useEventCategories } from "@/hooks/useEventCategories";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Loader2, FolderOpen } from "lucide-react";
import { EventDashboardStats } from "@/components/admin/events/EventDashboardStats";
import { EventCardAdmin } from "@/components/admin/events/EventCardAdmin";
import { EventImageUpload } from "@/components/admin/events/EventImageUpload";
import { parseISO, isPast } from "date-fns";

const defaultFormData: EventInsert & { category_id?: string | null } = {
  title: "",
  description: "",
  event_type: "culto",
  location: "",
  start_date: "",
  start_time: "",
  end_time: "",
  is_recurring: false,
  recurrence_pattern: null,
  recurrence_day: null,
  is_featured: false,
  is_active: true,
  image_url: null,
  category_id: null,
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useAllEvents();
  const { data: categories = [] } = useEventCategories();
  const createEvent = useCreateEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState(defaultFormData);
  const [filter, setFilter] = useState("all");

  // Get attendees count for all events
  const { data: attendeesCounts = {} } = useQuery({
    queryKey: ["events-attendees-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_attendees")
        .select("event_id");
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach(a => {
        counts[a.event_id] = (counts[a.event_id] || 0) + 1;
      });
      return counts;
    },
  });

  const totalAttendees = Object.values(attendeesCounts).reduce((a, b) => a + b, 0);

  const filteredEvents = events.filter(event => {
    const regStatus = (event as any).registration_status || "none";
    const eventDate = parseISO(event.start_date);
    
    switch (filter) {
      case "open": return regStatus === "open" && !isPast(eventDate);
      case "closed": return regStatus === "closed" || isPast(eventDate);
      case "upcoming": return !isPast(eventDate);
      case "past": return isPast(eventDate);
      default: return true;
    }
  });

  const eventsWithData = filteredEvents.map(event => ({
    ...event,
    attendees_count: attendeesCounts[event.id] || 0,
    category: categories.find(c => c.id === (event as any).category_id) || null,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Convert empty strings to null for time fields
    const dataToSubmit = {
      ...formData,
      start_time: formData.start_time || null,
      end_time: formData.end_time || null,
    };
    await createEvent.mutateAsync(dataToSubmit as any);
    setDialogOpen(false);
    setFormData(defaultFormData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Agenda e Eventos</h1>
          <p className="text-muted-foreground">Gerencie cultos, eventos e reuniões</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/events/categories")}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Categorias
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" />Novo Evento</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Evento</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título *</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={formData.category_id || "none"} onValueChange={(v) => setFormData({ ...formData, category_id: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem categoria</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <EventImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({ ...formData, image_url: url })}
                />
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={formData.description || ""} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <Input value={formData.location || ""} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Horário</Label>
                    <Input type="time" value={formData.start_time || ""} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_featured} onCheckedChange={(c) => setFormData({ ...formData, is_featured: c })} />
                    <Label>Destaque</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} />
                    <Label>Ativo</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createEvent.isPending}>
                    {createEvent.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Criar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <EventDashboardStats events={events} totalAttendees={totalAttendees} />

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Todos ({events.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Próximos</TabsTrigger>
          <TabsTrigger value="open">Inscrições Abertas</TabsTrigger>
          <TabsTrigger value="past">Passados</TabsTrigger>
        </TabsList>
      </Tabs>

      {eventsWithData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {eventsWithData.map((event) => (
            <EventCardAdmin key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">Nenhum evento encontrado.</div>
      )}
    </div>
  );
};

export default AdminEvents;
