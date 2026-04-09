import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useGamificationContext, UserGamification } from "@/contexts/GamificationContext";

export interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  points_reward: number | null;
  criteria: unknown;
  is_active: boolean | null;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  xp_this_week: number;
  current_streak: number;
  level: number;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

// Pontos por ação
const POINTS = {
  READ_CHAPTER: 10,
  COMPLETE_DAILY_PLAN: 25,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
  FAVORITE_VERSE: 2,
  ADD_NOTE: 5,
  SHARE_VERSE: 3,
};

// Níveis
const LEVELS = [
  { level: 1, name: "Semente", minPoints: 0 },
  { level: 2, name: "Broto", minPoints: 100 },
  { level: 3, name: "Arbusto", minPoints: 500 },
  { level: 4, name: "Árvore", minPoints: 1500 },
  { level: 5, name: "Árvore Frutífera", minPoints: 5000 },
  { level: 6, name: "Cedro do Líbano", minPoints: 15000 },
];

export const getLevelInfo = (points: number) => {
  const level = LEVELS.slice().reverse().find(l => points >= l.minPoints) || LEVELS[0];
  const nextLevel = LEVELS.find(l => l.minPoints > points);
  const progress = nextLevel
    ? ((points - level.minPoints) / (nextLevel.minPoints - level.minPoints)) * 100
    : 100;

  return { ...level, progress, nextLevel };
};

export const useGamification = () => {
  const { user } = useAuth();
  const { gamification, updateGamificationLocally, refreshGamification } = useGamificationContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar conquistas
  const fetchAchievements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      setAchievements(data || []);
    } catch (err) {
      console.error("Error fetching achievements:", err);
    }
  }, []);

  // Buscar conquistas do usuário
  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserAchievements(data?.map(a => a.achievement_id) || []);
    } catch (err) {
      console.error("Error fetching user achievements:", err);
    }
  }, [user]);

  // Buscar leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      // Buscar dados de gamificação
      const { data: gamificationData, error: gamError } = await supabase
        .from("user_gamification")
        .select("user_id, total_points, xp_this_week, current_streak, level")
        .order("xp_this_week", { ascending: false })
        .limit(10);

      if (gamError) throw gamError;
      if (!gamificationData || gamificationData.length === 0) {
        setLeaderboard([]);
        return;
      }

      // Buscar profiles separadamente
      const userIds = gamificationData.map(g => g.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Combinar dados
      const formatted = gamificationData.map(entry => {
        const profile = profilesData?.find(p => p.id === entry.user_id);
        return {
          ...entry,
          profile: profile ? { full_name: profile.full_name, avatar_url: profile.avatar_url } : undefined,
        };
      });

      setLeaderboard(formatted as LeaderboardEntry[]);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  }, []);

  // Adicionar pontos
  const addPoints = useCallback(async (
    actionType: string,
    points: number,
    metadata?: Record<string, unknown>
  ) => {
    if (!user) return;

    try {
      let currentGamification = gamification;

      // Se não tiver gamification no estado, tenta buscar do banco
      if (!currentGamification) {
        const { data, error } = await supabase
          .from("user_gamification")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          console.error("Gamification record not found, points cannot be added");
          return;
        }
        currentGamification = data;
      }

      const today = new Date().toISOString().split("T")[0];
      const lastActivity = currentGamification.last_activity_date;

      let newStreak = currentGamification.current_streak;
      let longestStreak = currentGamification.longest_streak;

      // Calcular streak
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      if (newStreak > longestStreak) {
        longestStreak = newStreak;
      }

      // Bônus de streak
      let bonusPoints = 0;
      if (newStreak === 7) bonusPoints = POINTS.STREAK_7_DAYS;
      if (newStreak === 30) bonusPoints = POINTS.STREAK_30_DAYS;

      const totalPointsToAdd = points + bonusPoints;
      const newTotalPoints = currentGamification.total_points + totalPointsToAdd;
      const newLevel = getLevelInfo(newTotalPoints).level;

      // Atualizar gamificação
      await supabase
        .from("user_gamification")
        .update({
          total_points: newTotalPoints,
          xp_this_week: currentGamification.xp_this_week + totalPointsToAdd,
          current_streak: newStreak,
          longest_streak: longestStreak,
          level: newLevel,
          last_activity_date: today,
        })
        .eq("user_id", user.id);

      // Registrar atividade
      await supabase.from("reading_activity").insert({
        user_id: user.id,
        action_type: actionType,
        points_earned: totalPointsToAdd,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      });

      // Atualizar estado global
      updateGamificationLocally({
        total_points: newTotalPoints,
        xp_this_week: currentGamification.xp_this_week + totalPointsToAdd,
        current_streak: newStreak,
        longest_streak: longestStreak,
        level: newLevel,
        last_activity_date: today,
      });

      return { points: totalPointsToAdd, streak: newStreak, bonusPoints };
    } catch (err) {
      console.error("Error adding points:", err);
    }
  }, [user, gamification, updateGamificationLocally]);

  // Marcar capítulo como lido
  const markChapterRead = useCallback(async (book: string, chapter: number) => {
    if (!user) return;

    try {
      // Registrar no histórico
      await supabase.from("reading_history").insert({
        user_id: user.id,
        book,
        chapter,
      });

      // Adicionar pontos
      return await addPoints("read_chapter", POINTS.READ_CHAPTER, { book, chapter });
    } catch (err) {
      console.error("Error marking chapter read:", err);
    }
  }, [user, addPoints]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAchievements(),
        fetchUserAchievements(),
        fetchLeaderboard(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchAchievements, fetchUserAchievements, fetchLeaderboard]);

  return {
    gamification,
    achievements,
    userAchievements,
    leaderboard,
    loading,
    addPoints,
    markChapterRead,
    POINTS,
    getLevelInfo,
    refetch: () => Promise.all([refreshGamification(), fetchLeaderboard()]),
  };
};
