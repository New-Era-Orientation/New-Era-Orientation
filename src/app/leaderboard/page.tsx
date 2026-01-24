"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import {
    Trophy,
    Medal,
    Crown,
    Star,
    TrendingUp,
    Users,
    Target,
    Loader2,
    ChevronUp,
    ChevronDown,
    Minus
} from "lucide-react";
import { cn } from "@/client/lib/utils";
import Image from "next/image";
import { useSubject } from "@/client/contexts/SubjectContext";

interface LeaderboardUser {
    rank: number;
    previousRank: number | null;
    userId: string;
    name: string;
    image: string | null;
    score: number;
    examsCompleted: number;
    avgScore: number;
    streak: number;
}

interface LeaderboardData {
    topUsers: LeaderboardUser[];
    currentUser: LeaderboardUser | null;
    totalParticipants: number;
}

export default function LeaderboardPage() {
    const { selectedSubjectId, isLoading: isSubjectLoading } = useSubject();
    const [data, setData] = useState<LeaderboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<"week" | "month" | "all">("month");
    const [category, setCategory] = useState<"score" | "exams" | "streak">("score");

    useEffect(() => {
        async function fetchLeaderboard() {
            if (isSubjectLoading) return;

            setLoading(true);
            try {
                const query = new URLSearchParams({
                    range: timeRange,
                    category: category,
                    ...(selectedSubjectId ? { subjectId: selectedSubjectId } : {})
                });

                const res = await fetch(`/api/leaderboard?${query.toString()}`);
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchLeaderboard();
    }, [timeRange, category, selectedSubjectId, isSubjectLoading]);

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="h-6 w-6 text-yellow-500" />;
            case 2:
                return <Medal className="h-6 w-6 text-gray-400" />;
            case 3:
                return <Medal className="h-6 w-6 text-amber-600" />;
            default:
                return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getRankChange = (current: number, previous: number | null) => {
        if (previous === null) return { icon: <Minus className="h-4 w-4" />, color: "text-muted-foreground", text: "Mới" };
        const change = previous - current;
        if (change > 0) return { icon: <ChevronUp className="h-4 w-4" />, color: "text-emerald-500", text: `+${change}` };
        if (change < 0) return { icon: <ChevronDown className="h-4 w-4" />, color: "text-red-500", text: `${change}` };
        return { icon: <Minus className="h-4 w-4" />, color: "text-muted-foreground", text: "=" };
    };

    const getCategoryLabel = () => {
        switch (category) {
            case "score": return "Tổng điểm";
            case "exams": return "Số đề thi";
            case "streak": return "Chuỗi ngày";
        }
    };

    const getCategoryValue = (user: LeaderboardUser) => {
        switch (category) {
            case "score": return user.score.toLocaleString();
            case "exams": return user.examsCompleted;
            case "streak": return `${user.streak} ngày`;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-gradient-to-br from-yellow-500/20 to-amber-500/20 p-4">
                            <Trophy className="h-8 w-8 text-yellow-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Bảng xếp hạng</h1>
                            <p className="text-muted-foreground mt-1">
                                Thi đua cùng {data?.totalParticipants || 0} học viên khác
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
                        {/* Category Filter */}
                        <div className="flex gap-1 p-1 rounded-lg bg-secondary">
                            {(["score", "exams", "streak"] as const).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                        category === cat
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {cat === "score" ? "Điểm" : cat === "exams" ? "Đề thi" : "Streak"}
                                </button>
                            ))}
                        </div>

                        {/* Time Range Filter */}
                        <div className="flex gap-1 p-1 rounded-lg bg-secondary">
                            {(["week", "month", "all"] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                        timeRange === range
                                            ? "bg-background text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {range === "week" ? "Tuần" : range === "month" ? "Tháng" : "Tất cả"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-[60vh]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Top 3 Podium */}
                        {data && data.topUsers.length >= 3 && (
                            <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                                {/* Second Place */}
                                <div className="flex flex-col items-center mt-8">
                                    <div className="relative">
                                        <div className="absolute -top-3 -right-3 z-10">
                                            <div className="rounded-full bg-gray-400 p-1.5">
                                                <Medal className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                        {data.topUsers[1]?.image ? (
                                            <Image
                                                src={data.topUsers[1].image}
                                                alt={data.topUsers[1].name}
                                                width={80}
                                                height={80}
                                                className="rounded-full ring-4 ring-gray-400"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gray-400/20 ring-4 ring-gray-400 flex items-center justify-center">
                                                <Users className="h-8 w-8 text-gray-400" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-semibold text-foreground mt-3 text-center">{data.topUsers[1]?.name}</p>
                                    <p className="text-lg font-bold text-gray-400">{getCategoryValue(data.topUsers[1])}</p>
                                    <Badge variant="info" className="mt-1">#2</Badge>
                                </div>

                                {/* First Place */}
                                <div className="flex flex-col items-center">
                                    <div className="relative">
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                                            <Crown className="h-8 w-8 text-yellow-500" />
                                        </div>
                                        {data.topUsers[0]?.image ? (
                                            <Image
                                                src={data.topUsers[0].image}
                                                alt={data.topUsers[0].name}
                                                width={96}
                                                height={96}
                                                className="rounded-full ring-4 ring-yellow-500"
                                            />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-yellow-500/20 ring-4 ring-yellow-500 flex items-center justify-center">
                                                <Users className="h-10 w-10 text-yellow-500" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-semibold text-foreground mt-3 text-center">{data.topUsers[0]?.name}</p>
                                    <p className="text-xl font-bold text-yellow-500">{getCategoryValue(data.topUsers[0])}</p>
                                    <Badge variant="success" className="mt-1">🥇 #1</Badge>
                                </div>

                                {/* Third Place */}
                                <div className="flex flex-col items-center mt-12">
                                    <div className="relative">
                                        <div className="absolute -top-3 -right-3 z-10">
                                            <div className="rounded-full bg-amber-600 p-1.5">
                                                <Medal className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                        {data.topUsers[2]?.image ? (
                                            <Image
                                                src={data.topUsers[2].image}
                                                alt={data.topUsers[2].name}
                                                width={72}
                                                height={72}
                                                className="rounded-full ring-4 ring-amber-600"
                                            />
                                        ) : (
                                            <div className="w-18 h-18 rounded-full bg-amber-600/20 ring-4 ring-amber-600 flex items-center justify-center" style={{ width: 72, height: 72 }}>
                                                <Users className="h-7 w-7 text-amber-600" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="font-semibold text-foreground mt-3 text-center">{data.topUsers[2]?.name}</p>
                                    <p className="text-lg font-bold text-amber-600">{getCategoryValue(data.topUsers[2])}</p>
                                    <Badge variant="default" className="mt-1">#3</Badge>
                                </div>
                            </div>
                        )}

                        {/* Full Leaderboard */}
                        <Card className="overflow-hidden">
                            <div className="p-4 border-b border-border">
                                <h2 className="font-semibold text-foreground">Xếp hạng theo {getCategoryLabel()}</h2>
                            </div>

                            {data && data.topUsers.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {data.topUsers.map((user, index) => {
                                        const rankChange = getRankChange(user.rank, user.previousRank);
                                        const isCurrentUser = data.currentUser?.userId === user.userId;

                                        return (
                                            <div
                                                key={user.userId}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors",
                                                    isCurrentUser && "bg-primary/5 hover:bg-primary/10"
                                                )}
                                            >
                                                {/* Rank */}
                                                <div className="w-12 flex items-center justify-center">
                                                    {getRankIcon(user.rank)}
                                                </div>

                                                {/* Rank Change */}
                                                <div className={cn("w-10 flex items-center gap-0.5 text-xs", rankChange.color)}>
                                                    {rankChange.icon}
                                                    <span>{rankChange.text}</span>
                                                </div>

                                                {/* Avatar */}
                                                {user.image ? (
                                                    <Image
                                                        src={user.image}
                                                        alt={user.name}
                                                        width={40}
                                                        height={40}
                                                        className="rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-primary" />
                                                    </div>
                                                )}

                                                {/* User Info */}
                                                <div className="flex-1">
                                                    <p className={cn(
                                                        "font-medium",
                                                        isCurrentUser ? "text-primary" : "text-foreground"
                                                    )}>
                                                        {user.name}
                                                        {isCurrentUser && <span className="ml-2 text-xs">(Bạn)</span>}
                                                    </p>
                                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Target className="h-3 w-3" />
                                                            {user.examsCompleted} đề
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="h-3 w-3" />
                                                            {user.avgScore.toFixed(1)} TB
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <TrendingUp className="h-3 w-3" />
                                                            {user.streak} ngày
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Score */}
                                                <div className="text-right">
                                                    <p className={cn(
                                                        "text-lg font-bold",
                                                        user.rank <= 3 ? "text-yellow-500" : "text-foreground"
                                                    )}>
                                                        {getCategoryValue(user)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">Chưa có dữ liệu xếp hạng</p>
                                    <p className="text-sm text-muted-foreground mt-1">Hoàn thành đề thi để được xếp hạng</p>
                                </div>
                            )}
                        </Card>

                        {/* Current User Position (if not in top) */}
                        {data?.currentUser && !data.topUsers.some(u => u.userId === data.currentUser?.userId) && (
                            <Card className="mt-4 p-4 border-primary/50 bg-primary/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 flex items-center justify-center">
                                        <span className="text-lg font-bold text-primary">#{data.currentUser.rank}</span>
                                    </div>

                                    {data.currentUser.image ? (
                                        <Image
                                            src={data.currentUser.image}
                                            alt={data.currentUser.name}
                                            width={40}
                                            height={40}
                                            className="rounded-full ring-2 ring-primary"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-primary/20 ring-2 ring-primary flex items-center justify-center">
                                            <Users className="h-5 w-5 text-primary" />
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <p className="font-medium text-primary">
                                            {data.currentUser.name}
                                            <span className="ml-2 text-xs">(Bạn)</span>
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {data.currentUser.examsCompleted} đề • {data.currentUser.avgScore.toFixed(1)} điểm TB
                                        </p>
                                    </div>

                                    <p className="text-lg font-bold text-primary">
                                        {getCategoryValue(data.currentUser)}
                                    </p>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
