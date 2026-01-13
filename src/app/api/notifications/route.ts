import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/notifications - Lấy danh sách notifications
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const unreadOnly = searchParams.get("unread") === "true";
        const limit = parseInt(searchParams.get("limit") || "20");

        const where = {
            userId: session.user.id,
            ...(unreadOnly ? { read: false } : {})
        };

        const [notifications, unreadCount] = await Promise.all([
            db.notification.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: limit
            }),
            db.notification.count({
                where: { userId: session.user.id, read: false }
            })
        ]);

        return NextResponse.json({
            notifications,
            unreadCount
        });

    } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// PATCH /api/notifications - Đánh dấu đã đọc
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notificationIds, markAll } = body;

        if (markAll) {
            await db.notification.updateMany({
                where: { userId: session.user.id, read: false },
                data: { read: true }
            });
        } else if (notificationIds && notificationIds.length > 0) {
            await db.notification.updateMany({
                where: {
                    id: { in: notificationIds },
                    userId: session.user.id
                },
                data: { read: true }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to update notifications:", error);
        return NextResponse.json(
            { error: "Failed to update notifications" },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications - Xóa notifications
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const notificationId = searchParams.get("id");

        if (notificationId) {
            await db.notification.delete({
                where: { id: notificationId, userId: session.user.id }
            });
        } else {
            // Delete all read notifications older than 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            await db.notification.deleteMany({
                where: {
                    userId: session.user.id,
                    read: true,
                    createdAt: { lt: thirtyDaysAgo }
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to delete notifications:", error);
        return NextResponse.json(
            { error: "Failed to delete notifications" },
            { status: 500 }
        );
    }
}
