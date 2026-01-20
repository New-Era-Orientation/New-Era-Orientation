import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

// GET - List all users
export async function GET(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin
    const currentUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
    });

    if (currentUser?.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    try {
        const whereClause: Record<string, unknown> = {};

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (role) {
            whereClause.role = role;
        }

        const [users, total] = await Promise.all([
            db.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    role: true,
                    createdAt: true,
                    _count: {
                        select: {
                            examAttempts: true,
                            progress: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.user.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            users,
            total,
            hasMore: offset + limit < total,
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}
