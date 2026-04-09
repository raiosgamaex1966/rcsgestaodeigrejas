import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek, addDays } from "date-fns";

// Main dashboard statistics
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const now = new Date();
      const startMonth = format(startOfMonth(now), "yyyy-MM-dd");
      const endMonth = format(endOfMonth(now), "yyyy-MM-dd");
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
      const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

      // Parallel queries for efficiency
      const [
        membersResult,
        visitorsResult,
        incomeThisMonthResult,
        incomeLastMonthResult,
        eventsThisMonthResult,
        sermonsResult,
        pendingRequestsResult,
        activeCampaignsResult,
        courseProgressResult,
        pendingExpensesResult,
      ] = await Promise.all([
        // Active members count
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("member_type", "membro")
          .eq("is_active", true),
        
        // Visitors this month
        supabase
          .from("profiles")
          .select("id", { count: "exact" })
          .eq("member_type", "visitante")
          .gte("created_at", startMonth),
        
        // Income this month
        supabase
          .from("income_entries")
          .select("amount")
          .gte("date", startMonth)
          .lte("date", endMonth),
        
        // Income last month (for comparison)
        supabase
          .from("income_entries")
          .select("amount")
          .gte("date", lastMonthStart)
          .lte("date", lastMonthEnd),
        
        // Events this month
        supabase
          .from("events")
          .select("id", { count: "exact" })
          .eq("is_active", true)
          .gte("start_date", startMonth)
          .lte("start_date", endMonth),
        
        // Total sermons
        supabase
          .from("sermons")
          .select("id, views")
          .eq("is_published", true),
        
        // Pending requests
        supabase
          .from("requests")
          .select("id", { count: "exact" })
          .eq("status", "pending"),
        
        // Active campaigns
        supabase
          .from("campaigns")
          .select("id, title, current_amount, goal_amount")
          .eq("is_active", true),
        
        // Students in courses
        supabase
          .from("course_progress")
          .select("user_id")
          .gte("completed_at", startMonth),
        
        // Pending expense approvals
        supabase
          .from("expense_entries")
          .select("id", { count: "exact" })
          .eq("approval_status", "pending"),
      ]);

      const incomeThisMonth = (incomeThisMonthResult.data || []).reduce(
        (acc, entry) => acc + Number(entry.amount),
        0
      );
      
      const incomeLastMonth = (incomeLastMonthResult.data || []).reduce(
        (acc, entry) => acc + Number(entry.amount),
        0
      );

      const incomeChange = incomeLastMonth > 0 
        ? ((incomeThisMonth - incomeLastMonth) / incomeLastMonth) * 100 
        : 0;

      const totalViews = (sermonsResult.data || []).reduce(
        (acc, sermon) => acc + (sermon.views || 0),
        0
      );

      const uniqueStudents = new Set(
        (courseProgressResult.data || []).map((p) => p.user_id)
      ).size;

      return {
        activeMembers: membersResult.count || 0,
        newVisitors: visitorsResult.count || 0,
        incomeThisMonth,
        incomeLastMonth,
        incomeChange,
        eventsThisMonth: eventsThisMonthResult.count || 0,
        totalSermons: sermonsResult.data?.length || 0,
        totalViews,
        pendingRequests: pendingRequestsResult.count || 0,
        activeCampaigns: activeCampaignsResult.data || [],
        activeStudents: uniqueStudents,
        pendingExpenses: pendingExpensesResult.count || 0,
      };
    },
  });
};

// Member growth over last 6 months
export const useMemberGrowth = () => {
  return useQuery({
    queryKey: ["member-growth"],
    queryFn: async () => {
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
        const monthLabel = format(date, "MMM");

        months.push({ monthStart, monthEnd, monthLabel });
      }

      const results = await Promise.all(
        months.map(async ({ monthStart, monthEnd, monthLabel }) => {
          const [membersResult, visitorsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("id", { count: "exact" })
              .eq("member_type", "membro")
              .lte("created_at", monthEnd + "T23:59:59"),
            supabase
              .from("profiles")
              .select("id", { count: "exact" })
              .eq("member_type", "visitante")
              .gte("created_at", monthStart)
              .lte("created_at", monthEnd + "T23:59:59"),
          ]);

          return {
            month: monthLabel,
            membros: membersResult.count || 0,
            visitantes: visitorsResult.count || 0,
          };
        })
      );

      return results;
    },
  });
};

