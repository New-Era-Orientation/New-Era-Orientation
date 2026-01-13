"use client";

import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Mail, Calendar, Award, TrendingUp, Clock, Target, Edit, Camera } from "lucide-react";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";

export default function ProfilePage() {
    const user = {
        name: "Học viên NEO",
        email: "student@neoedu.com",
        joinedDate: "01/2026",
        level: "Pro",
        bio: "Đang học tập và chinh phục mọi kỳ thi!",
    };

    const stats = [
        {
            label: "Đề thi đã làm",
            value: "12",
            icon: Target,
            color: "text-primary",
            bgColor: "bg-primary/10"
        },
        {
            label: "Điểm trung bình",
            value: "8.5",
            icon: Award,
            color: "text-amber-400",
            bgColor: "bg-amber-500/10"
        },
        {
            label: "Thời gian học",
            value: "24h",
            icon: Clock,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10"
        },
        {
            label: "Tiến độ",
            value: "65%",
            icon: TrendingUp,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10"
        },
    ];

    const achievements = [
        { id: 1, title: "Người mới", icon: "🎯", unlocked: true },
        { id: 2, title: "Chăm chỉ", icon: "🔥", unlocked: true },
        { id: 3, title: "Xuất sắc", icon: "⭐", unlocked: true },
        { id: 4, title: "Bậc thầy", icon: "👑", unlocked: false },
    ];

    const recentActivity = [
        { title: "Hoàn thành đề thi HSG Ninh Bình", date: "2 giờ trước", score: "9.0", type: "exam" as const },
        { title: "Học xong chương Cấu trúc dữ liệu", date: "1 ngày trước", type: "study" as const },
        { title: "Làm bài Simulation - Thuật toán", date: "3 ngày trước", score: "8.5", type: "practice" as const },
    ];

    const getActivityIcon = (type: string) => {
        switch(type) {
            case "exam": return Award;
            case "study": return Target;
            default: return Clock;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Profile Header */}
                <section className="mb-10" aria-labelledby="profile-heading">
                    <Card className="p-8">
                        <div className="flex flex-col items-center gap-6 md:flex-row">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-4xl font-bold text-white shadow-lg shadow-primary/30">
                                    {user.name.charAt(0)}
                                </div>
                                <button 
                                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2.5 text-white shadow-md transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                    aria-label="Thay đổi ảnh đại diện"
                                >
                                    <Camera className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col items-center gap-2 md:flex-row md:items-start">
                                    <h1 id="profile-heading" className="text-3xl font-bold text-foreground">{user.name}</h1>
                                    <Badge variant="primary">{user.level}</Badge>
                                </div>
                                <p className="mt-2 text-muted-foreground">{user.bio}</p>
                                <div className="mt-4 flex flex-col gap-3 text-muted-foreground md:flex-row md:gap-6">
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <Mail className="h-4 w-4" aria-hidden="true" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <Calendar className="h-4 w-4" aria-hidden="true" />
                                        <span>Tham gia {user.joinedDate}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Button */}
                            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary">
                                <Edit className="h-4 w-4" aria-hidden="true" />
                                Chỉnh sửa hồ sơ
                            </button>
                        </div>
                    </Card>
                </section>

                {/* Stats */}
                <section className="mb-10" aria-labelledby="stats-heading">
                    <h2 id="stats-heading" className="mb-6 text-2xl font-bold text-foreground">Thống kê học tập</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" role="list">
                        {stats.map((stat, index) => (
                            <Card key={index} hover className="group p-6" role="listitem">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                                    </div>
                                    <div 
                                        className={`rounded-xl p-3 ${stat.bgColor} ${stat.color} transition-colors duration-200`}
                                        aria-hidden="true"
                                    >
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Achievements */}
                <section className="mb-10" aria-labelledby="achievements-heading">
                    <h2 id="achievements-heading" className="mb-6 text-2xl font-bold text-foreground">Thành tích</h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {achievements.map((achievement) => (
                            <Card 
                                key={achievement.id} 
                                className={`text-center p-6 ${!achievement.unlocked ? 'opacity-40' : ''}`}
                            >
                                <div className="mb-2 text-4xl">{achievement.icon}</div>
                                <p className="font-semibold text-foreground">{achievement.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    {achievement.unlocked ? 'Đã đạt được' : 'Chưa mở khóa'}
                                </p>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Recent Activity */}
                <section aria-labelledby="activity-heading">
                    <h2 id="activity-heading" className="mb-6 text-2xl font-bold text-foreground">Hoạt động gần đây</h2>
                    <Card className="p-6">
                        <ul className="space-y-4" role="list">
                            {recentActivity.map((activity, index) => {
                                const ActivityIcon = getActivityIcon(activity.type);
                                return (
                                    <li
                                        key={index}
                                        className="flex items-center gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
                                    >
                                        <div className="rounded-xl bg-primary/10 p-3 text-primary" aria-hidden="true">
                                            <ActivityIcon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">{activity.title}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground">{activity.date}</p>
                                        </div>
                                        {activity.score && (
                                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-emerald-400">
                                                <span className="font-bold">{activity.score}</span>
                                                <span className="text-sm opacity-75">/10</span>
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </Card>
                </section>
            </main>
        </div>
    );
}
