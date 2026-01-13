"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { ProgressRing } from "@/client/components/ui/ProgressRing";
import {
    Trophy, Star, Zap, BookOpen, Target, Users,
    Flame, Crown, Lock, CheckCircle, Loader2
} from "lucide-react";

interface Achievement {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    rarity: string;
    secret: boolean;
    unlocked: boolean;
    unlockedAt: string | null;
    progress: number;
}

interface UserStats {
    totalPoints: number;
    unlockedCount: number;
    totalAchievements: number;
    currentStreak: number;
    longestStreak: number;
}

const categoryInfo: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    LEARNING: { label: "Học tập", icon: BookOpen, color: "text-blue-500" },
    EXAM: { label: "Thi cử", icon: Target, color: "text-green-500" },
    STREAK: { label: "Streak", icon: Flame, color: "text-orange-500" },
    SOCIAL: { label: "Cộng đồng", icon: Users, color: "text-purple-500" },
    SPECIAL: { label: "Đặc biệt", icon: Star, color: "text-yellow-500" },
};

const rarityColors: Record<string, { bg: string; border: string; text: string }> = {
    COMMON: { bg: "bg-gray-100 dark:bg-gray-800", border: "border-gray-300", text: "text-gray-600" },
    UNCOMMON: { bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-400", text: "text-green-600" },
    RARE: { bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-400", text: "text-blue-600" },
    EPIC: { bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-400", text: "text-purple-600" },
    LEGENDARY: { bg: "bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20", border: "border-yellow-400", text: "text-yellow-600" },
};

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showUnlocked, setShowUnlocked] = useState<boolean | null>(null);

    useEffect(() => {
        async function loadAchievements() {
            try {
                const response = await fetch("/api/achievements");
                const data = await response.json();
                setAchievements(data.achievements || []);
                setStats(data.stats);
            } catch (error) {
                console.error("Failed to load achievements:", error);
            } finally {
                setLoading(false);
            }
        }
        loadAchievements();
    }, []);

    const filteredAchievements = achievements.filter(a => {
        if (selectedCategory && a.category !== selectedCategory) return false;
        if (showUnlocked === true && !a.unlocked) return false;
        if (showUnlocked === false && a.unlocked) return false;
        return true;
    });

    const groupedByCategory = filteredAchievements.reduce((acc, achievement) => {
        if (!acc[achievement.category]) {
            acc[achievement.category] = [];
        }
        acc[achievement.category].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                        <h1 className="text-4xl font-bold text-foreground">Thành tựu</h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Thu thập thành tựu và chứng minh khả năng của bạn
                    </p>
                </section>

                {/* Stats Cards */}
                {stats && (
                    <section className="mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                                        <Star className="h-6 w-6 text-yellow-500" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.totalPoints}</p>
                                <p className="text-sm text-muted-foreground">Điểm tích lũy</p>
                            </Card>
                            
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                    {stats.unlockedCount}/{stats.totalAchievements}
                                </p>
                                <p className="text-sm text-muted-foreground">Đã mở khóa</p>
                            </Card>
                            
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
                                        <Flame className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.currentStreak}</p>
                                <p className="text-sm text-muted-foreground">Streak hiện tại</p>
                            </Card>
                            
                            <Card className="p-4 text-center">
                                <div className="flex justify-center mb-2">
                                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                        <Crown className="h-6 w-6 text-purple-500" />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{stats.longestStreak}</p>
                                <p className="text-sm text-muted-foreground">Streak cao nhất</p>
                            </Card>
                        </div>
                    </section>
                )}

                {/* Progress Overview */}
                {stats && (
                    <section className="mb-8">
                        <Card className="p-6">
                            <div className="flex items-center gap-6">
                                <ProgressRing 
                                    progress={(stats.unlockedCount / stats.totalAchievements) * 100} 
                                    size="lg"
                                    strokeWidth={8}
                                />
                                <div>
                                    <h3 className="text-xl font-semibold text-foreground">Tiến độ thành tựu</h3>
                                    <p className="text-muted-foreground">
                                        Bạn đã mở khóa {stats.unlockedCount} trong tổng số {stats.totalAchievements} thành tựu
                                    </p>
                                    <div className="mt-2 flex gap-2">
                                        {Object.entries(rarityColors).map(([rarity, colors]) => {
                                            const count = achievements.filter(a => a.rarity === rarity && a.unlocked).length;
                                            if (count === 0) return null;
                                            return (
                                                <Badge key={rarity} variant="info" className={`${colors.bg} ${colors.text}`}>
                                                    {count} {rarity.toLowerCase()}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>
                )}

                {/* Filters */}
                <section className="mb-6">
                    <div className="flex flex-wrap gap-3">
                        {/* Category filters */}
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedCategory === null
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                            }`}
                        >
                            Tất cả
                        </button>
                        {Object.entries(categoryInfo).map(([key, { label, icon: Icon, color }]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedCategory(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    selectedCategory === key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                                }`}
                            >
                                <Icon className={`h-4 w-4 ${selectedCategory === key ? "" : color}`} />
                                {label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Status filter */}
                    <div className="flex gap-2 mt-3">
                        <button
                            onClick={() => setShowUnlocked(null)}
                            className={`px-3 py-1 rounded-md text-sm ${
                                showUnlocked === null ? "bg-primary/20 text-primary" : "text-muted-foreground"
                            }`}
                        >
                            Tất cả
                        </button>
                        <button
                            onClick={() => setShowUnlocked(true)}
                            className={`px-3 py-1 rounded-md text-sm ${
                                showUnlocked === true ? "bg-green-500/20 text-green-600" : "text-muted-foreground"
                            }`}
                        >
                            Đã mở khóa
                        </button>
                        <button
                            onClick={() => setShowUnlocked(false)}
                            className={`px-3 py-1 rounded-md text-sm ${
                                showUnlocked === false ? "bg-gray-500/20 text-gray-600" : "text-muted-foreground"
                            }`}
                        >
                            Chưa mở
                        </button>
                    </div>
                </section>

                {/* Achievement Grid */}
                {Object.entries(groupedByCategory).map(([category, categoryAchievements]) => {
                    const info = categoryInfo[category] || { label: category, icon: Star, color: "text-gray-500" };
                    const CategoryIcon = info.icon;
                    
                    return (
                        <section key={category} className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <CategoryIcon className={`h-5 w-5 ${info.color}`} />
                                <h2 className="text-xl font-semibold text-foreground">{info.label}</h2>
                                <Badge variant="info">{categoryAchievements.length}</Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryAchievements.map((achievement) => {
                                    const rarity = rarityColors[achievement.rarity] || rarityColors.COMMON;
                                    
                                    return (
                                        <Card
                                            key={achievement.id}
                                            className={`p-4 transition-all ${rarity.bg} border-2 ${
                                                achievement.unlocked ? rarity.border : "border-gray-200 dark:border-gray-700"
                                            } ${!achievement.unlocked ? "opacity-60" : ""}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`text-4xl ${!achievement.unlocked ? "grayscale" : ""}`}>
                                                    {achievement.secret && !achievement.unlocked ? "❓" : achievement.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-foreground">
                                                            {achievement.secret && !achievement.unlocked 
                                                                ? "???" 
                                                                : achievement.name}
                                                        </h3>
                                                        {achievement.unlocked && (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {achievement.secret && !achievement.unlocked 
                                                            ? "Thành tựu bí ẩn" 
                                                            : achievement.description}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="success" className="text-xs">
                                                            <Zap className="h-3 w-3 mr-1" />
                                                            {achievement.points} điểm
                                                        </Badge>
                                                        <Badge 
                                                            variant="info" 
                                                            className={`text-xs ${rarity.text}`}
                                                        >
                                                            {achievement.rarity.toLowerCase()}
                                                        </Badge>
                                                    </div>
                                                    
                                                    {!achievement.unlocked && achievement.progress > 0 && (
                                                        <div className="mt-3">
                                                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                                                <span>Tiến độ</span>
                                                                <span>{Math.round(achievement.progress)}%</span>
                                                            </div>
                                                            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-primary rounded-full transition-all"
                                                                    style={{ width: `${achievement.progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {achievement.unlocked && achievement.unlockedAt && (
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            Mở khóa: {new Date(achievement.unlockedAt).toLocaleDateString("vi-VN")}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                {!achievement.unlocked && (
                                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>
                    );
                })}

                {filteredAchievements.length === 0 && (
                    <Card className="p-12 text-center">
                        <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-foreground">Không có thành tựu nào</h3>
                        <p className="text-muted-foreground">Hãy thử thay đổi bộ lọc</p>
                    </Card>
                )}
            </main>
        </div>
    );
}
