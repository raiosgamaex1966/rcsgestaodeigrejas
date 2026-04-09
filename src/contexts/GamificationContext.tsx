import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserGamification {
    id: string;
    user_id: string;
    total_points: number;
    current_streak: number;
    longest_streak: number;
    level: number;
    xp_this_week: number;
    last_activity_date: string | null;
    streak_freeze_available: number;
}

interface GamificationContextType {
    gamification: UserGamification | null;
    loading: boolean;
    refreshGamification: () => Promise<void>;
    updateGamificationLocally: (update: Partial<UserGamification>) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [gamification, setGamification] = useState<UserGamification | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchGamification = useCallback(async () => {
        if (!user) {
            setGamification(null);
            setLoading(false);
            return;
        }

        try {
            let { data, error } = await supabase
                .from("user_gamification")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code === "PGRST116") {
                const { data: newData, error: insertError } = await supabase
                    .from("user_gamification")
                    .insert({ user_id: user.id })
                    .select()
                    .single();

                if (insertError) throw insertError;
                data = newData;
            } else if (error) {
                throw error;
            }

            setGamification(data);
        } catch (err) {
            console.error("Error fetching gamification:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const updateGamificationLocally = useCallback((update: Partial<UserGamification>) => {
        setGamification(prev => (prev ? { ...prev, ...update } : null));
    }, []);

    useEffect(() => {
        fetchGamification();
    }, [fetchGamification]);

    return (
        <GamificationContext.Provider
            value={{
                gamification,
                loading,
                refreshGamification: fetchGamification,
                updateGamificationLocally
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamificationContext = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error("useGamificationContext must be used within a GamificationProvider");
    }
    return context;
};
