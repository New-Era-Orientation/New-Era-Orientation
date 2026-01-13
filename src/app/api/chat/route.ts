import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// GET - List all conversations for user
export async function GET() {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const conversations = await db.chatConversation.findMany({
            where: { userId: session.user.id },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { updatedAt: "desc" },
        });

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversations" },
            { status: 500 }
        );
    }
}

// POST - Create new conversation
export async function POST(request: NextRequest) {
    const session = await auth();
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, context } = await request.json();

        const conversation = await db.chatConversation.create({
            data: {
                userId: session.user.id,
                title: title || "Cuộc trò chuyện mới",
                context,
            },
        });

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Error creating conversation:", error);
        return NextResponse.json(
            { error: "Failed to create conversation" },
            { status: 500 }
        );
    }
}
