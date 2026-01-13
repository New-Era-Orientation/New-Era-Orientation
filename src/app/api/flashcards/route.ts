import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/flashcards - Lấy danh sách decks
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includePublic = searchParams.get("public") === "true";

        const where = includePublic
            ? { OR: [{ userId: session.user.id }, { isPublic: true }] }
            : { userId: session.user.id };

        const decks = await db.flashcardDeck.findMany({
            where,
            include: {
                _count: { select: { cards: true } },
                user: { select: { name: true, image: true } }
            },
            orderBy: { updatedAt: "desc" }
        });

        // Get review stats for user's decks
        const deckIds = decks.map(d => d.id);
        const reviewStats = await db.flashcardReview.groupBy({
            by: ["flashcardId"],
            where: {
                userId: session.user.id,
                flashcard: { deckId: { in: deckIds } }
            },
            _count: true
        });

        const data = decks.map(deck => ({
            id: deck.id,
            name: deck.name,
            description: deck.description,
            isPublic: deck.isPublic,
            cardCount: deck._count.cards,
            owner: deck.user,
            isOwner: deck.userId === session.user.id,
            createdAt: deck.createdAt,
            updatedAt: deck.updatedAt
        }));

        return NextResponse.json({ decks: data });

    } catch (error) {
        console.error("Failed to fetch flashcard decks:", error);
        return NextResponse.json(
            { error: "Failed to fetch flashcard decks" },
            { status: 500 }
        );
    }
}

// POST /api/flashcards - Tạo deck mới
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, description, isPublic, cards } = body;

        if (!name) {
            return NextResponse.json(
                { error: "Name is required" },
                { status: 400 }
            );
        }

        const deck = await db.flashcardDeck.create({
            data: {
                userId: session.user.id,
                name,
                description: description || null,
                isPublic: isPublic || false,
                cards: cards ? {
                    create: cards.map((card: { front: string; back: string }) => ({
                        front: card.front,
                        back: card.back
                    }))
                } : undefined
            },
            include: {
                _count: { select: { cards: true } }
            }
        });

        return NextResponse.json({
            success: true,
            deck: {
                id: deck.id,
                name: deck.name,
                cardCount: deck._count.cards
            }
        });

    } catch (error) {
        console.error("Failed to create flashcard deck:", error);
        return NextResponse.json(
            { error: "Failed to create flashcard deck" },
            { status: 500 }
        );
    }
}
