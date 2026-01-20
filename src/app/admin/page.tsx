"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { Skeleton } from "@/client/components/ui/Skeleton";
import {
    Users,
    FileText,
    BookOpen,
    TrendingUp,
    Settings,
    Shield,
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    Plus,
    ChevronRight,
    Activity,
    RefreshCw,
} from "lucide-react";

interface AdminStats {
    overview: {
        totalUsers: number;
        totalExams: number;
        totalAttempts: number;
        totalTopics: number;
        averageScore: number;
    };
    recentUsers: Array<{
        id: string;
        name: string | null;
        email: string;
        image: string | null;
        role: string;
        createdAt: string;
    }>;
    recentAttempts: Array<{
        id: string;
        score: number | null;
        startedAt: string;
        completedAt: string | null;
        user: { name: string | null; email: string };
        exam: { title: string };
    }>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [canBecomeAdmin, setCanBecomeAdmin] = useState(false);
    const [promoting, setPromoting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    useEffect(() => {
        checkAdminAndFetch();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            if (!canBecomeAdmin) {
                fetchStats(true); // silent refresh
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [canBecomeAdmin]);

    const checkAdminAndFetch = async () => {
        try {
            // First check admin status
            const checkRes = await fetch("/api/admin/promote");
            if (checkRes.ok) {
                const checkData = await checkRes.json();
                if (checkData.canBecomeAdmin) {
                    setCanBecomeAdmin(true);
                    setLoading(false);
                    return;
                }
                if (!checkData.isAdmin) {
                    redirect("/dashboard");
                    return;
                }
            }

            // Fetch stats if user is admin
            await fetchStats();
        } catch (err) {
            setError("Failed to check admin status");
            setLoading(false);
        }
    };

    const promoteToAdmin = async () => {
        setPromoting(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/promote", { method: "POST" });
            const data = await res.json();

            if (res.ok) {
                setCanBecomeAdmin(false);
                await fetchStats();
            } else {
                // Show more detailed error
                if (res.status === 404) {
                    setError("Tài khoản chưa được đồng bộ. Vui lòng đăng xuất rồi đăng nhập lại.");
                } else {
                    setError(data.error || "Không thể nâng quyền Admin");
                }
            }
        } catch (err) {
            setError("Không thể kết nối đến server");
        } finally {
            setPromoting(false);
        }
    };

    const fetchStats = async (silent = false) => {
        try {
            const res = await fetch("/api/admin/stats");
            if (res.status === 403) {
                redirect("/dashboard");
                return;
            }
            if (res.ok) {
                setStats(await res.json());
                setLastUpdated(new Date());
            } else if (!silent) {
                setError("Failed to load stats");
            }
        } catch (err) {
            if (!silent) {
                setError("Failed to load stats");
            }
        } finally {
            setLoading(false);
        }
    };

    // Manual refresh handler
    const handleRefresh = async () => {
        setLoading(true);
        await fetchStats();
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const statCards: Array<{
        label: string;
        value: number | string;
        icon: typeof Users;
        color: string;
        href?: string;
        suffix?: string;
    }> = [
            {
                label: "Tổng người dùng",
                value: stats?.overview.totalUsers || 0,
                icon: Users,
                color: "blue",
                href: "/admin/users",
            },
            {
                label: "Đề thi",
                value: stats?.overview.totalExams || 0,
                icon: FileText,
                color: "green",
                href: "/admin/exams",
            },
            {
                label: "Lượt làm bài",
                value: stats?.overview.totalAttempts || 0,
                icon: Activity,
                color: "purple",
                href: "/admin/attempts",
            },
            {
                label: "Chủ đề học tập",
                value: stats?.overview.totalTopics || 0,
                icon: BookOpen,
                color: "orange",
                href: "/admin/content",
            },
            {
                label: "Điểm TB",
                value: stats?.overview.averageScore?.toFixed(1) || 0,
                icon: TrendingUp,
                color: "cyan",
                suffix: "/10",
            },
        ];

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; icon: string }> = {
            blue: {
                bg: "bg-blue-50 dark:bg-blue-900/20",
                text: "text-blue-600 dark:text-blue-400",
                icon: "text-blue-500",
            },
            green: {
                bg: "bg-green-50 dark:bg-green-900/20",
                text: "text-green-600 dark:text-green-400",
                icon: "text-green-500",
            },
            purple: {
                bg: "bg-purple-50 dark:bg-purple-900/20",
                text: "text-purple-600 dark:text-purple-400",
                icon: "text-purple-500",
            },
            orange: {
                bg: "bg-orange-50 dark:bg-orange-900/20",
                text: "text-orange-600 dark:text-orange-400",
                icon: "text-orange-500",
            },
            pink: {
                bg: "bg-pink-50 dark:bg-pink-900/20",
                text: "text-pink-600 dark:text-pink-400",
                icon: "text-pink-500",
            },
            cyan: {
                bg: "bg-cyan-50 dark:bg-cyan-900/20",
                text: "text-cyan-600 dark:text-cyan-400",
                icon: "text-cyan-500",
            },
        };
        return colors[color] || colors.blue;
    };

    if (canBecomeAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold mb-2">Trở thành Admin</h2>
                        <p className="text-gray-500 mb-6">
                            Chưa có admin nào trong hệ thống. Bạn có thể trở thành admin đầu tiên.
                        </p>
                        {error && (
                            <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm">
                                {error}
                            </div>
                        )}
                        <Button
                            onClick={promoteToAdmin}
                            disabled={promoting}
                            className="w-full"
                        >
                            {promoting ? "Đang xử lý..." : "Trở thành Admin"}
                        </Button>
                        <Link href="/api/auth/signout" className="block mt-4 text-sm text-blue-500 hover:underline">
                            Đăng xuất và đăng nhập lại
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-500">{error}</p>
                        <Button onClick={() => fetchStats()} className="mt-4">
                            Thử lại
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                                <p className="text-white/70">
                                    Quản lý hệ thống NEO-EDU
                                    {lastUpdated && (
                                        <span className="ml-2 text-xs">
                                            • Cập nhật: {lastUpdated.toLocaleTimeString("vi-VN")}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="border-white/20 text-white hover:bg-white/10"
                                onClick={handleRefresh}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Làm mới
                            </Button>
                            <Link href="/admin/settings">
                                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                    <Settings className="h-4 w-4 mr-2" />
                                    Cài đặt
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-10 w-10 rounded-lg mb-3" />
                                    <Skeleton className="h-6 w-16 mb-1" />
                                    <Skeleton className="h-4 w-20" />
                                </CardContent>
                            </Card>
                        ))
                        : statCards.map((stat) => {
                            const colors = getColorClasses(stat.color);
                            return (
                                <Card
                                    key={stat.label}
                                    className={`hover:shadow-lg transition-shadow ${stat.href ? "cursor-pointer" : ""
                                        }`}
                                >
                                    {stat.href ? (
                                        <Link href={stat.href}>
                                            <CardContent className="p-4">
                                                <div
                                                    className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3`}
                                                >
                                                    <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                                                </div>
                                                <p className={`text-2xl font-bold ${colors.text}`}>
                                                    {stat.value}
                                                    {stat.suffix && (
                                                        <span className="text-sm font-normal text-gray-400">
                                                            {stat.suffix}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {stat.label}
                                                </p>
                                            </CardContent>
                                        </Link>
                                    ) : (
                                        <CardContent className="p-4">
                                            <div
                                                className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center mb-3`}
                                            >
                                                <stat.icon className={`h-5 w-5 ${colors.icon}`} />
                                            </div>
                                            <p className={`text-2xl font-bold ${colors.text}`}>
                                                {stat.value}
                                                {stat.suffix && (
                                                    <span className="text-sm font-normal text-gray-400">
                                                        {stat.suffix}
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {stat.label}
                                            </p>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-blue-500" />
                                Người dùng mới
                            </CardTitle>
                            <Link href="/admin/users">
                                <Button variant="ghost" size="sm">
                                    Xem tất cả
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-32 mb-1" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats?.recentUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                                    {user.image ? (
                                                        <img
                                                            src={user.image}
                                                            alt=""
                                                            className="w-full h-full rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        user.name?.charAt(0) || "U"
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {user.name || "Chưa đặt tên"}
                                                    </p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge
                                                    variant={
                                                        user.role === "ADMIN"
                                                            ? "error"
                                                            : user.role === "TEACHER"
                                                                ? "primary"
                                                                : "default"
                                                    }
                                                >
                                                    {user.role}
                                                </Badge>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(user.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Attempts */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-purple-500" />
                                Lượt làm bài gần đây
                            </CardTitle>
                            <Link href="/admin/attempts">
                                <Button variant="ghost" size="sm">
                                    Xem tất cả
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded" />
                                            <div className="flex-1">
                                                <Skeleton className="h-4 w-48 mb-1" />
                                                <Skeleton className="h-3 w-32" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {stats?.recentAttempts.map((attempt) => (
                                        <div
                                            key={attempt.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-10 h-10 rounded flex items-center justify-center ${attempt.completedAt
                                                            ? "bg-green-100 dark:bg-green-900/30"
                                                            : "bg-yellow-100 dark:bg-yellow-900/30"
                                                        }`}
                                                >
                                                    {attempt.completedAt ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <Clock className="h-5 w-5 text-yellow-600" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                                        {attempt.exam.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {attempt.user.name || attempt.user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                {attempt.completedAt && attempt.score !== null ? (
                                                    <Badge
                                                        variant={
                                                            attempt.score >= 8
                                                                ? "success"
                                                                : attempt.score >= 5
                                                                    ? "warning"
                                                                    : "error"
                                                        }
                                                    >
                                                        {attempt.score.toFixed(1)}/10
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="info">Đang làm</Badge>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {formatDate(attempt.startedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Thao tác nhanh</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link href="/admin/exams/new">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <Plus className="h-5 w-5" />
                                    <span>Thêm đề thi</span>
                                </Button>
                            </Link>
                            <Link href="/admin/users">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <Users className="h-5 w-5" />
                                    <span>Quản lý người dùng</span>
                                </Button>
                            </Link>
                            <Link href="/admin/content">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <BookOpen className="h-5 w-5" />
                                    <span>Quản lý nội dung</span>
                                </Button>
                            </Link>
                            <Link href="/admin/reports">
                                <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    <span>Báo cáo thống kê</span>
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
