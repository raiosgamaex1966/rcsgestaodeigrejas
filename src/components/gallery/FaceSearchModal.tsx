import { useState, useRef } from "react";
import { Camera, Upload, Loader2, Search, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { extractSingleFaceDescriptor, findMatchingFaces, loadFaceModels } from "@/utils/faceRecognition";
import type { Photo } from "@/hooks/usePhotos";

interface FaceSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  onResults: (matchingPhotos: Photo[]) => void;
}

type SearchState = "idle" | "loading-models" | "processing" | "done" | "error";

export const FaceSearchModal = ({ isOpen, onClose, photos, onResults }: FaceSearchModalProps) => {
  const [state, setState] = useState<SearchState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [matchCount, setMatchCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleReset = () => {
    setState("idle");
    setPreviewUrl(null);
    setMatchCount(0);
    setError(null);
    setShowCamera(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processImage = async (imageUrl: string) => {
    try {
      setState("loading-models");
      await loadFaceModels();

      setState("processing");
      const selfieDescriptor = await extractSingleFaceDescriptor(imageUrl);
      
      if (!selfieDescriptor) {
        setError("Nenhum rosto detectado na imagem. Tente outra foto.");
        setState("error");
        return;
      }

      // Find matching photos
      const matches: Photo[] = [];
      for (const photo of photos) {
        if (photo.face_descriptors && Array.isArray(photo.face_descriptors)) {
          const hasMatch = findMatchingFaces(
            selfieDescriptor,
            photo.face_descriptors as number[][],
            0.6
          );
          if (hasMatch) {
            matches.push(photo);
          }
        }
      }

      setMatchCount(matches.length);
      setState("done");

      if (matches.length > 0) {
        onResults(matches);
        toast.success(`${matches.length} foto${matches.length > 1 ? 's' : ''} encontrada${matches.length > 1 ? 's' : ''}!`);
      } else {
        toast.info("Nenhuma foto encontrada com seu rosto");
      }
    } catch (err) {
      console.error("Face search error:", err);
      setError("Erro ao processar a imagem. Tente novamente.");
      setState("error");
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await processImage(url);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      toast.error("Não foi possível acessar a câmera");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.9);
    
    // Stop camera
    streamRef.current?.getTracks().forEach(track => track.stop());
    setShowCamera(false);
    
    setPreviewUrl(url);
    processImage(url);
  };

  const photosWithFaces = photos.filter(p => p.faces_count > 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Encontrar minhas fotos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {photosWithFaces.length === 0 ? (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                As fotos deste álbum ainda não foram processadas para reconhecimento facial.
              </p>
            </div>
          ) : state === "idle" && !showCamera ? (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Tire uma selfie ou escolha uma foto para encontrar todas as fotos com você neste álbum.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button 
                  onClick={startCamera}
                  className="w-full"
                  variant="outline"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Usar câmera
                </Button>
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Escolher foto
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {photosWithFaces.length} de {photos.length} fotos podem ser pesquisadas
              </p>
            </>
          ) : showCamera ? (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={capturePhoto} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Tirar foto
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {previewUrl && (
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted max-w-[200px] mx-auto">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {(state === "loading-models" || state === "processing") && (
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    {state === "loading-models" 
                      ? "Carregando modelos de reconhecimento..." 
                      : "Procurando seu rosto nas fotos..."}
                  </p>
                </div>
              )}

              {state === "done" && (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Search className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium">
                    {matchCount > 0 
                      ? `${matchCount} foto${matchCount > 1 ? 's' : ''} encontrada${matchCount > 1 ? 's' : ''}!`
                      : "Nenhuma foto encontrada"}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                      Nova busca
                    </Button>
                    {matchCount > 0 && (
                      <Button onClick={handleClose} className="flex-1">
                        Ver fotos
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {state === "error" && (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="text-sm text-destructive">{error}</p>
                  <Button variant="outline" onClick={handleReset}>
                    Tentar novamente
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
