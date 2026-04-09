import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bibleBooks } from "@/data/bible";
import { ChevronLeft, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const BibleBook = () => {
  const { churchSlug, bookId } = useParams();
  const navigate = useNavigate();
  const { getTenantPath } = useAuth();

  const book = bibleBooks.find(
    (b) => b.abbrev.toLowerCase() === bookId?.toLowerCase()
  );

  if (!book) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Livro não encontrado</p>
        <Button variant="link" onClick={() => navigate(getTenantPath("/bible"))}>
          Voltar para a Bíblia
        </Button>
      </div>
    );
  }

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <div className="w-full max-w-lg md:max-w-4xl mx-auto pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border/50 pt-safe">
        <div className="px-4 py-3">
          <Link
            to={getTenantPath("/bible")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Voltar para a Bíblia</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shadow-soft">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-foreground">
                {book.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {book.chapters} capítulos
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chapters Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {chapters.map((chapter) => (
            <Card
              key={chapter}
              className="aspect-square flex items-center justify-center cursor-pointer hover:bg-primary hover:text-primary-foreground border border-border/50 transition-all font-bold shadow-soft hover:shadow-card"
              onClick={() => navigate(getTenantPath(`/bible/${bookId}/${chapter}`))}
            >
              {chapter}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BibleBook;
