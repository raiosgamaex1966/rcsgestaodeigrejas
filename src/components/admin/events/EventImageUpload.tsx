import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressToWebP } from "@/utils/imageOptimizer";

interface EventImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const EventImageUpload = ({ value, onChange }: EventImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Compress image to WebP (90% quality)
      const { blob: compressedBlob, extension, mimeType } = await compressToWebP(file);
      
      // Generate unique filename
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("event-images")
        .upload(fileName, compressedBlob, {
          contentType: mimeType,
          cacheControl: "3600",
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("event-images")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast.success("Imagem enviada com sucesso!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Erro ao enviar imagem: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (value) {
      // Extract filename from URL to delete from storage
      try {
        const url = new URL(value);
        const pathParts = url.pathname.split("/");
        const fileName = pathParts[pathParts.length - 1];
        
        await supabase.storage.from("event-images").remove([fileName]);
      } catch (error) {
        console.error("Error removing old image:", error);
      }
    }
    onChange(null);
  };

  if (value) {
    return (
      <div className="space-y-2">
        <Label>Imagem do Evento</Label>
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={value}
            alt="Preview"
            className="w-full h-40 object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Imagem do Evento</Label>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
          ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:border-primary/50"}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
        />
        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Enviando imagem...</p>
            </>
          ) : (
            <>
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  Clique para selecionar ou arraste uma imagem
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG ou WEBP • Máx. 5MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
