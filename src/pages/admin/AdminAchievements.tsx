import { useState, useEffect } from "react";
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
import { Plus, Pencil, Trash2, Trophy, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_reward: number | null;
  criteria: unknown;
  is_active: boolean | null;
}

const iconOptions = [
  { value: "Trophy", label: "🏆 Troféu" },
  { value: "Star", label: "⭐ Estrela" },
  { value: "Flame", label: "🔥 Fogo" },
  { value: "Book", label: "📚 Livro" },
  { value: "Heart", label: "❤️ Coração" },
  { value: "Medal", label: "🏅 Medalha" },
  { value: "Crown", label: "👑 Coroa" },
  { value: "Target", label: "🎯 Alvo" },
];

const AdminAchievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "Trophy",
    points_reward: 50,
    criteria_type: "streak",
    criteria_value: 7,
    is_active: true,
  });
  const { toast } = useToast();

  const fetchAchievements = async () => {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar conquistas", variant: "destructive" });
    } else {
      setAchievements(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({ title: "Preencha o nome da conquista", variant: "destructive" });
      return;
    }

    const criteria = {
      type: formData.criteria_type,
      value: formData.criteria_value,
    };

    if (editingAchievement) {
      const { error } = await supabase
        .from("achievements")
        .update({
          name: formData.name,
          description: formData.description || null,
          icon: formData.icon,
          points_reward: formData.points_reward,
          criteria,
          is_active: formData.is_active,
        })
        .eq("id", editingAchievement.id);

      if (error) {
        toast({ title: "Erro ao atualizar conquista", variant: "destructive" });
      } else {
        toast({ title: "Conquista atualizada com sucesso!" });
        setDialogOpen(false);
        fetchAchievements();
      }
    } else {
      const { error } = await supabase.from("achievements").insert({
        name: formData.name,
        description: formData.description || null,
        icon: formData.icon,
        points_reward: formData.points_reward,
        criteria,
        is_active: formData.is_active,
      });

      if (error) {
        toast({ title: "Erro ao criar conquista", variant: "destructive" });
      } else {
        toast({ title: "Conquista criada com sucesso!" });
        setDialogOpen(false);
        fetchAchievements();
      }
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    const criteria = achievement.criteria as { type?: string; value?: number } | null;
    setFormData({
      name: achievement.name,
      description: achievement.description || "",
      icon: achievement.icon || "Trophy",
      points_reward: achievement.points_reward || 50,
      criteria_type: criteria?.type || "streak",
      criteria_value: criteria?.value || 7,
      is_active: achievement.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta conquista?")) return;

    const { error } = await supabase.from("achievements").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro ao excluir conquista", variant: "destructive" });
    } else {
      toast({ title: "Conquista excluída com sucesso!" });
      fetchAchievements();
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from("achievements")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (!error) fetchAchievements();
  };

  const resetForm = () => {
    setEditingAchievement(null);
    setFormData({
      name: "",
      description: "",
      icon: "Trophy",
      points_reward: 50,
      criteria_type: "streak",
      criteria_value: 7,
      is_active: true,
    });
  };

  const getIconEmoji = (icon: string | null) => {
    const option = iconOptions.find((o) => o.value === icon);
    return option?.label.split(" ")[0] || "🏆";
  };

  const getCriteriaLabel = (criteria: unknown) => {
    if (!criteria || typeof criteria !== 'object') return "-";
    const c = criteria as { type?: string; value?: number };
    const type = c.type;
    const value = c.value;
    
    switch (type) {
      case "streak":
        return `${value} dias de sequência`;
      case "chapters":
        return `${value} capítulos lidos`;
      case "points":
        return `${value} pontos`;
      case "plans":
        return `${value} planos completos`;
      default:
        return `${type}: ${value}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Conquistas</h1>
          <p className="text-muted-foreground">Gerencie as conquistas e badges</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Conquista
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAchievement ? "Editar Conquista" : "Nova Conquista"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Maratonista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva a conquista..."
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ícone</Label>
                  <Select
                    value={formData.icon}
                    onValueChange={(value) => setFormData({ ...formData, icon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="points">Pontos de Recompensa</Label>
                  <Input
                    id="points"
                    type="number"
                    min={0}
                    value={formData.points_reward}
                    onChange={(e) => setFormData({ ...formData, points_reward: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Critério</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.criteria_type}
                    onValueChange={(value) => setFormData({ ...formData, criteria_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="streak">Sequência (dias)</SelectItem>
                      <SelectItem value="chapters">Capítulos lidos</SelectItem>
                      <SelectItem value="points">Pontos totais</SelectItem>
                      <SelectItem value="plans">Planos completos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    min={1}
                    value={formData.criteria_value}
                    onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) || 1 })}
                    placeholder="Valor"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="active">Conquista ativa</Label>
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                {editingAchievement ? "Salvar Alterações" : "Criar Conquista"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : achievements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhuma conquista cadastrada</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getIconEmoji(achievement.icon)}</span>
                      <div>
                        <CardTitle className="text-base">{achievement.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          +{achievement.points_reward} pts
                        </p>
                      </div>
                    </div>
                    <Badge variant={achievement.is_active ? "default" : "secondary"}>
                      {achievement.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {achievement.description && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </p>
                  )}
                  <p className="text-xs text-primary mb-4">
                    Critério: {getCriteriaLabel(achievement.criteria as Record<string, unknown>)}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(achievement)}>
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleActive(achievement.id, achievement.is_active)}
                    >
                      {achievement.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(achievement.id)}
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
                  <TableHead>Conquista</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Critério</TableHead>
                  <TableHead>Pontos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.map((achievement) => (
                  <TableRow key={achievement.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getIconEmoji(achievement.icon)}</span>
                        <span className="font-medium">{achievement.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {achievement.description || "-"}
                    </TableCell>
                    <TableCell>
                      {getCriteriaLabel(achievement.criteria as Record<string, unknown>)}
                    </TableCell>
                    <TableCell>+{achievement.points_reward}</TableCell>
                    <TableCell>
                      <Switch
                        checked={achievement.is_active ?? false}
                        onCheckedChange={() => toggleActive(achievement.id, achievement.is_active)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(achievement)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(achievement.id)}
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

export default AdminAchievements;
