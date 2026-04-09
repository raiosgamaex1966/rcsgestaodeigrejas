import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Book, Headphones, Calendar, BookOpen, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  type: "sermon" | "event" | "plan" | "bible";
  id: string;
  title: string;
  subtitle?: string;
  link: string;
}

export const SearchModal = ({ open, onOpenChange }: SearchModalProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  const quickLinks = [
    { icon: Book, label: "Bíblia", path: "/bible" },
    { icon: Headphones, label: "Ministrações", path: "/sermons" },
    { icon: Calendar, label: "Eventos", path: "/events" },
    { icon: BookOpen, label: "Planos", path: "/plans" },
  ];

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search sermons
        const { data: sermons } = await supabase
          .from("sermons")
          .select("id, title, description")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (sermons) {
          searchResults.push(
            ...sermons.map((s) => ({
              type: "sermon" as const,
              id: s.id,
              title: s.title,
              subtitle: s.description?.substring(0, 50) || "Ministração",
              link: `/sermons/${s.id}`,
            }))
          );
        }

        // Search events
        const { data: events } = await supabase
          .from("events")
          .select("id, title, description")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (events) {
          searchResults.push(
            ...events.map((e) => ({
              type: "event" as const,
              id: e.id,
              title: e.title,
              subtitle: e.description?.substring(0, 50) || "Evento",
              link: "/events",
            }))
          );
        }

        // Search reading plans
        const { data: plans } = await supabase
          .from("reading_plans")
          .select("id, title, description")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
          .limit(5);

        if (plans) {
          searchResults.push(
            ...plans.map((p) => ({
              type: "plan" as const,
              id: p.id,
              title: p.title,
              subtitle: p.description?.substring(0, 50) || "Plano de Leitura",
              link: `/plans/${p.id}`,
            }))
          );
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleResultClick = (link: string) => {
    navigate(link);
    onOpenChange(false);
    setQuery("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "sermon":
        return <Headphones className="w-4 h-4 text-primary" />;
      case "event":
        return <Calendar className="w-4 h-4 text-accent" />;
      case "plan":
        return <BookOpen className="w-4 h-4 text-gold" />;
      case "bible":
        return <Book className="w-4 h-4 text-burgundy" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="sr-only">Buscar</DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar ministrações, eventos, planos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
              autoFocus
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="px-4 pb-4">
            {!query.trim() ? (
              <>
                <p className="text-xs text-muted-foreground mb-3 mt-2">
                  Acesso rápido
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {quickLinks.map((link) => (
                    <button
                      key={link.path}
                      onClick={() => handleResultClick(link.path)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <link.icon className="w-5 h-5 text-foreground" />
                      <span className="text-xs font-medium">{link.label}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : isSearching ? (
              <div className="py-8 text-center text-muted-foreground">
                Buscando...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1 mt-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result.link)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      {getIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {result.subtitle}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum resultado encontrado
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
