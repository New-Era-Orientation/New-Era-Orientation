import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";
import { Prisma } from "@prisma/client";

// GET /api/settings - Get user settings
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Default settings if none exist
        const defaultSettings = {
            notifications: true,
            emailNotifications: false,
            soundEnabled: true,
            theme: "dark",
            language: "vi",
        };

        const userSettings = (user.settings as Record<string, unknown>) || {};

        const settings = { ...defaultSettings, ...userSettings };

        return NextResponse.json({ settings });
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT /api/settings - Update user settings
export async function PUT(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { notifications, emailNotifications, soundEnabled, theme, language } = body;

        const newSettings = {
            notifications: notifications ?? true,
            emailNotifications: emailNotifications ?? false,
            soundEnabled: soundEnabled ?? true,
            theme: theme ?? "dark",
            language: language ?? "vi",
        };

        await db.user.update({
            where: { id: session.user.id },
            data: {
                settings: newSettings as Prisma.InputJsonObject
            },
        });

        return NextResponse.json({
            success: true,
            settings: newSettings,
            message: "Cài đặt đã được lưu"
        });
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
