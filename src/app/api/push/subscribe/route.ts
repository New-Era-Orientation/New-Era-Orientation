import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// POST - Subscribe to push notifications
export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { subscription, preferences } = await req.json();

        if (!subscription?.endpoint || !subscription?.keys) {
            return NextResponse.json(
                { error: "Invalid subscription data" },
                { status: 400 }
            );
        }

        // Upsert push subscription
        await db.pushSubscription.upsert({
            where: {
                userId_endpoint: {
                    userId: session.user.id,
                    endpoint: subscription.endpoint,
                },
            },
            update: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                preferences: preferences || {},
                updatedAt: new Date(),
            },
            create: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                preferences: preferences || {
                    studyReminders: true,
                    achievements: true,
                    examNotifications: true,
                    flashcardReminders: true,
                    streakWarnings: true,
                    leaderboardUpdates: false,
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Push subscription error:", error);
        return NextResponse.json(
            { error: "Failed to save subscription" },
            { status: 500 }
        );
    }
}

// GET - Get current subscription status
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const subscriptions = await db.pushSubscription.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                endpoint: true,
                preferences: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            subscribed: subscriptions.length > 0,
            subscriptions: subscriptions.map(s => ({
                id: s.id,
                endpointHash: Buffer.from(s.endpoint).toString("base64").slice(0, 20),
                preferences: s.preferences,
                createdAt: s.createdAt,
            })),
        });
    } catch (error) {
        console.error("Get subscription error:", error);
        return NextResponse.json(
            { error: "Failed to get subscription status" },
            { status: 500 }
        );
    }
}

// DELETE - Unsubscribe from push notifications
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { endpoint } = await req.json();

        if (endpoint) {
            // Delete specific subscription
            await db.pushSubscription.deleteMany({
                where: {
                    userId: session.user.id,
                    endpoint,
                },
            });
        } else {
            // Delete all subscriptions for user
            await db.pushSubscription.deleteMany({
                where: { userId: session.user.id },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        return NextResponse.json(
            { error: "Failed to unsubscribe" },
            { status: 500 }
        );
    }
}

// PATCH - Update notification preferences
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { preferences } = await req.json();

        await db.pushSubscription.updateMany({
            where: { userId: session.user.id },
            data: { preferences },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update preferences error:", error);
        return NextResponse.json(
            { error: "Failed to update preferences" },
            { status: 500 }
        );
    }
}
