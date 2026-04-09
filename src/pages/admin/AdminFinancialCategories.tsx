import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialCategories } from "@/hooks/useFinancialCategories";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import { Link } from "react-router-dom";

const iconOptions = [
  "CircleDollarSign", "Heart", "Church", "Gift", "Coins", "HandCoins",
  "Wallet", "CreditCard", "Receipt", "Building2", "Lightbulb", "Droplets",
  "Flame", "Wrench", "Users", "Music", "BookOpen", "Car", "Printer", "Coffee"
];

const colorOptions = [
  "#10b981", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6",
  "#06b6d4", "#84cc16", "#ef4444", "#3b82f6", "#14b8a6"
];

export default function AdminFinancialCategories() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [formData, setFormData] = useState({
    name: "",
    type: "income",
    description: "",
    icon: "CircleDollarSign",
    color: "#6366f1",
    is_default: false,
  });

  const { categories, incomeCategories, expenseCategories, isLoading, createCategory, updateCategory, deleteCategory } = useFinancialCategories();

  const resetForm = () => {
    setFormData({
      name: "",
      type: activeTab,
      description: "",
      icon: "CircleDollarSign",
      color: "#6366f1",
      is_default: false,
    });
    setEditingId(null);
  };

  const handleEdit = (category: any) => {
    setFormData({
      name: category.name,
      type: category.type,
      description: category.description || "",
      icon: category.icon || "CircleDollarSign",
      color: category.color || "#6366f1",
      is_default: category.is_default || false,
    });
    setEditingId(category.id);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      type: formData.type,
      description: formData.description || null,
      icon: formData.icon,
      color: formData.color,
      is_default: formData.is_default,
    };

    if (editingId) {
      await updateCategory.mutateAsync({ id: editingId, ...data });
    } else {
      await createCategory.mutateAsync(data);
    }

    setIsOpen(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria?")) return;
    await deleteCategory.mutateAsync(id);
  };

  const openNewCategory = (type: "income" | "expense") => {
    setFormData({ ...formData, type });
    setIsOpen(true);
  };

  const renderCategoryList = (categoryList: typeof categories) => {
    if (!categoryList || categoryList.length === 0) {
      return (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
        </Card>
      );
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryList.map((category) => (
          <Card key={category.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="p-2.5 rounded-lg"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <CircleDollarSign className="h-5 w-5" style={{ color: category.color || '#6366f1' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{category.name}</h3>
                    {category.is_default && (
                      <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                        Padrão
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(category.id)}
                  disabled={deleteCategory.isPending || category.is_default}
                >
                  <Trash2 className={`h-4 w-4 ${category.is_default ? 'text-muted' : 'text-destructive'}`} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/financial">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Categorias Financeiras</h1>
            <p className="text-muted-foreground">
              Gerencie as categorias de receitas e despesas
            </p>
          </div>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Dízimos, Aluguel, Água"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Receita
                      </div>
                    </SelectItem>
                    <SelectItem value="expense">
                      <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        Despesa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        formData.color === color ? 'scale-110 border-foreground' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_default" className="cursor-pointer">
                  Categoria padrão
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingId ? "Salvar" : "Criar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "income" | "expense")}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Receitas ({incomeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Despesas ({expenseCategories.length})
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => openNewCategory(activeTab)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Categoria
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="income" className="mt-0">
              {renderCategoryList(incomeCategories)}
            </TabsContent>
            <TabsContent value="expense" className="mt-0">
              {renderCategoryList(expenseCategories)}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
