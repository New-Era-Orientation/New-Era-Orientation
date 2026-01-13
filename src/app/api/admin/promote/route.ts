import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// POST - Promote current user to admin (only if no admin exists)
export async function POST() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if any admin already exists
        const existingAdmin = await db.user.findFirst({
            where: { role: "ADMIN" },
        });

        if (existingAdmin) {
            return NextResponse.json(
                { error: "An admin already exists. Contact existing admin for promotion." },
                { status: 403 }
            );
        }

        // Find or create user
        let user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user && session.user.email) {
            // Try to find by email
            user = await db.user.findUnique({
                where: { email: session.user.email },
            });
        }

        if (!user) {
            return NextResponse.json(
                { error: "User not found in database. Please log out and log in again." },
                { status: 404 }
            );
        }

        // Promote to admin
        const updated = await db.user.update({
            where: { id: user.id },
            data: { role: "ADMIN" },
        });

        return NextResponse.json({
            success: true,
            message: `User ${updated.email} has been promoted to ADMIN`,
            user: {
                id: updated.id,
                email: updated.email,
                name: updated.name,
                role: updated.role,
            },
        });
    } catch (error) {
        console.error("Error promoting to admin:", error);
        return NextResponse.json(
            { error: "Failed to promote user" },
            { status: 500 }
        );
    }
}

// GET - Check if current user is admin
export async function GET() {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });

        const hasAnyAdmin = await db.user.findFirst({
            where: { role: "ADMIN" },
            select: { id: true },
        });

        return NextResponse.json({
            isAdmin: user?.role === "ADMIN",
            canBecomeAdmin: !hasAnyAdmin,
        });
    } catch (error) {
        console.error("Error checking admin status:", error);
        return NextResponse.json(
            { error: "Failed to check admin status" },
            { status: 500 }
        );
    }
}
