import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Image, Calendar, Eye, EyeOff, Trash2, Edit, MoreHorizontal, ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePhotoAlbums, PhotoAlbum } from "@/hooks/usePhotoAlbums";
import { EventImageUpload } from "@/components/admin/events/EventImageUpload";
import { cn } from "@/lib/utils";

const AdminPhotoAlbums = () => {
  const { albums, isLoading, createAlbum, updateAlbum, deleteAlbum, togglePublish } = usePhotoAlbums();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PhotoAlbum | null>(null);
  const [albumToDelete, setAlbumToDelete] = useState<PhotoAlbum | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    event_date: "",
    cover_url: null as string | null,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      event_date: "",
      cover_url: null,
    });
    setEditingAlbum(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (album: PhotoAlbum) => {
    setEditingAlbum(album);
    setFormData({
      name: album.name,
      description: album.description || "",
      event_date: album.event_date || "",
      cover_url: album.cover_url,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAlbum) {
      await updateAlbum.mutateAsync({
        id: editingAlbum.id,
        ...formData,
        event_date: formData.event_date || null,
      });
    } else {
      await createAlbum.mutateAsync({
        ...formData,
        event_date: formData.event_date || null,
      });
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (albumToDelete) {
      await deleteAlbum.mutateAsync(albumToDelete.id);
      setDeleteDialogOpen(false);
      setAlbumToDelete(null);
    }
  };

  const confirmDelete = (album: PhotoAlbum) => {
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Galeria de Fotos</h1>
          <p className="text-muted-foreground">Gerencie os álbuns de fotos dos cultos e eventos</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Álbum
        </Button>
      </div>

      {/* Albums Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-border">
              <Skeleton className="aspect-[4/3]" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : albums.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhum álbum criado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro álbum para começar a organizar as fotos
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Álbum
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {albums.map((album) => (
            <div
              key={album.id}
              className={cn(
                "group relative overflow-hidden rounded-xl bg-card border border-border transition-all",
                "hover:shadow-md hover:border-primary/30"
              )}
            >
              {/* Cover */}
              <Link to={`/admin/photos/${album.id}`} className="block">
                <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                  {album.cover_url ? (
                    <img
                      src={album.cover_url}
                      alt={album.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-3 left-3">
                    <Badge variant={album.is_published ? "default" : "secondary"}>
                      {album.is_published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>

                  {/* Photo count */}
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {album.photos_count}
                  </div>
                </div>
              </Link>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link to={`/admin/photos/${album.id}`}>
                      <h3 className="font-medium text-foreground line-clamp-1 hover:text-primary transition-colors">
                        {album.name}
                      </h3>
                    </Link>
                    {album.event_date && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(album.event_date), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(album)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => togglePublish.mutate({ id: album.id, is_published: !album.is_published })}
                      >
                        {album.is_published ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Despublicar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publicar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => confirmDelete(album)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingAlbum ? "Editar Álbum" : "Novo Álbum"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do álbum *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Culto de Domingo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do álbum..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_date">Data do evento</Label>
              <Input
                id="event_date"
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Capa do álbum</Label>
              <EventImageUpload
                value={formData.cover_url}
                onChange={(url) => setFormData({ ...formData, cover_url: url })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createAlbum.isPending || updateAlbum.isPending}
              >
                {(createAlbum.isPending || updateAlbum.isPending) ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir álbum?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O álbum "{albumToDelete?.name}" e todas as suas fotos serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPhotoAlbums;
