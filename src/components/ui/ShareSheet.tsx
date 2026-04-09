import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Copy, Check, MoreHorizontal, MessageCircle } from "lucide-react";

interface ShareSheetProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  description?: string;
  shareText?: string;
}

export const ShareSheet = ({ isOpen, onClose, url, title, description, shareText }: ShareSheetProps) => {
  const [copied, setCopied] = useState(false);

  const shareWhatsApp = () => {
    const textToShare = shareText || `${title}\n${url}`;
    const text = encodeURIComponent(textToShare);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onClose();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText || url);
      setCopied(true);
      toast({ title: "Copiado!" });
      setTimeout(() => {
        setCopied(false);
        onClose();
      }, 1500);
    } catch {
      toast({ title: "Erro ao copiar", variant: "destructive" });
    }
  };

  const shareMore = async () => {
    try {
      await navigator.share({
        title: title,
        text: shareText || description || title,
        url: url
      });
      onClose();
    } catch {
      // User cancelled
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="pb-safe">
        <DrawerHeader className="text-center">
          <DrawerTitle>Compartilhar</DrawerTitle>
        </DrawerHeader>
        
        <div className="p-4 pb-8">
          <div className="flex justify-center gap-6">
            {/* WhatsApp */}
            <button
              onClick={shareWhatsApp}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center transition-transform group-hover:scale-110">
                <MessageCircle className="w-7 h-7 text-white" fill="white" />
              </div>
              <span className="text-xs text-muted-foreground">WhatsApp</span>
            </button>

            {/* Copy Link */}
            <button
              onClick={copyLink}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-110">
                {copied ? (
                  <Check className="w-6 h-6 text-green-500" />
                ) : (
                  <Copy className="w-6 h-6 text-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {copied ? "Copiado!" : "Copiar Link"}
              </span>
            </button>

            {/* More options */}
            {'share' in navigator && (
              <button
                onClick={shareMore}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center transition-transform group-hover:scale-110">
                  <MoreHorizontal className="w-6 h-6 text-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">Mais</span>
              </button>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full mt-6"
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
