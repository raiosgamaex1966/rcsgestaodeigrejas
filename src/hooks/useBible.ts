import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface BibleFavorite {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verse_text: string;
  created_at: string;
}

export interface BibleHighlight {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  color: string;
  created_at: string;
}

export interface BibleNote {
  id: string;
  book: string;
  chapter: number;
  verse: number | null;
  note: string;
  created_at: string;
}

export interface ReadingHistoryEntry {
  id: string;
  book: string;
  chapter: number;
  read_at: string;
}

export const useBible = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Buscar favortios com react-query
  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ["bible-favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bible_favorites")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar histórico com react-query
  const { data: history = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["bible-history", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("reading_history")
        .select("*")
        .eq("user_id", user.id)
        .order("read_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Buscar todas as notas com react-query
  const { data: allNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ["bible-notes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bible_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Highlights de um capítulo específico - Mantido como hook simples mas pode ser otimizado depois
  const fetchHighlightsForChapter = useCallback(async (book: string, chapter: number) => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from("bible_highlights")
        .select("*")
        .eq("user_id", user.id)
        .eq("book", book)
        .eq("chapter", chapter);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching highlights:", err);
      return [];
    }
  }, [user]);

  // Adicionar favorito
  const addFavorite = useCallback(async (
    book: string,
    chapter: number,
    verse: number,
    verseText: string
  ) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bible_favorites")
        .insert({
          user_id: user.id,
          book,
          chapter,
          verse,
          verse_text: verseText,
        })
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-favorites", user.id] });
      return data;
    } catch (err) {
      console.error("Error adding favorite:", err);
    }
  }, [user, queryClient]);

  // Remover favorito
  const removeFavorite = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("bible_favorites")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-favorites", user.id] });
    } catch (err) {
      console.error("Error removing favorite:", err);
    }
  }, [user, queryClient]);

  // Verificar se versículo é favorito
  const isFavorite = useCallback((book: string, chapter: number, verse: number) => {
    return favorites.some(f => f.book === book && f.chapter === chapter && f.verse === verse);
  }, [favorites]);

  // Toggle highlight
  const toggleHighlight = useCallback(async (
    book: string,
    chapter: number,
    verse: number,
    color: string = "#FEF08A"
  ) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from("bible_highlights")
        .select("id")
        .eq("user_id", user.id)
        .eq("book", book)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("bible_highlights")
          .delete()
          .eq("id", existing.id);
      } else {
        await supabase
          .from("bible_highlights")
          .insert({
            user_id: user.id,
            book,
            chapter,
            verse,
            color,
          });
      }
      // O ideal seria usar queries para highlights também, mas por enquanto invalidamos se houver uma "all-highlights"
      queryClient.invalidateQueries({ queryKey: ["bible-highlights", user.id] });
    } catch (err) {
      console.error("Error toggling highlight:", err);
    }
  }, [user, queryClient]);

  // Adicionar nota
  const addNote = useCallback(async (
    book: string,
    chapter: number,
    verse: number | null,
    note: string
  ) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bible_notes")
        .insert({
          user_id: user.id,
          book,
          chapter,
          verse,
          note,
        })
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-notes", user.id] });
      return data;
    } catch (err) {
      console.error("Error adding note:", err);
    }
  }, [user, queryClient]);

  // Atualizar nota
  const updateNote = useCallback(async (id: string, note: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("bible_notes")
        .update({ note, updated_at: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-notes", user.id] });
      return data;
    } catch (err) {
      console.error("Error updating note:", err);
    }
  }, [user, queryClient]);

  // Remover nota
  const removeNote = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("bible_notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-notes", user.id] });
    } catch (err) {
      console.error("Error removing note:", err);
    }
  }, [user, queryClient]);

  // Adicionar/Atualizar highlight com cor específica
  const highlightWithColor = useCallback(async (
    book: string,
    chapter: number,
    verse: number,
    color: string
  ) => {
    if (!user) return null;
    try {
      const { data: existing } = await supabase
        .from("bible_highlights")
        .select("id")
        .eq("user_id", user.id)
        .eq("book", book)
        .eq("chapter", chapter)
        .eq("verse", verse)
        .maybeSingle();

      let result;
      if (existing) {
        const { data, error } = await supabase
          .from("bible_highlights")
          .update({ color })
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from("bible_highlights")
          .insert({
            user_id: user.id,
            book,
            chapter,
            verse,
            color,
          })
          .select()
          .single();
        if (error) throw error;
        result = data;
      }
      queryClient.invalidateQueries({ queryKey: ["bible-highlights", user.id] });
      return result;
    } catch (err) {
      console.error("Error highlighting:", err);
      return null;
    }
  }, [user, queryClient]);

  // Remover highlight
  const removeHighlight = useCallback(async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("bible_highlights")
        .delete()
        .eq("id", id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["bible-highlights", user.id] });
    } catch (err) {
      console.error("Error removing highlight:", err);
    }
  }, [user, queryClient]);

  // Buscar notas de um capítulo
  const fetchNotesForChapter = useCallback(async (book: string, chapter: number) => {
    if (!user) return [];
    try {
      const { data, error } = await supabase
        .from("bible_notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("book", book)
        .eq("chapter", chapter)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching notes:", err);
      return [];
    }
  }, [user]);

  // Obter nota de um versículo específico do cache
  const getNoteForVerse = useCallback((book: string, chapter: number, verse: number) => {
    return allNotes.find(n => n.book === book && n.chapter === chapter && n.verse === verse);
  }, [allNotes]);

  // Buscar todos os highlights com react-query
  const { data: allHighlights = [], isLoading: loadingHighlights } = useQuery({
    queryKey: ["bible-highlights-all", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("bible_highlights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  return {
    favorites,
    history,
    allNotes,
    allHighlights,
    loading: loadingFavorites || loadingHistory || loadingNotes || loadingHighlights,
    fetchFavorites: useCallback(() => queryClient.invalidateQueries({ queryKey: ["bible-favorites", user?.id] }), [queryClient, user?.id]),
    fetchHistory: useCallback(() => queryClient.invalidateQueries({ queryKey: ["bible-history", user?.id] }), [queryClient, user?.id]),
    fetchAllNotes: useCallback(() => queryClient.invalidateQueries({ queryKey: ["bible-notes", user?.id] }), [queryClient, user?.id]),
    fetchAllHighlights: useCallback(() => queryClient.invalidateQueries({ queryKey: ["bible-highlights-all", user?.id] }), [queryClient, user?.id]),
    fetchHighlightsForChapter,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleHighlight,
    highlightWithColor,
    removeHighlight,
    addNote,
    updateNote,
    removeNote,
    fetchNotesForChapter,
    getNoteForVerse,
    // Compatibilidade
    highlights: allHighlights,
    notes: allNotes,
  };
};