// Finance overview (income vs expenses) over last 6 months
export const useFinanceOverview = () => {
  return useQuery({
    queryKey: ["finance-overview"],
    queryFn: async () => {
      const months = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = format(startOfMonth(date), "yyyy-MM-dd");
        const monthEnd = format(endOfMonth(date), "yyyy-MM-dd");
        const monthLabel = format(date, "MMM");

        months.push({ monthStart, monthEnd, monthLabel });
      }

      const results = await Promise.all(
        months.map(async ({ monthStart, monthEnd, monthLabel }) => {
          const [incomeResult, expenseResult] = await Promise.all([
            supabase
              .from("income_entries")
              .select("amount")
              .gte("date", monthStart)
              .lte("date", monthEnd),
            supabase
              .from("expense_entries")
              .select("amount")
              .gte("date", monthStart)
              .lte("date", monthEnd)
              .eq("status", "paid"),
          ]);

          const income = (incomeResult.data || []).reduce(
            (acc, entry) => acc + Number(entry.amount),
            0
          );
          const expenses = (expenseResult.data || []).reduce(
            (acc, entry) => acc + Number(entry.amount),
            0
          );

          return {
            month: monthLabel,
            receitas: income,
            despesas: expenses,
          };
        })
      );

      return results;
    },
  });
};

// Upcoming birthdays this week
export const useUpcomingBirthdays = () => {
  return useQuery({
    queryKey: ["upcoming-birthdays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, birth_date")
        .not("birth_date", "is", null)
        .eq("is_active", true);

      if (error) throw error;

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 0 });

      // Filter birthdays that fall within this week
      const birthdaysThisWeek = (data || [])
        .filter((profile) => {
          if (!profile.birth_date) return false;
          
          const birthDate = new Date(profile.birth_date);
          const thisYearBirthday = new Date(
            now.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );

          return thisYearBirthday >= weekStart && thisYearBirthday <= weekEnd;
        })
        .map((profile) => {
          const birthDate = new Date(profile.birth_date!);
          const thisYearBirthday = new Date(
            now.getFullYear(),
            birthDate.getMonth(),
            birthDate.getDate()
          );
          
          return {
            ...profile,
            birthdayDate: thisYearBirthday,
            isToday: 
              thisYearBirthday.getDate() === now.getDate() &&
              thisYearBirthday.getMonth() === now.getMonth(),
          };
        })
        .sort((a, b) => a.birthdayDate.getTime() - b.birthdayDate.getTime());

      return birthdaysThisWeek;
    },
  });
};

// Upcoming events
export const useUpcomingDashboardEvents = (limit = 5) => {
  return useQuery({
    queryKey: ["upcoming-dashboard-events", limit],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("events")
        .select(`
          id,
          title,
          event_type,
          start_date,
          start_time,
          location,
          image_url
        `)
        .eq("is_active", true)
        .gte("start_date", today)
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true })
        .limit(limit);

      if (error) throw error;

      // Get attendee counts for each event
      const eventsWithCounts = await Promise.all(
        (data || []).map(async (event) => {
          const { count } = await supabase
            .from("event_attendees")
            .select("id", { count: "exact" })
            .eq("event_id", event.id);

          return {
            ...event,
            attendeesCount: count || 0,
          };
        })
      );

      return eventsWithCounts;
    },
  });
};

// Recent activity feed
export const useRecentActivity = (limit = 10) => {
  return useQuery({
    queryKey: ["recent-activity", limit],
    queryFn: async () => {
      // Get recent activities from multiple sources
      const [newMembers, newEvents, newSermons, approvedExpenses] = await Promise.all([
        // New members/visitors
        supabase
          .from("profiles")
          .select("id, full_name, member_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        
        // Recently created events
        supabase
          .from("events")
          .select("id, title, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        
        // Recently published sermons
        supabase
          .from("sermons")
          .select("id, title, created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(5),
        
        // Recently approved expenses
        supabase
          .from("expense_entries")
          .select("id, description, approved_at")
          .eq("approval_status", "approved")
          .not("approved_at", "is", null)
          .order("approved_at", { ascending: false })
          .limit(5),
      ]);

      // Combine and sort all activities
      const activities: Array<{
        id: string;
        type: "member" | "event" | "sermon" | "expense";
        title: string;
        subtitle?: string;
        timestamp: string;
      }> = [];

      (newMembers.data || []).forEach((m) => {
        activities.push({
          id: `member-${m.id}`,
          type: "member",
          title: m.full_name || "Novo usuário",
          subtitle: m.member_type === "membro" ? "Novo membro" : "Novo visitante",
          timestamp: m.created_at,
        });
      });

      (newEvents.data || []).forEach((e) => {
        activities.push({
          id: `event-${e.id}`,
          type: "event",
          title: e.title,
          subtitle: "Evento criado",
          timestamp: e.created_at,
        });
      });

      (newSermons.data || []).forEach((s) => {
        activities.push({
          id: `sermon-${s.id}`,
          type: "sermon",
          title: s.title,
          subtitle: "Ministração publicada",
          timestamp: s.created_at,
        });
      });

      (approvedExpenses.data || []).forEach((exp) => {
        if (exp.approved_at) {
          activities.push({
            id: `expense-${exp.id}`,
            type: "expense",
            title: exp.description,
            subtitle: "Despesa aprovada",
            timestamp: exp.approved_at,
          });
        }
      });

      // Sort by timestamp and take the most recent
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    },
  });
};
