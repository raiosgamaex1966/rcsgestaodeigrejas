import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bibleBooks } from "@/data/bible";
import { Search, BookOpen, ChevronRight, Bookmark, Highlighter, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { VersionSelector } from "@/components/bible/VersionSelector";
import { useBible } from "@/hooks/useBible";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const tabs = [
  { id: "books", label: "Livros", icon: BookOpen },
  { id: "favorites", label: "Favoritos", icon: Bookmark },
  { id: "highlights", label: "Grifados", icon: Highlighter },
  { id: "notes", label: "Anotações", icon: MessageSquare },
];

const HIGHLIGHT_COLORS = [
  { color: "#FEF08A", name: "Amarelo" },
  { color: "#93C5FD", name: "Azul" },
  { color: "#86EFAC", name: "Verde" },
  { color: "#FDBA74", name: "Laranja" },
  { color: "#F9A8D4", name: "Rosa" },
];

const Bible = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, getTenantPath } = useAuth();
  const {
    favorites,
    allHighlights,
    allNotes,
    fetchFavorites,
    fetchAllHighlights,
    fetchAllNotes,
    removeFavorite,
    removeHighlight,
    removeNote,
  } = useBible();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    return tab && ["books", "favorites", "highlights", "notes"].includes(tab) ? tab : "books";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTestament, setSelectedTestament] = useState<"old" | "new">("old");
  const [loadingData, setLoadingData] = useState(false);
  const [colorFilter, setColorFilter] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        setLoadingData(true);
        await Promise.all([fetchFavorites(), fetchAllHighlights(), fetchAllNotes()]);
        setLoadingData(false);
      }
    };
    loadData();
  }, [user, fetchFavorites, fetchAllHighlights, fetchAllNotes]);

  const getBookName = (abbrev: string) => {
    const book = bibleBooks.find(b => b.abbrev === abbrev || b.name === abbrev);
    return book?.name || abbrev;
  };

  const getBookAbbrev = (name: string) => {
    const book = bibleBooks.find(b => b.name === name || b.abbrev === name);
    return book?.abbrev || name;
  };

  const filteredBooks = bibleBooks.filter(book =>
    book.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const oldTestament = filteredBooks.filter(book => book.testament === "old");
  const newTestament = filteredBooks.filter(book => book.testament === "new");

  const displayBooks = selectedTestament === "old" ? oldTestament : newTestament;

  const filteredHighlights = colorFilter
    ? allHighlights.filter(h => h.color === colorFilter)
    : allHighlights;

  return (
    <div className="max-w-lg mx-auto pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-serif font-bold text-foreground">
              Bíblia Sagrada
            </h1>
            <VersionSelector className="w-[90px] h-9" />
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar livro ou versículo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-muted-foreground text-foreground"
            />
          </div>

          <div className="flex gap-1 p-1 bg-secondary/50 rounded-xl overflow-x-auto scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchParams({ tab: tab.id });
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap",
                    activeTab === tab.id
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="px-4 py-6 relative">
        <div className="absolute top-20 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -z-10" />

        {activeTab === "books" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex p-1 bg-secondary/50 backdrop-blur-md rounded-xl border border-border/20">
              <button
                onClick={() => setSelectedTestament("old")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg",
                  selectedTestament === "old"
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Antigo
              </button>
              <button
                onClick={() => setSelectedTestament("new")}
                className={cn(
                  "flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg",
                  selectedTestament === "new"
                    ? "bg-card text-primary shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Novo
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {displayBooks.map((book, index) => (
                <Card
                  key={book.abbrev}
                  className="p-4 cursor-pointer bg-card/40 backdrop-blur-md border border-border/30 hover:border-primary/40 hover:shadow-card hover:-translate-y-1 transition-all duration-300 animate-scale-in group"
                  style={{ animationDelay: `${index * 20}ms` }}
                  onClick={() => navigate(getTenantPath(`/bible/${book.abbrev}`))}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary/40 tracking-tighter uppercase">{book.abbrev}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-300" />
                    </div>
                    <p className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {book.name}
                    </p>
                    <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                      {book.chapters} CAPS
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="space-y-3 animate-fade-in">
            {!user ? (
              <div className="py-12 text-center">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-2">
                  Faça login para ver seus favoritos
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entre na sua conta para salvar versículos
                </p>
              </div>
            ) : loadingData ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Carregando favoritos...</p>
              </div>
            ) : favorites.length === 0 ? (
              <div className="py-12 text-center">
                <Bookmark className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-2">
                  Nenhum favorito ainda
                </h3>
                <p className="text-sm text-muted-foreground">
                  Salve versículos para acessá-los rapidamente
                </p>
              </div>
            ) : (
              favorites.map((fav) => (
                <Card
                  key={fav.id}
                  className="p-3 cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all border border-border/50"
                  onClick={() => navigate(getTenantPath(`/bible/${getBookAbbrev(fav.book)}/${fav.chapter}`))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {getBookName(fav.book)} {fav.chapter}:{fav.verse}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {fav.verse_text || "Versículo salvo"}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(fav.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(fav.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "highlights" && (
          <div className="space-y-3 animate-fade-in">
            {!user ? (
              <div className="py-12 text-center">
                <Highlighter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-2">
                  Faça login para ver seus grifados
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entre na sua conta para salvar grifados
                </p>
              </div>
            ) : loadingData ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Carregando grifados...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtrar:</span>
                  <button
                    onClick={() => setColorFilter(null)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      colorFilter === null
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Todas
                  </button>
                  {HIGHLIGHT_COLORS.map(({ color, name }) => (
                    <button
                      key={color}
                      onClick={() => setColorFilter(colorFilter === color ? null : color)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                        colorFilter === color
                          ? "border-foreground ring-2 ring-foreground/20"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                      title={name}
                    />
                  ))}
                </div>

                {filteredHighlights.length === 0 ? (
                  <div className="py-12 text-center">
                    <Highlighter className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="font-serif font-semibold text-foreground mb-2">
                      {colorFilter ? "Nenhum grifado desta cor" : "Nenhum grifado ainda"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {colorFilter
                        ? "Tente outra cor ou limpe o filtro"
                        : "Grife versículos para acessá-los rapidamente"
                      }
                    </p>
                  </div>
                ) : (
                  filteredHighlights.map((highlight) => (
                    <Card
                      key={highlight.id}
                      className="p-3 cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all border border-border/50"
                      onClick={() => navigate(getTenantPath(`/bible/${getBookAbbrev(highlight.book)}/${highlight.chapter}`))}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0 mt-1"
                            style={{ backgroundColor: highlight.color || "#FEF08A" }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              {getBookName(highlight.book)} {highlight.chapter}:{highlight.verse}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-1">
                              {highlight.created_at && formatDistanceToNow(new Date(highlight.created_at), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeHighlight(highlight.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "notes" && (
          <div className="space-y-3 animate-fade-in">
            {!user ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-2">
                  Faça login para ver suas anotações
                </h3>
                <p className="text-sm text-muted-foreground">
                  Entre na sua conta para salvar anotações
                </p>
              </div>
            ) : loadingData ? (
              <div className="py-12 text-center">
                <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Carregando anotações...</p>
              </div>
            ) : allNotes.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-serif font-semibold text-foreground mb-2">
                  Nenhuma anotação ainda
                </h3>
                <p className="text-sm text-muted-foreground">
                  Adicione anotações aos versículos durante a leitura
                </p>
              </div>
            ) : (
              allNotes.map((note) => (
                <Card
                  key={note.id}
                  className="p-3 cursor-pointer hover:shadow-soft hover:border-primary/20 transition-all border border-border/50"
                  onClick={() => navigate(getTenantPath(`/bible/${getBookAbbrev(note.book)}/${note.chapter}`))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {getBookName(note.book)} {note.chapter}{note.verse ? `:${note.verse}` : ""}
                      </p>
                      <p className="text-sm text-foreground/80 line-clamp-3 mt-1 whitespace-pre-wrap">
                        {note.note}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-2">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNote(note.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bible;
