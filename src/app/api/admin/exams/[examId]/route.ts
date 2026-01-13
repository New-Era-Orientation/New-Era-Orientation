import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

interface RouteParams {
    params: Promise<{ examId: string }>;
}

// GET - Get single exam details
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { examId } = await params;

    try {
        const exam = await db.exam.findUnique({
            where: { id: examId },
            include: {
                questions: {
                    include: {
                        question: {
                            include: {
                                subQuestions: true,
                            },
                        },
                    },
                    orderBy: [{ partNumber: 'asc' }, { order: 'asc' }],
                },
                _count: {
                    select: { attempts: true },
                },
            },
        });

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error("Error fetching exam:", error);
        return NextResponse.json(
            { error: "Failed to fetch exam" },
            { status: 500 }
        );
    }
}

// PATCH - Update exam
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { examId } = await params;

    try {
        const updates = await request.json();

        // Remove fields that shouldn't be directly updated
        const { id, createdAt, updatedAt, questions, _count, ...validUpdates } = updates;

        const exam = await db.exam.update({
            where: { id: examId },
            data: validUpdates,
        });

        return NextResponse.json(exam);
    } catch (error) {
        console.error("Error updating exam:", error);
        return NextResponse.json(
            { error: "Failed to update exam" },
            { status: 500 }
        );
    }
}

// DELETE - Delete exam
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { examId } = await params;

    try {
        // Check if exam exists
        const exam = await db.exam.findUnique({
            where: { id: examId },
            include: {
                _count: {
                    select: { attempts: true },
                },
            },
        });

        if (!exam) {
            return NextResponse.json({ error: "Exam not found" }, { status: 404 });
        }

        // Warn if exam has attempts
        if (exam._count.attempts > 0) {
            // Still allow deletion, but log it
            console.warn(`Deleting exam ${examId} with ${exam._count.attempts} attempts`);
        }

        // Delete exam (cascade will handle related records)
        await db.exam.delete({
            where: { id: examId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting exam:", error);
        return NextResponse.json(
            { error: "Failed to delete exam" },
            { status: 500 }
        );
    }
}
