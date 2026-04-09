import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, Loader2, Calendar, Star, Upload, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReadingPlan {
  id: string;
  title: string;
  description: string | null;
  duration_days: number;
  difficulty: string | null;
  category: string | null;
  is_active: boolean | null;
  thumbnail_url: string | null;
  tags: string[] | null;
  author: string | null;
  is_featured: boolean | null;
  order_index: number | null;
}

const AVAILABLE_TAGS = [
  "AMOR", "CURA", "ESPERANÇA", "FÉ", "ANSIEDADE", "RAIVA",
  "DEPRESSÃO", "RELACIONAMENTOS", "PERDÃO", "GRATIDÃO",
  "PAZ", "FORÇA", "SABEDORIA", "FAMÍLIA", "TRABALHO"
];

const AdminPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ReadingPlan | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_days: 7,
    difficulty: "medium",
    category: "",
    is_active: true,
    thumbnail_url: "",
    tags: [] as string[],
    author: "",
    is_featured: false,
    order_index: 0,
  });
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({ title: "Por favor, selecione uma imagem", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `plan-${Date.now()}.${fileExt}`;
      const filePath = `plans/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("church-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("church-assets")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnail_url: publicUrl }));
      toast({ title: "Imagem enviada com sucesso!" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Erro ao enviar imagem", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from("reading_plans")
      .select("*")
      .order("order_index", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar planos", variant: "destructive" });
    } else {
      setPlans((data || []) as ReadingPlan[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSubmit = async () => {
    if (!formData.title || !formData.duration_days) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }

    const planData = {
      title: formData.title,
      description: formData.description || null,
      duration_days: formData.duration_days,
      difficulty: formData.difficulty,
      category: formData.category || null,
      is_active: formData.is_active,
      thumbnail_url: formData.thumbnail_url || null,
      tags: formData.tags.length > 0 ? formData.tags : null,
      author: formData.author || null,
      is_featured: formData.is_featured,
      order_index: formData.order_index,
    };

    if (editingPlan) {
      const { error } = await supabase
        .from("reading_plans")
        .update(planData)
        .eq("id", editingPlan.id);

      if (error) {
        toast({ title: "Erro ao atualizar plano", variant: "destructive" });
      } else {
        toast({ title: "Plano atualizado com sucesso!" });
        setDialogOpen(false);
        fetchPlans();
      }
    } else {
      const { error } = await supabase.from("reading_plans").insert(planData);

      if (error) {
        toast({ title: "Erro ao criar plano", variant: "destructive" });
      } else {
        toast({ title: "Plano criado com sucesso!" });
        setDialogOpen(false);
        fetchPlans();
      }
    }
  };

  const handleEdit = (plan: ReadingPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      duration_days: plan.duration_days,
      difficulty: plan.difficulty || "medium",
      category: plan.category || "",
      is_active: plan.is_active ?? true,
      thumbnail_url: plan.thumbnail_url || "",
      tags: plan.tags || [],
      author: plan.author || "",
      is_featured: plan.is_featured ?? false,
      order_index: plan.order_index ?? 0,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    const { error } = await supabase.from("reading_plans").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir plano", variant: "destructive" });
    } else {
      toast({ title: "Plano excluído com sucesso!" });
      fetchPlans();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from("reading_plans")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) fetchPlans();
  };

  const toggleFeatured = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from("reading_plans")
      .update({ is_featured: !currentStatus })
      .eq("id", id);

    if (!error) fetchPlans();
  };

  const resetForm = () => {
    setEditingPlan(null);
    setFormData({
      title: "",
      description: "",
      duration_days: 7,
      difficulty: "medium",
      category: "",
      is_active: true,
      thumbnail_url: "",
      tags: [],
      author: "",
      is_featured: false,
      order_index: 0,
    });
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Fácil</Badge>;
      case "medium":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Médio</Badge>;
      case "hard":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Difícil</Badge>;
      default:
        return <Badge variant="secondary">-</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Planos de Leitura</h1>
          <p className="text-muted-foreground">Gerencie os planos de leitura bíblica</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? "Editar Plano" : "Novo Plano de Leitura"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Bíblia em 1 Ano"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva o plano..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="Ex: Pastor João"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (dias) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={1}
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Devocional"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="order">Ordem</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imagem de Capa</Label>
                {formData.thumbnail_url ? (
                  <div className="relative">
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, thumbnail_url: "" })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Image className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Arraste uma imagem ou clique para selecionar
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="thumbnail-upload"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                    <label htmlFor="thumbnail-upload">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        asChild
                      >
                        <span className="cursor-pointer">
                          {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          {uploading ? "Enviando..." : "Enviar Imagem"}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
                <Input
                  id="thumbnail"
                  value={formData.thumbnail_url}
                  onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                  placeholder="Ou cole a URL da imagem..."
                  className="mt-2"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="active">Ativo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                  />
                  <Label htmlFor="featured">Destaque</Label>
                </div>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editingPlan ? "Salvar Alterações" : "Criar Plano"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum plano cadastrado</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{plan.title}</CardTitle>
                        {plan.is_featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.duration_days} dias • {plan.category || "Sem categoria"}
                      </p>
                      {plan.author && (
                        <p className="text-xs text-muted-foreground">por {plan.author}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getDifficultyBadge(plan.difficulty)}
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {plan.tags && plan.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {plan.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(plan)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/admin/plans/${plan.id}/days`)}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Dias
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFeatured(plan.id, plan.is_featured)}
                    >
                      <Star className={`w-4 h-4 ${plan.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Dificuldade</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      <div>
                        {plan.title}
                        {plan.tags && plan.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {plan.tags.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{plan.author || "-"}</TableCell>
                    <TableCell>{plan.duration_days} dias</TableCell>
                    <TableCell>{plan.category || "-"}</TableCell>
                    <TableCell>{getDifficultyBadge(plan.difficulty)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.is_featured ?? false}
                        onCheckedChange={() => toggleFeatured(plan.id, plan.is_featured)}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={plan.is_active ?? false}
                        onCheckedChange={() => toggleActive(plan.id, plan.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(plan)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/plans/${plan.id}/days`)}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
};

export default AdminPlans;
