import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Camera, ChevronLeft, ChevronRight } from "lucide-react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import { useRecentPhotos } from "@/hooks/useRecentPhotos";
import { Skeleton } from "@/components/ui/skeleton";
import Autoplay from "embla-carousel-autoplay";

export function RecentPhotosCarousel() {
    const { photos, isLoading } = useRecentPhotos(12);
    const [currentIndex, setCurrentIndex] = useState(0);

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="w-full aspect-[16/9] rounded-xl" />
            </div>
        );
    }

    if (photos.length === 0) {
        return null;
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-display font-semibold text-text-primary">
                        Fotos Recentes
                    </h2>
                </div>
                <Link
                    to="/gallery"
                    className="text-sm text-primary hover:underline font-medium"
                >
                    Ver galeria →
                </Link>
            </div>

            {/* Carousel */}
            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                        stopOnInteraction: true,
                    }),
                ]}
                className="w-full"
            >
                <CarouselContent className="-ml-2">
                    {photos.map((photo) => (
                        <CarouselItem
                            key={photo.id}
                            className="pl-2 basis-2/3 sm:basis-1/2 md:basis-1/3"
                        >
                            <Link to={`/gallery/${photo.album_id}`}>
                                <div className="relative group overflow-hidden rounded-xl aspect-square">
                                    <img
                                        src={photo.thumbnail_url || photo.image_url}
                                        alt={photo.description || "Foto da galeria"}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    {/* Overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    {/* Album name on hover */}
                                    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                        <p className="text-white text-xs font-medium truncate">
                                            {photo.album_name}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    );
}
