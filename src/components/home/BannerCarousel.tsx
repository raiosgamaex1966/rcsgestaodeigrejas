import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronRight, Calendar, Heart, Sparkles, ExternalLink } from "lucide-react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useEvents } from "@/hooks/useEvents";
import { useBanners } from "@/hooks/useBanners";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BannerItem {
  id: string;
  type: "banner" | "campaign" | "event";
  title: string;
  description?: string | null;
  progress?: number;
  currentAmount?: number;
  goalAmount?: number;
  date?: string;
  link: string;
  linkType?: string;
  imageUrl?: string | null;
  backgroundColor?: string;
}

export const BannerCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const { data: banners, isLoading: bannersLoading } = useBanners();
  const { data: campaigns, isLoading: campaignsLoading } = useCampaigns();
  const { data: events, isLoading: eventsLoading } = useEvents();

  const isLoading = bannersLoading || campaignsLoading || eventsLoading;

  // Build banner items - prioritize registered banners
  const bannerItems: BannerItem[] = [];

  // First: Add registered banners
  banners?.forEach((banner) => {
    bannerItems.push({
      id: banner.id,
      type: "banner",
      title: banner.title,
      description: banner.description,
      link: banner.link_url || "/",
      linkType: banner.link_type,
      imageUrl: banner.image_url,
      backgroundColor: banner.background_color,
    });
  });

  // Second: Add active campaigns (if no banners)
  if (bannerItems.length === 0) {
    const activeCampaigns = campaigns?.filter((c) => c.is_active) || [];
    activeCampaigns.forEach((campaign) => {
      const progress =
        campaign.goal_amount > 0
          ? Math.min(100, ((campaign.current_amount || 0) / campaign.goal_amount) * 100)
          : 0;
      bannerItems.push({
        id: campaign.id,
        type: "campaign",
        title: campaign.title,
        description: campaign.description,
        progress,
        currentAmount: campaign.current_amount || 0,
        goalAmount: campaign.goal_amount,
        link: "/offerings",
      });
    });
  }

  // Third: Add upcoming featured events (if still empty)
  if (bannerItems.length === 0) {
    const upcomingEvents = events
      ?.filter((e) => e.is_featured && new Date(e.start_date) >= new Date())
      .slice(0, 2) || [];
    upcomingEvents.forEach((event) => {
      bannerItems.push({
        id: event.id,
        type: "event",
        title: event.title,
        description: event.description,
        date: event.start_date,
        link: "/events",
      });
    });
  }

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi || bannerItems.length <= 1) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi, bannerItems.length]);

  if (isLoading) {
    return (
      <div className="rounded-2xl bg-muted/50 h-40 animate-pulse" />
    );
  }

  // If no banners at all, don't render carousel
  if (bannerItems.length === 0) {
    return null;
  }

  const handleBannerClick = (item: BannerItem) => {
    if (!item.link) return;

    if (item.linkType === "external") {
      window.open(item.link, "_blank");
    } else {
      navigate(item.link);
    }
  };

  const renderBanner = (item: BannerItem) => {
    if (item.type === "banner") {
      const hasImage = !!item.imageUrl;

      return (
        <div
          onClick={() => handleBannerClick(item)}
          className="cursor-pointer group"
        >
          <div
            className="relative overflow-hidden rounded-[2rem] p-8 text-white h-48 flex flex-col justify-end transition-all duration-700 shadow-soft group-hover:shadow-card"
            style={{
              backgroundColor: hasImage ? undefined : item.backgroundColor || "var(--primary)",
              backgroundImage: hasImage ? `url(${item.imageUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Soft Organic Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent opacity-80" />

            <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
              <h3 className="text-2xl md:text-3xl font-serif font-black mb-2 leading-tight drop-shadow-xl">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm md:text-base opacity-90 line-clamp-2 font-medium tracking-tight max-w-[80%]">
                  {item.description}
                </p>
              )}
              {item.link && (
                <div className="flex items-center gap-2 mt-4 text-xs font-black uppercase tracking-widest text-accent drop-shadow-sm">
                  <span>Explorar Agora</span>
                  <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-500">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              )}
            </div>

            {/* Decorative Element */}
            <div className="absolute top-4 right-4 w-12 h-12 border-2 border-white/10 rounded-full flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      );
    }

    if (item.type === "campaign") {
      return (
        <Link to={item.link}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-5 text-primary-foreground h-40">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-accent/20 blur-xl" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-gold/10 blur-lg" />

            <div className="relative z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-accent/20 text-accent rounded-full mb-2">
                <Heart className="w-3 h-3" />
                Campanha
              </span>
              <h3 className="text-lg font-serif font-bold mb-1 line-clamp-1">
                {item.title}
              </h3>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>R$ {(item.currentAmount || 0).toLocaleString("pt-BR")}</span>
                  <span>R$ {(item.goalAmount || 0).toLocaleString("pt-BR")}</span>
                </div>
                <div className="h-1.5 bg-primary-foreground/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="gap-1 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-0"
              >
                Contribuir
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Link>
      );
    }

    // Event banner
    return (
      <Link to={item.link}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/90 to-accent/80 p-5 text-accent-foreground h-40">
          <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-primary/20 blur-xl" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary-foreground rounded-full mb-2">
              <Calendar className="w-3 h-3" />
              Evento
            </span>
            <h3 className="text-lg font-serif font-bold mb-1 line-clamp-1">
              {item.title}
            </h3>
            <p className="text-sm opacity-80 mb-2 line-clamp-1">
              {item.description}
            </p>
            {item.date && (
              <p className="text-sm font-medium">
                {format(new Date(item.date), "d 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {bannerItems.map((item) => (
            <div key={item.id} className="flex-[0_0_100%] min-w-0">
              {renderBanner(item)}
            </div>
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      {bannerItems.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {bannerItems.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                selectedIndex === index ? "bg-primary w-4" : "bg-muted-foreground/30"
              )}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
