import { useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Upload, Trash2, Loader2, ImageIcon, Users, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { PhotoGrid } from "@/components/gallery/PhotoGrid";
import { usePhotoAlbum } from "@/hooks/usePhotoAlbums";
import { usePhotos } from "@/hooks/usePhotos";
import { supabase } from "@/integrations/supabase/client";
import { compressToWebP } from "@/utils/imageOptimizer";
import { extractFaceDescriptors } from "@/utils/faceRecognition";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const AdminPhotoAlbumDetail = () => {
  const { albumId } = useParams();
  const { data: album, isLoading: albumLoading } = usePhotoAlbum(albumId);
  const {
    photos,
    isLoading: photosLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    uploadPhoto,
    deletePhotos,
    updateFaceDescriptors,
  } = usePhotos(albumId);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessingFaces, setIsProcessingFaces] = useState(false);
  const [faceProgress, setFaceProgress] = useState(0);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !albumId) return;

    setIsUploading(true);
    setUploadProgress(0);

    let uploaded = 0;
    const total = files.length;

    for (const file of files) {
      try {
        // Compress main image
        const compressed = await compressToWebP(file);
        const mainBlob = compressed.blob;
        
        // Compress thumbnail
        const thumbnailCanvas = document.createElement("canvas");
        const img = await createImageBitmap(file);
        const maxThumbSize = 400;
        const scale = Math.min(maxThumbSize / img.width, maxThumbSize / img.height, 1);
        thumbnailCanvas.width = img.width * scale;
        thumbnailCanvas.height = img.height * scale;
        const ctx = thumbnailCanvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, thumbnailCanvas.width, thumbnailCanvas.height);
        const thumbnailBlob = await new Promise<Blob>((resolve) => {
          thumbnailCanvas.toBlob((blob) => resolve(blob!), "image/webp", 0.8);
        });

        // Upload main image
        const mainFileName = `${albumId}/${crypto.randomUUID()}.webp`;
        const { error: mainError } = await supabase.storage
          .from("photo-albums")
          .upload(mainFileName, mainBlob, { contentType: "image/webp" });
        if (mainError) throw mainError;

        // Upload thumbnail
        const thumbFileName = `${albumId}/thumb_${crypto.randomUUID()}.webp`;
        const { error: thumbError } = await supabase.storage
          .from("photo-albums")
          .upload(thumbFileName, thumbnailBlob, { contentType: "image/webp" });
        if (thumbError) throw thumbError;

        // Get URLs
        const { data: mainData } = supabase.storage.from("photo-albums").getPublicUrl(mainFileName);
        const { data: thumbData } = supabase.storage.from("photo-albums").getPublicUrl(thumbFileName);

        // Save to database
        await uploadPhoto.mutateAsync({
          albumId,
          imageUrl: mainData.publicUrl,
          thumbnailUrl: thumbData.publicUrl,
        });

        uploaded++;
        setUploadProgress((uploaded / total) * 100);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Erro ao enviar ${file.name}`);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    toast.success(`${uploaded} foto${uploaded > 1 ? "s" : ""} enviada${uploaded > 1 ? "s" : ""} com sucesso!`);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [albumId, uploadPhoto]);

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    await deletePhotos.mutateAsync(Array.from(selectedIds));
    setSelectedIds(new Set());
    setDeleteDialogOpen(false);
  };

  const processAllFaces = async () => {
    const photosToProcess = photos.filter((p) => p.faces_count === 0);
    if (photosToProcess.length === 0) {
      toast.info("Todas as fotos já foram processadas");
      return;
    }

    setIsProcessingFaces(true);
    setFaceProgress(0);

    let processed = 0;
    const total = photosToProcess.length;

    for (const photo of photosToProcess) {
      try {
        const descriptors = await extractFaceDescriptors(photo.image_url);
        await updateFaceDescriptors.mutateAsync({
          photoId: photo.id,
          descriptors,
          facesCount: descriptors.length,
        });
        processed++;
        setFaceProgress((processed / total) * 100);
      } catch (error) {
        console.error("Error processing faces for photo:", photo.id, error);
      }
    }

    setIsProcessingFaces(false);
    setFaceProgress(0);
    toast.success(`${processed} foto${processed > 1 ? "s" : ""} processada${processed > 1 ? "s" : ""}!`);
  };

  const photosWithFaces = photos.filter((p) => p.faces_count > 0).length;
  const photosWithoutFaces = photos.filter((p) => p.faces_count === 0).length;

  if (albumLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-medium text-foreground mb-2">Álbum não encontrado</h2>
        <Button asChild>
          <Link to="/admin/photos">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/photos">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">{album.name}</h1>
            <p className="text-muted-foreground">{album.photos_count} fotos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Face processing button */}
          {photosWithoutFaces > 0 && (
            <Button
              variant="outline"
              onClick={processAllFaces}
              disabled={isProcessingFaces}
            >
              {isProcessingFaces ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 mr-2" />
              )}
              Processar rostos ({photosWithoutFaces})
            </Button>
          )}

          {/* Delete selected */}
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir ({selectedIds.size})
            </Button>
          )}

          {/* Upload button */}
          <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Enviar Fotos
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* Progress bars */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Enviando fotos...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {isProcessingFaces && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processando rostos...</span>
            <span>{Math.round(faceProgress)}%</span>
          </div>
          <Progress value={faceProgress} />
        </div>
      )}

      {/* Stats */}
      {photos.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            {photos.length} fotos
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {photosWithFaces} com rostos detectados
          </span>
          {selectedIds.size > 0 && (
            <span className="text-primary font-medium">
              {selectedIds.size} selecionada{selectedIds.size > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {photosLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
          {[...Array(12)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Nenhuma foto ainda</h3>
          <p className="text-muted-foreground mb-4">
            Envie as fotos do evento para começar
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2" />
            Enviar Fotos
          </Button>
        </div>
      ) : (
        <PhotoGrid
          photos={photos}
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fotos?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. {selectedIds.size} foto{selectedIds.size > 1 ? "s" : ""} será{selectedIds.size > 1 ? "ão" : ""} permanentemente excluída{selectedIds.size > 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
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

export default AdminPhotoAlbumDetail;
