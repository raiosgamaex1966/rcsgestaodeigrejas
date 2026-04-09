import React, { useState } from 'react';
import { Share2, Heart, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface VerseCardProps {
    verse: string;
    reference: string;
    theme: string;
}

export function VerseCard({ verse, reference, theme }: VerseCardProps) {
    const [isFavorited, setIsFavorited] = useState(false);

    const handleShare = async () => {
        const textToShare = `"${verse}"\n— ${reference}\n\nVersículo do dia • ${window.location.origin}/app`;

        try {
            await navigator.clipboard.writeText(textToShare);
            toast.success("Link copiado!", {
                description: "Cole no WhatsApp ou onde desejar para compartilhar.",
                icon: <Check className="w-4 h-4" />,
            });
        } catch {
            toast.error("Não foi possível copiar");
        }
    };

    const handleFavorite = () => {
        setIsFavorited(!isFavorited);
        toast.success(isFavorited ? "Removido dos favoritos" : "Adicionado aos favoritos");
    };

    return (
        <Card className="p-6 md:p-8 relative overflow-hidden bg-card border-border shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            {/* Gradiente sutil no fundo */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent dark:from-white/5" />

            <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">📖</span>
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Versículo do Dia
                    </span>
                    <span className="ml-auto px-3 py-1 bg-black/5 dark:bg-white/10 text-foreground text-xs font-medium rounded-full">
                        {theme}
                    </span>
                </div>

                <blockquote className="font-display text-xl md:text-2xl lg:text-3xl text-foreground leading-relaxed italic drop-shadow-sm">
                    "{verse}"
                </blockquote>

                <div className="mt-6 flex items-center justify-between">
                    <cite className="text-sm font-semibold text-muted-foreground not-italic">
                        — {reference}
                    </cite>
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                            title="Copiar para compartilhar"
                        >
                            <Share2 className="w-5 h-5 text-muted-foreground dark:text-foreground/70" />
                        </button>
                        <button
                            onClick={handleFavorite}
                            className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
                            title="Favoritar"
                        >
                            <Heart className={`w-5 h-5 ${isFavorited ? "fill-red-500 text-red-500" : "text-muted-foreground dark:text-foreground/70"}`} />
                        </button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
