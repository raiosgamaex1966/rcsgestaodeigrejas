import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface ReadingPlan {
  id: string;
  title: string;
  description: string;
  duration_days: number;
  difficulty: string;
  category: string;
  thumbnail_url: string | null;
  is_active: boolean;
  tags: string[] | null;
  author: string | null;
  is_featured: boolean;
  order_index: number;
}

export interface ReadingPlanDay {
  id: string;
  plan_id: string;
  day_number: number;
  title: string | null;
  readings: { book: string; chapter: number }[];
  reflection: string | null;
  devotional_title: string | null;
  devotional_content: string | null;
  practical_action: string | null;
  prayer: string | null;
  audio_url: string | null;
  verse_reference: string | null;
  verse_text: string | null;
}

export interface PlanProgress {
  id: string;
  user_id: string;
  plan_id: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
}

export interface SavedPlan {
  id: string;
  user_id: string;
  plan_id: string;
  saved_at: string;
}

export const useReadingPlans = () => {
  const { user, tenantId } = useAuth();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [userProgress, setUserProgress] = useState<PlanProgress[]>([]);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = useCallback(async () => {
    if (!tenantId) return;
    try {
      const { data, error } = await supabase
        .from("reading_plans")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_active", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      setPlans((data || []) as ReadingPlan[]);
    } catch (err) {
      console.error("Error fetching plans:", err);
    }
  }, [tenantId]);

  const fetchUserProgress = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reading_plan_progress")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (err) {
      console.error("Error fetching user progress:", err);
    }
  }, [user]);

  const fetchSavedPlans = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reading_plan_saved")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setSavedPlans((data || []) as SavedPlan[]);
    } catch (err) {
      console.error("Error fetching saved plans:", err);
    }
  }, [user]);

  const fetchPlanDays = useCallback(async (planId: string): Promise<ReadingPlanDay[]> => {
    try {
      const { data, error } = await supabase
        .from("reading_plan_days")
        .select("*")
        .eq("plan_id", planId)
        .order("day_number", { ascending: true });

      if (error) throw error;
      return (data || []).map(d => ({
        ...d,
        readings: d.readings as { book: string; chapter: number }[],
      })) as ReadingPlanDay[];
    } catch (err) {
      console.error("Error fetching plan days:", err);
      return [];
    }
  }, []);

  const fetchCompletedDays = useCallback(async (planId: string): Promise<string[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from("reading_plan_day_progress")
        .select("day_id")
        .eq("user_id", user.id)
        .eq("plan_id", planId);

      if (error) throw error;
      return data?.map(d => d.day_id) || [];
    } catch (err) {
      console.error("Error fetching completed days:", err);
      return [];
    }
  }, [user]);

  const startPlan = useCallback(async (planId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("reading_plan_progress")
        .insert({
          user_id: user.id,
          plan_id: planId,
          current_day: 1,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      setUserProgress(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error("Error starting plan:", err);
    }
  }, [user]);

  const completeDay = useCallback(async (planId: string, dayId: string, dayNumber: number) => {
    if (!user) return;

    try {
      await supabase.from("reading_plan_day_progress").insert({
        user_id: user.id,
        plan_id: planId,
        day_id: dayId,
      });

      const { error: updateError } = await supabase
        .from("reading_plan_progress")
        .update({ current_day: dayNumber + 1 })
        .eq("user_id", user.id)
        .eq("plan_id", planId);

      if (updateError) throw updateError;

      setUserProgress(prev =>
        prev.map(p =>
          p.plan_id === planId
            ? { ...p, current_day: dayNumber + 1 }
            : p
        )
      );

      return true;
    } catch (err) {
      console.error("Error completing day:", err);
      return false;
    }
  }, [user]);

  const savePlanForLater = useCallback(async (planId: string) => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from("reading_plan_saved")
        .insert({
          user_id: user.id,
          plan_id: planId,
        })
        .select()
        .single();

      if (error) throw error;
      setSavedPlans(prev => [...prev, data as SavedPlan]);
      return true;
    } catch (err) {
      console.error("Error saving plan:", err);
      return false;
    }
  }, [user]);

  const unsavePlan = useCallback(async (planId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from("reading_plan_saved")
        .delete()
        .eq("user_id", user.id)
        .eq("plan_id", planId);

      if (error) throw error;
      setSavedPlans(prev => prev.filter(s => s.plan_id !== planId));
      return true;
    } catch (err) {
      console.error("Error unsaving plan:", err);
      return false;
    }
  }, [user]);

  const isInPlan = useCallback((planId: string) => {
    return userProgress.some(p => p.plan_id === planId && p.is_active);
  }, [userProgress]);

  const isPlanSaved = useCallback((planId: string) => {
    return savedPlans.some(s => s.plan_id === planId);
  }, [savedPlans]);

  const isPlanCompleted = useCallback((planId: string) => {
    const progress = userProgress.find(p => p.plan_id === planId);
    const plan = plans.find(p => p.id === planId);
    return progress && plan && progress.current_day > plan.duration_days;
  }, [userProgress, plans]);

  const getPlanProgress = useCallback((planId: string) => {
    return userProgress.find(p => p.plan_id === planId);
  }, [userProgress]);

  const getActivePlans = useCallback(() => {
    return plans.filter(p => isInPlan(p.id) && !isPlanCompleted(p.id));
  }, [plans, isInPlan, isPlanCompleted]);

  const getSavedPlansList = useCallback(() => {
    return plans.filter(p => isPlanSaved(p.id) && !isInPlan(p.id));
  }, [plans, isPlanSaved, isInPlan]);

  const getCompletedPlans = useCallback(() => {
    return plans.filter(p => isPlanCompleted(p.id));
  }, [plans, isPlanCompleted]);

  const getFeaturedPlans = useCallback(() => {
    return plans.filter(p => p.is_featured && !isInPlan(p.id));
  }, [plans, isInPlan]);

  const getPlansByTag = useCallback((tag: string) => {
    return plans.filter(p => p.tags?.includes(tag) && !isInPlan(p.id));
  }, [plans, isInPlan]);

  const getPlansByCategory = useCallback((category: string) => {
    return plans.filter(p => p.category === category && !isInPlan(p.id));
  }, [plans, isInPlan]);

  const getAllTags = useCallback(() => {
    const tags = new Set<string>();
    plans.forEach(p => p.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [plans]);

  const getAllCategories = useCallback(() => {
    const categories = new Set<string>();
    plans.forEach(p => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }, [plans]);

  // Get the expected day based on start date (1 day = 1 expected day)
  const getExpectedDay = useCallback((planId: string) => {
    const progress = userProgress.find(p => p.plan_id === planId);
    if (!progress?.started_at) return 1;
    
    const startDate = new Date(progress.started_at);
    const today = new Date();
    // Reset hours to compare just dates
    startDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff + 1; // Day 1 on first day
  }, [userProgress]);

  // Get how many days behind the user is
  const getDaysOverdue = useCallback((planId: string) => {
    const expected = getExpectedDay(planId);
    const progress = userProgress.find(p => p.plan_id === planId);
    const currentDay = progress?.current_day || 1;
    return Math.max(0, expected - currentDay);
  }, [getExpectedDay, userProgress]);

  // Check if user is on track with the plan
  const isPlanOnTrack = useCallback((planId: string) => {
    return getDaysOverdue(planId) === 0;
  }, [getDaysOverdue]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchPlans(), fetchUserProgress(), fetchSavedPlans()]);
      setLoading(false);
    };

    loadData();
  }, [fetchPlans, fetchUserProgress, fetchSavedPlans]);

  return {
    plans,
    userProgress,
    savedPlans,
    loading,
    fetchPlanDays,
    fetchCompletedDays,
    startPlan,
    completeDay,
    savePlanForLater,
    unsavePlan,
    isInPlan,
    isPlanSaved,
    isPlanCompleted,
    getPlanProgress,
    getActivePlans,
    getSavedPlansList,
    getCompletedPlans,
    getFeaturedPlans,
    getPlansByTag,
    getPlansByCategory,
    getAllTags,
    getAllCategories,
    getExpectedDay,
    getDaysOverdue,
    isPlanOnTrack,
    refetch: () => Promise.all([fetchPlans(), fetchUserProgress(), fetchSavedPlans()]),
  };
};
