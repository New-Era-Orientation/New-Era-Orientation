"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

interface UserStats {
    examsCompleted: number;
    averageScore: number;
    studyTime: number; // in minutes
    progress: number;
    streak: number;
}

interface UserActivity {
    id: string;
    title: string;
    type: "exam" | "study" | "practice";
    score?: number;
    createdAt: string;
}

interface UserContextType {
    user: {
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        role: string;
    } | null;
    stats: UserStats | null;
    recentActivities: UserActivity[];
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<UserStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<UserActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUserData = useCallback(async () => {
        if (!session?.user?.id) {
            setIsLoading(false);
            return;
        }

        try {
            // Fetch user stats
            const statsRes = await fetch("/api/user/stats");
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Fetch recent activities
            const activitiesRes = await fetch("/api/user/activities");
            if (activitiesRes.ok) {
                const activitiesData = await activitiesRes.json();
                setRecentActivities(activitiesData);
            }
        } catch (error) {
            console.error("Failed to fetch user data:", error);
        } finally {
            setIsLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === "authenticated") {
            fetchUserData();
        } else if (status === "unauthenticated") {
            setIsLoading(false);
            setStats(null);
            setRecentActivities([]);
        }
    }, [status, fetchUserData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (status !== "authenticated") return;

        const interval = setInterval(() => {
            fetchUserData();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [status, fetchUserData]);

    const user = session?.user ? {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email!,
        image: session.user.image ?? null,
        role: session.user.role ?? "STUDENT",
    } : null;

    return (
        <UserContext.Provider value={{
            user,
            stats,
            recentActivities,
            isLoading: status === "loading" || isLoading,
            refreshData: fetchUserData,
        }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
