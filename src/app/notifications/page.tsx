"use client";

import { Card } from "@/client/components/ui/Card";
import { Bell, BellOff, Check, Trash2 } from "lucide-react";
import { Button } from "@/client/components/ui/Button";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "achievement";
    read: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNotifications() {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.notifications || []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchNotifications();
    }, [session]);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: "POST" });
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (error) {
            console.error("Failed to mark as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch("/api/notifications/read-all", { method: "POST" });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark all as read:", error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, { method: "DELETE" });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error("Failed to delete:", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const getTypeIcon = (type: Notification["type"]) => {
        switch (type) {
            case "success":
                return "✅";
            case "warning":
                return "⚠️";
            case "achievement":
                return "🏆";
            default:
                return "ℹ️";
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return "Vừa xong";
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        return date.toLocaleDateString("vi-VN");
    };

    if (!session?.user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Đăng nhập để xem thông báo</h2>
                    <p className="text-muted-foreground">
                        Bạn cần đăng nhập để xem các thông báo của mình.
                    </p>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Thông báo</h1>
                    {unreadCount > 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                            {unreadCount} mới
                        </span>
                    )}
                </div>
                {notifications.length > 0 && unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <Check className="h-4 w-4 mr-1" />
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                            <div className="h-3 bg-muted rounded w-1/2" />
                        </Card>
                    ))}
                </div>
            ) : notifications.length === 0 ? (
                <Card className="p-8 text-center">
                    <BellOff className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold mb-2">Chưa có thông báo</h2>
                    <p className="text-muted-foreground">
                        Các thông báo về hoạt động học tập sẽ xuất hiện ở đây.
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map(notification => (
                        <Card
                            key={notification.id}
                            className={`p-4 transition-colors ${
                                !notification.read ? "bg-primary/5 border-primary/20" : ""
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="text-2xl">
                                    {getTypeIcon(notification.type)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDate(notification.createdAt)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    {!notification.read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteNotification(notification.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
