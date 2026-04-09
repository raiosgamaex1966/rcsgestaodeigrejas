import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePreachers } from "@/hooks/useSermons";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2, User } from "lucide-react";

const AdminPreachers = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    is_active: true,
  });

  const { data: preachers = [], isLoading } = usePreachers();
  const queryClient = useQueryClient();

  const resetForm = () => {
    setFormData({ name: "", title: "", bio: "", is_active: true });
    setEditingId(null);
  };

  const handleEdit = (preacher: any) => {
    setFormData({
      name: preacher.name,
      title: preacher.title || "",
      bio: preacher.bio || "",
      is_active: preacher.is_active,
    });
    setEditingId(preacher.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      name: formData.name,
      title: formData.title || null,
      bio: formData.bio || null,
      is_active: formData.is_active,
    };

    try {
      if (editingId) {
        const { error } = await supabase.from("preachers").update(data).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Pregador atualizado!" });
      } else {
        const { error } = await supabase.from("preachers").insert(data);
        if (error) throw error;
        toast({ title: "Pregador criado!" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["preachers"] });
      setIsOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este pregador?")) return;
    
    try {
      const { error } = await supabase.from("preachers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pregador excluído!" });
      queryClient.invalidateQueries({ queryKey: ["preachers"] });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Pregadores</h1>
          <p className="text-muted-foreground">Gerencie os pregadores da igreja</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button variant="gold">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pregador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Pregador" : "Novo Pregador"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Pastor, Pr., Ev., Apóstolo..."
                />
              </div>

              <div className="space-y-2">
                <Label>Biografia</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Breve biografia..."
                  rows={3}
                />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : preachers.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum pregador cadastrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {preachers.map((preacher) => (
            <Card key={preacher.id} variant="elevated" className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{preacher.name}</h3>
                  {preacher.title && (
                    <p className="text-sm text-muted-foreground">{preacher.title}</p>
                  )}
                </div>
              </div>
              
              {preacher.bio && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{preacher.bio}</p>
              )}
              
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(preacher)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(preacher.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPreachers;
