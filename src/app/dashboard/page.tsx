"use client";

import { StatsGrid } from "@/client/components/dashboard/StatsGrid";
import { RecentActivity } from "@/client/components/dashboard/RecentActivity";
import { UpcomingTasks } from "@/client/components/dashboard/UpcomingTasks";
import { QuickActions } from "@/client/components/dashboard/QuickActions";
import { TrendingUp, Flame, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/client/components/ui/Card";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface UserStats {
    streak: number;
    todayProgress: number;
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const [userStats, setUserStats] = useState<UserStats>({ streak: 0, todayProgress: 0 });
    const [loading, setLoading] = useState(true);

    const userName = session?.user?.name || "Học viên";

    useEffect(() => {
        async function fetchUserStats() {
            try {
                const res = await fetch("/api/user/stats");
                if (res.ok) {
                    const data = await res.json();
                    setUserStats({
                        streak: data.streak || 0,
                        todayProgress: data.progress || 0,
                    });
                }
            } catch (error) {
                console.error("Failed to fetch user stats:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchUserStats();
    }, []);

    return (
        <main className="container mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-10 pb-24 md:pb-10">
            {/* Welcome Section with Streak */}
            <section className="flex flex-col gap-4 md:gap-6 md:flex-row md:items-center md:justify-between" aria-labelledby="welcome-heading">
                <div>
                    <h1 id="welcome-heading" className="text-xl md:text-3xl font-bold tracking-tight text-foreground">
                        Chào mừng, {userName}! 👋
                    </h1>
                    <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
                        Tiếp tục hành trình học tập của bạn
                    </p>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-3">
                    <Card className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 border-orange-500/20 bg-orange-500/5">
                        <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500" aria-hidden="true" />
                        <div>
                            <p className="text-xs md:text-sm font-medium text-orange-500">Chuỗi ngày học</p>
                            {loading ? (
                                <Loader2 className="h-4 w-4 md:h-5 md:w-5 animate-spin text-orange-400" />
                            ) : (
                                <p className="text-lg md:text-2xl font-bold text-orange-600 dark:text-orange-400">{userStats.streak} ngày</p>
                            )}
                        </div>
                    </Card>
                </div>
            </section>

            {/* Today's Progress Bar */}
            <section>
                <Card>
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between mb-2 md:mb-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-primary" aria-hidden="true" />
                                <span className="text-sm md:text-base font-semibold text-foreground">Tiến độ tổng quan</span>
                            </div>
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            ) : (
                                <span className="text-xs md:text-sm text-muted-foreground">{userStats.todayProgress}% hoàn thành</span>
                            )}
                        </div>
                        <div
                            className="h-2 md:h-3 w-full overflow-hidden rounded-full bg-secondary"
                            role="progressbar"
                            aria-valuenow={userStats.todayProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Tiến độ: ${userStats.todayProgress}%`}
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${userStats.todayProgress}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* Stats Grid */}
            <section aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="sr-only">Thống kê học tập</h2>
                <StatsGrid />
            </section>

            {/* Quick Actions */}
            <QuickActions />

            {/* Two Column Layout: Activity & Tasks */}
            <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
                {/* Activity List - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Hoạt động gần đây</h2>
                    <RecentActivity />
                </div>

                {/* Upcoming Tasks */}
                <UpcomingTasks />
            </div>
        </main>
    );
}
