import { StatsGrid } from "@/client/components/dashboard/StatsGrid";
import { ActivityList } from "@/client/components/dashboard/ActivityList";
import { BookOpen, Target, Zap, ArrowRight, TrendingUp, Calendar, Flame } from "lucide-react";
import Link from "next/link";
import { cn } from "@/client/lib/utils";
import { Card, CardContent } from "@/client/components/ui/Card";

export default function DashboardPage() {
    // Mock user data - would come from auth context
    const user = {
        name: "Học viên",
        streak: 7,
        todayProgress: 65,
    };

    const quickActions = [
        {
            title: "Tiếp tục học",
            description: "Chương Cấu trúc dữ liệu",
            href: "/study",
            icon: BookOpen,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
            badge: "Đang học",
        },
        {
            title: "Làm đề thi",
            description: "12 đề thi mới",
            href: "/exam",
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
            badge: "Mới",
        },
        {
            title: "Luyện tập",
            description: "Simulation Mode",
            href: "/simulation",
            icon: Zap,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
            badge: null,
        },
    ];

    const upcomingTasks = [
        { title: "Hoàn thành chương 3", dueDate: "Hôm nay", priority: "high" },
        { title: "Làm đề thi thử #5", dueDate: "Ngày mai", priority: "medium" },
        { title: "Ôn tập thuật toán", dueDate: "3 ngày", priority: "low" },
    ];

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "high": return "bg-destructive/10 text-destructive border-destructive/20";
            case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            default: return "bg-primary/10 text-primary border-primary/20";
        }
    };

    return (
        <main className="container mx-auto p-6 lg:p-10 space-y-10">
            {/* Welcome Section with Streak */}
            <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between" aria-labelledby="welcome-heading">
                <div>
                    <h1 id="welcome-heading" className="text-3xl font-bold tracking-tight text-foreground">
                        Chào mừng trở lại, {user.name}! 👋
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Tiếp tục hành trình học tập của bạn
                    </p>
                </div>

                {/* Streak Badge */}
                <div className="flex items-center gap-4">
                    <Card className="flex items-center gap-3 px-4 py-3 border-orange-500/20 bg-orange-500/5">
                        <Flame className="h-6 w-6 text-orange-500" aria-hidden="true" />
                        <div>
                            <p className="text-sm font-medium text-orange-500">Chuỗi ngày học</p>
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{user.streak} ngày</p>
                        </div>
                    </Card>
                </div>
            </section>

            {/* Today's Progress Bar */}
            <section>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
                                <span className="font-semibold text-foreground">Tiến độ hôm nay</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{user.todayProgress}% hoàn thành</span>
                        </div>
                        <div
                            className="h-3 w-full overflow-hidden rounded-full bg-secondary"
                            role="progressbar"
                            aria-valuenow={user.todayProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Tiến độ hôm nay: ${user.todayProgress}%`}
                        >
                            <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${user.todayProgress}%` }}
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
            <section aria-labelledby="quick-actions-heading">
                <h2 id="quick-actions-heading" className="mb-6 text-2xl font-bold text-foreground">
                    Hành động nhanh
                </h2>
                <div className="grid gap-6 md:grid-cols-3">
                    {quickActions.map((action, index) => (
                        <Link
                            key={index}
                            href={action.href}
                            className="group block"
                        >
                            <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={cn("rounded-xl p-3 transition-colors", action.bg, action.color)}>
                                            <action.icon className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                        {action.badge && (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary">
                                                {action.badge}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="mb-2 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                        {action.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-4">{action.description}</p>

                                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-200">
                                        <span>Bắt đầu</span>
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Two Column Layout: Activity & Tasks */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Activity List - Takes 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-foreground">Hoạt động gần đây</h2>
                    <ActivityList />
                </div>

                {/* Upcoming Tasks */}
                <section aria-labelledby="tasks-heading" className="space-y-6">
                    <h2 id="tasks-heading" className="text-xl font-bold text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                        Nhiệm vụ sắp tới
                    </h2>
                    <Card>
                        <CardContent className="p-6">
                            <ul className="space-y-3">
                                {upcomingTasks.map((task, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center justify-between rounded-xl border bg-card/50 p-4 hover:bg-secondary/20 transition-colors"
                                    >
                                        <div>
                                            <h3 className="font-medium text-foreground">{task.title}</h3>
                                            <p className="text-sm text-muted-foreground">{task.dueDate}</p>
                                        </div>
                                        <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", getPriorityColor(task.priority))}>
                                            {task.priority === "high" ? "Ưu tiên" : task.priority === "medium" ? "Trung bình" : "Thấp"}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/study"
                                className="mt-4 block w-full text-center text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors"
                            >
                                Xem tất cả nhiệm vụ →
                            </Link>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </main>
    );
}
