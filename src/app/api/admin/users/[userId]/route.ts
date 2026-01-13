import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET - Get user details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth();
    const { userId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: {
                        examAttempts: true,
                        progress: true,
                        achievements: true,
                        flashcardDecks: true,
                    },
                },
                examAttempts: {
                    take: 10,
                    orderBy: { startedAt: "desc" },
                    include: {
                        exam: { select: { title: true } },
                    },
                },
                streak: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error fetching user:", error);
        return NextResponse.json(
            { error: "Failed to fetch user" },
            { status: 500 }
        );
    }
}

// PUT - Update user
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth();
    const { userId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const { name, role } = await request.json();

        const updated = await db.user.update({
            where: { id: userId },
            data: {
                ...(name && { name }),
                ...(role && { role }),
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

// DELETE - Delete user
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    const session = await auth();
    const { userId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Prevent self-deletion
    if (userId === session.user.id) {
        return NextResponse.json(
            { error: "Cannot delete your own account" },
            { status: 400 }
        );
    }

    try {
        await db.user.delete({ where: { id: userId } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
