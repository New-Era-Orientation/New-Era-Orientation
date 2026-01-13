"use client";

import { useEffect } from "react";

export function PWARegistration() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register service worker
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("SW registered:", registration.scope);
                    
                    // Check for updates
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    // New content available
                                    if (confirm("Có bản cập nhật mới! Tải lại trang?")) {
                                        window.location.reload();
                                    }
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error("SW registration failed:", error);
                });
        }
    }, []);

    return null;
}

// Hook for install prompt
export function useInstallPrompt() {
    useEffect(() => {
        let deferredPrompt: BeforeInstallPromptEvent | null = null;

        const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button after 30 seconds
            setTimeout(() => {
                if (deferredPrompt) {
                    showInstallBanner(deferredPrompt);
                }
            }, 30000);
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);
        };
    }, []);
}

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function showInstallBanner(deferredPrompt: BeforeInstallPromptEvent) {
    // Create banner element
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 z-50 animate-slide-up";
    banner.innerHTML = `
        <div class="flex items-center gap-3">
            <div class="flex-1">
                <p class="font-semibold">Cài đặt NEO-EDU</p>
                <p class="text-sm opacity-90">Truy cập nhanh hơn trên thiết bị</p>
            </div>
            <button id="pwa-install-btn" class="px-4 py-2 bg-white text-primary rounded-lg font-medium hover:bg-gray-100">
                Cài đặt
            </button>
            <button id="pwa-dismiss-btn" class="p-2 hover:bg-white/20 rounded">
                ✕
            </button>
        </div>
    `;

    document.body.appendChild(banner);

    // Install button click
    document.getElementById("pwa-install-btn")?.addEventListener("click", async () => {
        banner.remove();
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log("Install prompt outcome:", outcome);
    });

    // Dismiss button click
    document.getElementById("pwa-dismiss-btn")?.addEventListener("click", () => {
        banner.remove();
    });

    // Auto-hide after 10 seconds
    setTimeout(() => {
        banner.remove();
    }, 10000);
}

// Push notification permission
export async function requestNotificationPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
        console.log("This browser does not support notifications");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // Send subscription to server
        await fetch("/api/notifications/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(subscription)
        });

        return subscription;
    } catch (error) {
        console.error("Failed to subscribe to push:", error);
        return null;
    }
}
