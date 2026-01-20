import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

// GET - List all exams for admin
export async function GET(request: NextRequest) {
    const session = await auth();

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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const published = searchParams.get("published");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    try {
        const whereClause: Record<string, unknown> = {};

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { source: { contains: search, mode: "insensitive" } },
            ];
        }

        if (published !== null && published !== undefined && published !== "") {
            whereClause.published = published === "true";
        }

        const [exams, total] = await Promise.all([
            db.exam.findMany({
                where: whereClause,
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    description: true,
                    subject: true,
                    year: true,
                    source: true,
                    type: true,
                    duration: true,
                    published: true,
                    createdAt: true,
                    _count: {
                        select: { attempts: true, questions: true },
                    },
                },
                orderBy: { createdAt: "desc" },
                take: limit,
                skip: offset,
            }),
            db.exam.count({ where: whereClause }),
        ]);

        return NextResponse.json({
            exams,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + limit < total,
        });
    } catch (error) {
        console.error("Error fetching exams:", error);
        return NextResponse.json(
            { error: "Failed to fetch exams" },
            { status: 500 }
        );
    }
}

// POST - Create new exam
export async function POST(request: NextRequest) {
    const session = await auth();

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
        const { title, description, subject, year, source, type, duration, parts } = await request.json();

        // Generate slug
        const baseSlug = title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

        let slug = baseSlug;
        let counter = 1;
        while (await db.exam.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        const exam = await db.exam.create({
            data: {
                title,
                slug,
                description,
                subject,
                year: parseInt(year),
                source,
                type: type || "STANDARD",
                duration: parseInt(duration),
                parts,
                published: false,
            },
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error("Error creating exam:", error);
        return NextResponse.json(
            { error: "Failed to create exam" },
            { status: 500 }
        );
    }
}
