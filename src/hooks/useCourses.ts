import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CourseCategory {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean | null;
  order_index: number | null;
  created_at: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  thumbnail_url: string | null;
  instructor: string | null;
  difficulty: string | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  order_index: number | null;
  created_at: string | null;
  updated_at: string | null;
  category?: CourseCategory;
  lessons_count?: number;
  total_duration?: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  order_index: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface CourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  lesson_id: string;
  completed_at: string | null;
}

export const useCourses = () => {
  const { user, tenantId } = useAuth();
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["course-categories", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("course_categories")
        .select("*")
        .eq("is_active", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query.order("order_index");
      if (error) throw error;
      return data as CourseCategory[];
    },
    enabled: !!tenantId,
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ["courses", tenantId],
    queryFn: async () => {
      let query = supabase
        .from("courses")
        .select(`
          *,
          category:course_categories(*)
        `)
        .eq("is_active", true);
      
      if (tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      const { data, error } = await query.order("order_index");
      if (error) throw error;
      
      // Get lessons count for each course
      const coursesWithCounts = await Promise.all(
        (data || []).map(async (course) => {
          const { count } = await supabase
            .from("lessons")
            .select("*", { count: "exact", head: true })
            .eq("course_id", course.id)
            .eq("is_active", true);
          
          const { data: lessons } = await supabase
            .from("lessons")
            .select("duration_minutes")
            .eq("course_id", course.id)
            .eq("is_active", true);
          
          const totalDuration = lessons?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0;
          
          return {
            ...course,
            lessons_count: count || 0,
            total_duration: totalDuration,
          };
        })
      );
      
      return coursesWithCounts as Course[];
    },
    enabled: !!tenantId,
  });

  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["course-progress", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data as CourseProgress[];
    },
    enabled: !!user,
  });

  const markLessonComplete = useMutation({
    mutationFn: async ({ courseId, lessonId }: { courseId: string; lessonId: string }) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("course_progress")
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
        }, {
          onConflict: "user_id,lesson_id",
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
    },
  });

  const getCourseProgress = (courseId: string, totalLessons: number) => {
    const completedLessons = progress.filter((p) => p.course_id === courseId).length;
    return totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some((p) => p.lesson_id === lessonId);
  };

  return {
    categories,
    courses,
    progress,
    isLoading: categoriesLoading || coursesLoading || progressLoading,
    markLessonComplete,
    getCourseProgress,
    isLessonCompleted,
  };
};

export const useCourse = (courseId: string) => {
  const { data: course, isLoading: courseLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          category:course_categories(*)
        `)
        .eq("id", courseId)
        .single();
      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["lessons", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .eq("is_active", true)
        .order("order_index");
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!courseId,
  });

  return {
    course,
    lessons,
    isLoading: courseLoading || lessonsLoading,
  };
};
