import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  ArrowLeft, Plus, Search, Edit, Trash2, Route, Users, 
  CheckCircle, GripVertical, ChevronDown, ChevronUp
} from "lucide-react";
import { Link } from "react-router-dom";

interface Journey {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  is_active: boolean | null;
  order_index: number | null;
  created_at: string | null;
}

interface JourneyStep {
  id: string;
  journey_id: string;
  title: string;
  description: string | null;
  order_index: number | null;
}

interface JourneyProgress {
  id: string;
  user_id: string;
  journey_id: string;
  step_id: string | null;
  status: string | null;
  started_at: string | null;
  completed_at: string | null;
  profiles?: {
    full_name: string | null;
  };
}

export default function AdminJourneys() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);
  const [isProgressDialogOpen, setIsProgressDialogOpen] = useState(false);
  const [editingJourney, setEditingJourney] = useState<Journey | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    icon: "BookOpen",
    is_active: true,
    order_index: 0
  });
  const [stepFormData, setStepFormData] = useState({
    title: "",
    description: "",
    order_index: 0
  });
  const [editingStep, setEditingStep] = useState<JourneyStep | null>(null);

  // Fetch journeys
  const { data: journeys = [], isLoading } = useQuery({
    queryKey: ["admin-journeys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journeys")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as Journey[];
    }
  });

  // Fetch steps for all journeys
  const { data: allSteps = [] } = useQuery({
    queryKey: ["admin-journey-steps"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_steps")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data as JourneyStep[];
    }
  });

  // Fetch progress for selected journey
  const { data: journeyProgress = [] } = useQuery({
    queryKey: ["admin-journey-progress", selectedJourney?.id],
    queryFn: async () => {
      if (!selectedJourney) return [];
      const { data, error } = await supabase
        .from("journey_progress")
        .select(`
          *,
          profiles:user_id (full_name)
        `)
        .eq("journey_id", selectedJourney.id);
      if (error) throw error;
      return data as JourneyProgress[];
    },
    enabled: !!selectedJourney && isProgressDialogOpen
  });

  // Create/Update journey
  const journeyMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("journeys")
          .update({
            title: data.title,
            description: data.description || null,
            icon: data.icon,
            is_active: data.is_active,
            order_index: data.order_index
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("journeys")
          .insert({
            title: data.title,
            description: data.description || null,
            icon: data.icon,
            is_active: data.is_active,
            order_index: data.order_index
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journeys"] });
      toast.success(editingJourney ? "Jornada atualizada!" : "Jornada criada!");
      resetForm();
    },
    onError: () => toast.error("Erro ao salvar jornada")
  });

  // Delete journey
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journeys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journeys"] });
      toast.success("Jornada excluída!");
    },
    onError: () => toast.error("Erro ao excluir jornada")
  });

  // Create/Update step
  const stepMutation = useMutation({
    mutationFn: async (data: typeof stepFormData & { id?: string; journey_id: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from("journey_steps")
          .update({
            title: data.title,
            description: data.description || null,
            order_index: data.order_index
          })
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("journey_steps")
          .insert({
            journey_id: data.journey_id,
            title: data.title,
            description: data.description || null,
            order_index: data.order_index
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journey-steps"] });
      toast.success(editingStep ? "Etapa atualizada!" : "Etapa criada!");
      resetStepForm();
    },
    onError: () => toast.error("Erro ao salvar etapa")
  });

  // Delete step
  const deleteStepMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journey_steps").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journey-steps"] });
      toast.success("Etapa excluída!");
    },
    onError: () => toast.error("Erro ao excluir etapa")
  });

  const resetForm = () => {
    setFormData({ title: "", description: "", icon: "BookOpen", is_active: true, order_index: 0 });
    setEditingJourney(null);
    setIsDialogOpen(false);
  };

  const resetStepForm = () => {
    setStepFormData({ title: "", description: "", order_index: 0 });
    setEditingStep(null);
  };

  const handleEdit = (journey: Journey) => {
    setEditingJourney(journey);
    setFormData({
      title: journey.title,
      description: journey.description || "",
      icon: journey.icon || "BookOpen",
      is_active: journey.is_active ?? true,
      order_index: journey.order_index || 0
    });
    setIsDialogOpen(true);
  };

  const handleEditStep = (step: JourneyStep) => {
    setEditingStep(step);
    setStepFormData({
      title: step.title,
      description: step.description || "",
      order_index: step.order_index || 0
    });
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    journeyMutation.mutate({ ...formData, id: editingJourney?.id });
  };

  const handleStepSubmit = () => {
    if (!stepFormData.title.trim() || !selectedJourney) {
      toast.error("Título é obrigatório");
      return;
    }
    stepMutation.mutate({ 
      ...stepFormData, 
      id: editingStep?.id, 
      journey_id: selectedJourney.id 
    });
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta jornada?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteStep = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta etapa?")) {
      deleteStepMutation.mutate(id);
    }
  };

  const openStepsDialog = (journey: Journey) => {
    setSelectedJourney(journey);
    setIsStepsDialogOpen(true);
  };

  const openProgressDialog = (journey: Journey) => {
    setSelectedJourney(journey);
    setIsProgressDialogOpen(true);
  };

  const filteredJourneys = journeys.filter(j =>
    j.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStepsForJourney = (journeyId: string) => 
    allSteps.filter(s => s.journey_id === journeyId);

  const getProgressStats = (journeyId: string) => {
    const steps = getStepsForJourney(journeyId);
    return { totalSteps: steps.length };
  };

  // Stats
  const totalJourneys = journeys.length;
  const activeJourneys = journeys.filter(j => j.is_active).length;
  const totalSteps = allSteps.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Jornadas</h1>
            <p className="text-muted-foreground">Gerencie as jornadas espirituais</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Jornada
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingJourney ? "Editar Jornada" : "Nova Jornada"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Nome da jornada"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da jornada"
                  rows={3}
                />
              </div>
              <div>
                <Label>Ícone</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Nome do ícone (ex: BookOpen)"
                />
              </div>
              <div>
                <Label>Ordem</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Ativa</Label>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                <Button onClick={handleSubmit} disabled={journeyMutation.isPending}>
                  {editingJourney ? "Salvar" : "Criar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Route className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalJourneys}</p>
              <p className="text-sm text-muted-foreground">Total de Jornadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeJourneys}</p>
              <p className="text-sm text-muted-foreground">Jornadas Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <GripVertical className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalSteps}</p>
              <p className="text-sm text-muted-foreground">Total de Etapas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar jornadas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Journeys List */}
      <div className="space-y-4">
        {filteredJourneys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium">Nenhuma jornada encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Crie uma nova jornada para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredJourneys.map((journey) => {
            const steps = getStepsForJourney(journey.id);
            const isExpanded = expandedJourney === journey.id;

            return (
              <Card key={journey.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Route className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {journey.title}
                          <Badge variant={journey.is_active ? "default" : "secondary"}>
                            {journey.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        </CardTitle>
                        {journey.description && (
                          <p className="text-sm text-muted-foreground">
                            {journey.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{steps.length} etapas</Badge>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setExpandedJourney(isExpanded ? null : journey.id)}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openStepsDialog(journey)}>
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openProgressDialog(journey)}>
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(journey)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(journey.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && steps.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="border-t pt-4 mt-2">
                      <p className="text-sm font-medium mb-3">Etapas:</p>
                      <div className="space-y-2">
                        {steps.map((step, index) => (
                          <div key={step.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.title}</p>
                              {step.description && (
                                <p className="text-xs text-muted-foreground">{step.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Steps Dialog */}
      <Dialog open={isStepsDialogOpen} onOpenChange={setIsStepsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Etapas - {selectedJourney?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Add/Edit Step Form */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-medium text-sm">
                  {editingStep ? "Editar Etapa" : "Nova Etapa"}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Título *</Label>
                    <Input
                      value={stepFormData.title}
                      onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
                      placeholder="Título da etapa"
                    />
                  </div>
                  <div>
                    <Label>Ordem</Label>
                    <Input
                      type="number"
                      value={stepFormData.order_index}
                      onChange={(e) => setStepFormData({ ...stepFormData, order_index: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={stepFormData.description}
                    onChange={(e) => setStepFormData({ ...stepFormData, description: e.target.value })}
                    placeholder="Descrição da etapa"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  {editingStep && (
                    <Button variant="outline" onClick={resetStepForm}>Cancelar</Button>
                  )}
                  <Button onClick={handleStepSubmit} disabled={stepMutation.isPending}>
                    {editingStep ? "Salvar" : "Adicionar Etapa"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Steps List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {selectedJourney && getStepsForJourney(selectedJourney.id).map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{step.title}</p>
                    {step.description && (
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleEditStep(step)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {selectedJourney && getStepsForJourney(selectedJourney.id).length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma etapa cadastrada
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={isProgressDialogOpen} onOpenChange={setIsProgressDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Participantes - {selectedJourney?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {journeyProgress.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum participante nesta jornada
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {journeyProgress.map((progress) => (
                  <div key={progress.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{progress.profiles?.full_name || "Usuário"}</p>
                        <p className="text-sm text-muted-foreground">
                          Iniciou em {progress.started_at ? new Date(progress.started_at).toLocaleDateString("pt-BR") : "-"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={progress.status === "concluído" ? "default" : "secondary"}>
                      {progress.status || "iniciado"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
