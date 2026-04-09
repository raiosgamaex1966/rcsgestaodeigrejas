import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useThemes } from "@/hooks/useSermons";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, Palette } from "lucide-react";

const AdminThemes = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6366f1",
    is_active: true,
  });

  const { data: themes = [], isLoading } = useThemes();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#6366f1", is_active: true });
    setEditingId(null);
  };

  const handleEdit = (theme: any) => {
    setFormData({
      name: theme.name,
      description: theme.description || "",
      color: theme.color || "#6366f1",
      is_active: theme.is_active,
    });
    setEditingId(theme.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name: formData.name,
      description: formData.description || null,
      color: formData.color,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("themes").update(data).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Tema atualizado!" });
      } else {
        const { error } = await supabase.from("themes").insert(data);
        if (error) throw error;
        toast({ title: "Tema criado!" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este tema?")) return;
    
    try {
      const { error } = await supabase.from("themes").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Tema excluído!" });
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Temas</h1>
          <p className="text-muted-foreground">Gerencie os temas das ministrações</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Tema
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Tema" : "Novo Tema"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Fé, Esperança, Amor..."
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Breve descrição do tema"
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-14 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Ativo</span>
              </label>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
      ) : themes.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum tema cadastrado</p>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className="group flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card hover:shadow-md transition-all"
            >
              <div 
                className="w-4 h-4 rounded-full shrink-0"
                style={{ backgroundColor: theme.color }}
              />
              <span className="font-medium text-foreground">{theme.name}</span>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button
                  onClick={() => handleEdit(theme)}
                  className="p-1 hover:bg-secondary rounded"
                >
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(theme.id)}
                  className="p-1 hover:bg-secondary rounded"
                >
                  <Trash2 className="w-3 h-3 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminThemes;
