"use client";

import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Mail, Calendar, Award, TrendingUp, Clock, Target, Edit, Camera, X, Loader2, Check, User } from "lucide-react";
import { Card } from "@/client/components/ui/Card";
import { Badge } from "@/client/components/ui/Badge";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface ProfileData {
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
        bio: string | null;
        role: string;
        joinedDate: string;
    };
    stats: {
        examsCompleted: number;
        averageScore: number;
        studyTime: number;
        completedTopics: number;
        streak: number;
        longestStreak: number;
    };
    recentActivities: Array<{
        type: "exam" | "study" | "practice";
        title: string;
        date: string;
        score?: number;
        href: string;
    }>;
    achievements: Array<{
        id: string;
        title: string;
        description: string;
        icon: string;
        category: string;
        unlocked: boolean;
    }>;
}

export default function ProfilePage() {
    const { data: session } = useSession();
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        name: "",
        bio: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setProfileData(data);
                setEditForm({
                    name: data.user.name || "",
                    bio: data.user.bio || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });

            const data = await res.json();

            if (res.ok) {
                setNotification({ type: "success", message: "Đã cập nhật hồ sơ thành công!" });
                setShowEditModal(false);
                fetchProfile(); // Refresh data
            } else {
                setNotification({ type: "error", message: data.error || "Không thể cập nhật hồ sơ" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Đã xảy ra lỗi khi cập nhật" });
        } finally {
            setIsSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith("image/")) {
            setNotification({ type: "error", message: "Vui lòng chọn file ảnh" });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setNotification({ type: "error", message: "Ảnh không được lớn hơn 5MB" });
            return;
        }

        setIsUploadingImage(true);
        try {
            // Create form data
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload/avatar", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setNotification({ type: "success", message: "Đã cập nhật ảnh đại diện!" });
                fetchProfile();
            } else {
                const data = await res.json();
                setNotification({ type: "error", message: data.error || "Không thể tải ảnh lên" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Đã xảy ra lỗi khi tải ảnh" });
        } finally {
            setIsUploadingImage(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const stats = profileData?.stats ? [
        {
            label: "Đề thi đã làm",
            value: profileData.stats.examsCompleted.toString(),
            icon: Target,
            color: "text-primary",
            bgColor: "bg-primary/10"
        },
        {
            label: "Điểm trung bình",
            value: profileData.stats.averageScore.toFixed(1),
            icon: Award,
            color: "text-amber-400",
            bgColor: "bg-amber-500/10"
        },
        {
            label: "Thời gian học",
            value: `${profileData.stats.studyTime}m`,
            icon: Clock,
            color: "text-emerald-400",
            bgColor: "bg-emerald-500/10"
        },
        {
            label: "Chuỗi ngày",
            value: profileData.stats.streak.toString(),
            icon: TrendingUp,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10"
        },
    ] : [];

    const getActivityIcon = (type: string) => {
        switch(type) {
            case "exam": return Award;
            case "study": return Target;
            default: return Clock;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return "Vừa xong";
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    // Default achievements if none from API
    const defaultAchievements = [
        { id: "1", title: "Người mới", icon: "🎯", unlocked: true, description: "", category: "" },
        { id: "2", title: "Chăm chỉ", icon: "🔥", unlocked: true, description: "", category: "" },
        { id: "3", title: "Xuất sắc", icon: "⭐", unlocked: true, description: "", category: "" },
        { id: "4", title: "Bậc thầy", icon: "👑", unlocked: false, description: "", category: "" },
    ];

    const achievements = profileData?.achievements?.length ? profileData.achievements : defaultAchievements;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto p-6 lg:p-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    const user = profileData?.user || {
        name: session?.user?.name || "Học viên NEO",
        email: session?.user?.email || "student@neoedu.com",
        image: session?.user?.image || null,
        bio: "Đang học tập và chinh phục mọi kỳ thi!",
        role: "USER",
        joinedDate: new Date().toISOString(),
    };

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
                    notification.type === "success" 
                        ? "bg-emerald-500 text-white" 
                        : "bg-destructive text-destructive-foreground"
                }`}>
                    {notification.type === "success" ? (
                        <Check className="h-5 w-5" />
                    ) : (
                        <X className="h-5 w-5" />
                    )}
                    {notification.message}
                </div>
            )}

            <main className="container mx-auto p-6 lg:p-10">
                {/* Profile Header */}
                <section className="mb-10" aria-labelledby="profile-heading">
                    <Card className="p-8">
                        <div className="flex flex-col items-center gap-6 md:flex-row">
                            {/* Avatar */}
                            <div className="relative group">
                                {user.image ? (
                                    <img 
                                        src={user.image} 
                                        alt={user.name || "Avatar"} 
                                        className="h-28 w-28 rounded-full object-cover shadow-lg"
                                    />
                                ) : (
                                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-purple-600 text-4xl font-bold text-white shadow-lg shadow-primary/30">
                                        {(user.name || "U").charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingImage}
                                    className="absolute bottom-0 right-0 rounded-full bg-primary p-2.5 text-white shadow-md transition-colors duration-200 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50"
                                    aria-label="Thay đổi ảnh đại diện"
                                >
                                    {isUploadingImage ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" aria-hidden="true" />
                                    )}
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="flex-1 text-center md:text-left">
                                <div className="flex flex-col items-center gap-2 md:flex-row md:items-start">
                                    <h1 id="profile-heading" className="text-3xl font-bold text-foreground">{user.name}</h1>
                                    <Badge variant={user.role === "ADMIN" ? "error" : "primary"}>
                                        {user.role === "ADMIN" ? "Admin" : "Pro"}
                                    </Badge>
                                </div>
                                <p className="mt-2 text-muted-foreground">{user.bio || "Chưa có giới thiệu"}</p>
                                <div className="mt-4 flex flex-col gap-3 text-muted-foreground md:flex-row md:gap-6">
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <Mail className="h-4 w-4" aria-hidden="true" />
                                        <span>{user.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 md:justify-start">
                                        <Calendar className="h-4 w-4" aria-hidden="true" />
                                        <span>Tham gia {new Date(user.joinedDate).toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" })}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Edit Button */}
                            <button 
                                onClick={() => setShowEditModal(true)}
                                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-secondary"
                            >
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
                    <div className="flex items-center justify-between mb-6">
                        <h2 id="achievements-heading" className="text-2xl font-bold text-foreground">Thành tích</h2>
                        <Link href="/achievements" className="text-sm text-primary hover:underline">
                            Xem tất cả →
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {achievements.slice(0, 4).map((achievement) => (
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
                    <div className="flex items-center justify-between mb-6">
                        <h2 id="activity-heading" className="text-2xl font-bold text-foreground">Hoạt động gần đây</h2>
                        <Link href="/history" className="text-sm text-primary hover:underline">
                            Xem tất cả →
                        </Link>
                    </div>
                    <Card className="p-6">
                        {profileData?.recentActivities && profileData.recentActivities.length > 0 ? (
                            <ul className="space-y-4" role="list">
                                {profileData.recentActivities.map((activity, index) => {
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
                                                <Link href={activity.href} className="font-semibold text-foreground hover:text-primary transition-colors">
                                                    {activity.title}
                                                </Link>
                                                <p className="mt-1 text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                                            </div>
                                            {activity.score !== undefined && (
                                                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-emerald-400">
                                                    <span className="font-bold">{activity.score.toFixed(1)}</span>
                                                    <span className="text-sm opacity-75">/10</span>
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Chưa có hoạt động nào</p>
                                <Link href="/exam">
                                    <Button className="mt-4">Bắt đầu làm đề thi</Button>
                                </Link>
                            </div>
                        )}
                    </Card>
                </section>
            </main>

            {/* Edit Profile Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Chỉnh sửa hồ sơ</h2>
                            <button 
                                onClick={() => setShowEditModal(false)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                                    Tên hiển thị
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Nhập tên của bạn"
                                    required
                                    minLength={2}
                                    maxLength={50}
                                />
                            </div>

                            <div>
                                <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-2">
                                    Giới thiệu
                                </label>
                                <textarea
                                    id="bio"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                                    placeholder="Viết vài dòng về bản thân..."
                                    maxLength={200}
                                    rows={3}
                                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                />
                                <p className="mt-1 text-xs text-muted-foreground text-right">
                                    {editForm.bio.length}/200
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    variant="secondary" 
                                    className="flex-1"
                                    onClick={() => setShowEditModal(false)}
                                >
                                    Hủy
                                </Button>
                                <Button 
                                    type="submit" 
                                    className="flex-1"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Lưu thay đổi"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}
        </div>
    );
}
