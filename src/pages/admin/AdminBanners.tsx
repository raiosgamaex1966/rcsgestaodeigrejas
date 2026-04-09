import { useState } from "react";
import { useAllBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, Banner } from "@/hooks/useBanners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Image, Link, ExternalLink, MoveUp, MoveDown, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminBanners = () => {
  const { data: banners, isLoading } = useAllBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    link_type: "internal",
    background_color: "#EAB308",
    is_active: true,
    order_index: 0,
    start_date: "",
    end_date: "",
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      image_url: "",
      link_url: "",
      link_type: "internal",
      background_color: "#EAB308",
      is_active: true,
      order_index: 0,
      start_date: "",
      end_date: "",
    });
    setEditingBanner(null);
  };

  const openEditDialog = (banner: Banner) => {
    setEditingBanner(banner);
    setForm({
      title: banner.title,
      description: banner.description || "",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      link_type: banner.link_type || "internal",
      background_color: banner.background_color || "#EAB308",
      is_active: banner.is_active,
      order_index: banner.order_index,
      start_date: banner.start_date || "",
      end_date: banner.end_date || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerData = {
      ...form,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
    };

    if (editingBanner) {
      await updateBanner.mutateAsync({ id: editingBanner.id, ...bannerData });
    } else {
      await createBanner.mutateAsync(bannerData);
    }

    setDialogOpen(false);
    resetForm();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `banner-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("church-assets")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("church-assets")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: data.publicUrl });
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleOrderChange = async (banner: Banner, direction: "up" | "down") => {
    const currentIndex = banner.order_index;
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    const otherBanner = banners?.find((b) => b.order_index === newIndex);
    if (!otherBanner) return;

    await updateBanner.mutateAsync({ id: banner.id, order_index: newIndex });
    await updateBanner.mutateAsync({ id: otherBanner.id, order_index: currentIndex });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground">Gerencie os banners do carousel da tela inicial</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
              <DialogDescription>
                {editingBanner ? "Atualize as informações do banner" : "Preencha os dados para criar um novo banner"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Bem-vindo à nossa igreja"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descrição curta do banner"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Imagem do Banner</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-muted-foreground">Enviando...</span>}
                </div>
                {form.image_url && (
                  <div className="mt-2">
                    <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="background_color">Cor de Fundo (se não tiver imagem)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="color"
                    id="background_color"
                    value={form.background_color}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={form.background_color}
                    onChange={(e) => setForm({ ...form, background_color: e.target.value })}
                    placeholder="#EAB308"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="link_type">Tipo de Link</Label>
                  <Select value={form.link_type} onValueChange={(v) => setForm({ ...form, link_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Interno (App)</SelectItem>
                      <SelectItem value="external">Externo (URL)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_url">URL do Link</Label>
                  <Input
                    id="link_url"
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    placeholder={form.link_type === "internal" ? "/eventos" : "https://..."}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Início (opcional)</Label>
                  <Input
                    type="date"
                    id="start_date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Fim (opcional)</Label>
                  <Input
                    type="date"
                    id="end_date"
                    value={form.end_date}
                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
                <Label htmlFor="is_active">Banner ativo</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createBanner.isPending || updateBanner.isPending}>
                  {editingBanner ? "Salvar Alterações" : "Criar Banner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {banners && banners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum banner cadastrado</h3>
            <p className="text-muted-foreground mb-4">Crie seu primeiro banner para exibir no carousel da tela inicial</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {banners?.map((banner, index) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div
                  className="w-full md:w-48 h-32 flex items-center justify-center text-white font-medium"
                  style={{
                    backgroundColor: banner.image_url ? undefined : banner.background_color,
                    backgroundImage: banner.image_url ? `url(${banner.image_url})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {!banner.image_url && <span className="text-sm opacity-75">Sem imagem</span>}
                </div>

                {/* Info */}
                <CardContent className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{banner.title}</h3>
                        {!banner.is_active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inativo</span>
                        )}
                      </div>
                      {banner.description && (
                        <p className="text-sm text-muted-foreground mb-2">{banner.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {banner.link_url && (
                          <span className="flex items-center gap-1">
                            {banner.link_type === "external" ? <ExternalLink className="w-3 h-3" /> : <Link className="w-3 h-3" />}
                            {banner.link_url}
                          </span>
                        )}
                        {banner.start_date && (
                          <span>Início: {format(new Date(banner.start_date), "dd/MM/yyyy")}</span>
                        )}
                        {banner.end_date && (
                          <span>Fim: {format(new Date(banner.end_date), "dd/MM/yyyy")}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOrderChange(banner, "up")}
                        disabled={index === 0}
                      >
                        <MoveUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOrderChange(banner, "down")}
                        disabled={index === (banners?.length || 0) - 1}
                      >
                        <MoveDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateBanner.mutate({ id: banner.id, is_active: !banner.is_active })}
                      >
                        {banner.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(banner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir banner?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. O banner "{banner.title}" será removido permanentemente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBanner.mutate(banner.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
