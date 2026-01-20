// Push Notification Service for PWA

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export class PushNotificationService {
    private static instance: PushNotificationService;
    private registration: ServiceWorkerRegistration | null = null;
    private subscription: PushSubscription | null = null;

    private constructor() {}

    static getInstance(): PushNotificationService {
        if (!PushNotificationService.instance) {
            PushNotificationService.instance = new PushNotificationService();
        }
        return PushNotificationService.instance;
    }

    // Check if push notifications are supported
    isSupported(): boolean {
        return (
            typeof window !== "undefined" &&
            "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window
        );
    }

    // Get current permission status
    getPermissionStatus(): NotificationPermission | "unsupported" {
        if (!this.isSupported()) return "unsupported";
        return Notification.permission;
    }

    // Request notification permission
    async requestPermission(): Promise<NotificationPermission> {
        if (!this.isSupported()) {
            throw new Error("Push notifications are not supported");
        }
        return await Notification.requestPermission();
    }

    // Initialize service worker registration
    async init(): Promise<void> {
        if (!this.isSupported()) return;

        try {
            this.registration = await navigator.serviceWorker.ready;
        } catch (error) {
            console.error("Service worker registration failed:", error);
        }
    }

    // Subscribe to push notifications
    async subscribe(): Promise<PushSubscriptionData | null> {
        if (!this.registration) {
            await this.init();
        }

        if (!this.registration) {
            throw new Error("Service worker not ready");
        }

        const permission = await this.requestPermission();
        if (permission !== "granted") {
            throw new Error("Notification permission denied");
        }

        try {
            // Check for existing subscription
            this.subscription = await this.registration.pushManager.getSubscription();

            if (!this.subscription) {
                // Create new subscription
                this.subscription = await this.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                });
            }

            const subscriptionJson = this.subscription.toJSON();
            
            if (!subscriptionJson.endpoint || !subscriptionJson.keys) {
                throw new Error("Invalid subscription data");
            }

            return {
                endpoint: subscriptionJson.endpoint,
                keys: {
                    p256dh: subscriptionJson.keys.p256dh || "",
                    auth: subscriptionJson.keys.auth || "",
                },
            };
        } catch (error) {
            console.error("Push subscription failed:", error);
            throw error;
        }
    }

    // Unsubscribe from push notifications
    async unsubscribe(): Promise<boolean> {
        if (!this.subscription) {
            this.subscription = await this.registration?.pushManager.getSubscription() || null;
        }

        if (this.subscription) {
            const result = await this.subscription.unsubscribe();
            this.subscription = null;
            return result;
        }

        return false;
    }

    // Check if currently subscribed
    async isSubscribed(): Promise<boolean> {
        if (!this.registration) {
            await this.init();
        }

        if (!this.registration) return false;

        const subscription = await this.registration.pushManager.getSubscription();
        return subscription !== null;
    }

    // Show a local notification (for testing)
    async showLocalNotification(
        title: string,
        options?: NotificationOptions
    ): Promise<void> {
        if (!this.registration) {
            await this.init();
        }

        if (!this.registration) {
            throw new Error("Service worker not ready");
        }

        const permission = await this.requestPermission();
        if (permission !== "granted") {
            throw new Error("Notification permission denied");
        }

        await this.registration.showNotification(title, {
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-72x72.png",
            data: {
                dateOfArrival: Date.now(),
            },
            ...options,
        });
    }

    // Helper: Convert base64 to Uint8Array for VAPID key
    private urlBase64ToUint8Array(base64String: string): ArrayBuffer {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray.buffer as ArrayBuffer;
    }
}

// Notification types for the app
export type NotificationType = 
    | "study_reminder"
    | "achievement_unlocked"
    | "exam_available"
    | "streak_warning"
    | "leaderboard_update";

export interface AppNotification {
    type: NotificationType;
    title: string;
    body: string;
    icon?: string;
    data?: Record<string, unknown>;
    url?: string;
}

// Notification templates
export const NotificationTemplates: Record<NotificationType, (data: Record<string, unknown>) => AppNotification> = {
    study_reminder: (data) => ({
        type: "study_reminder",
        title: "📚 Đến giờ học rồi!",
        body: data.message as string || "Hãy dành 15 phút để ôn bài nhé!",
        url: "/study",
    }),
    
    achievement_unlocked: (data) => ({
        type: "achievement_unlocked",
        title: "🏆 Thành tựu mới!",
        body: `Bạn đã mở khóa "${data.name}"!`,
        url: "/achievements",
    }),
    
    exam_available: (data) => ({
        type: "exam_available",
        title: "📝 Đề thi mới",
        body: `Đề thi "${data.examName}" đã sẵn sàng!`,
        url: `/exam/${data.examSlug}`,
    }),
    
    streak_warning: (data) => ({
        type: "streak_warning",
        title: "🔥 Giữ streak!",
        body: `Streak ${data.days} ngày sắp mất! Học ngay thôi!`,
        url: "/dashboard",
    }),
    
    leaderboard_update: (data) => ({
        type: "leaderboard_update",
        title: "📊 Cập nhật xếp hạng",
        body: `Bạn đang ở vị trí #${data.rank} trên bảng xếp hạng!`,
        url: "/leaderboard",
    }),
};
