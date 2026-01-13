import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// GET /api/flashcards/[deckId] - Lấy deck với cards
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await auth();
        const userId = session?.user?.id;
        
        const deck = await db.flashcardDeck.findUnique({
            where: { id: deckId },
            include: {
                cards: {
                    orderBy: { createdAt: "asc" },
                    include: userId ? {
                        reviews: {
                            where: { userId },
                            take: 1
                        }
                    } : undefined
                },
                user: { select: { name: true, image: true } }
            }
        });

        if (!deck) {
            return NextResponse.json({ error: "Deck not found" }, { status: 404 });
        }

        // Check access
        if (!deck.isPublic && deck.userId !== userId) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Type for cards with reviews
        type CardWithReviews = typeof deck.cards[number] & {
            reviews?: { nextReview: Date }[];
        };

        // Calculate cards due for review
        const now = new Date();
        const cardsDue = (deck.cards as CardWithReviews[]).filter(card => {
            const review = card.reviews?.[0];
            if (!review) return true; // Never reviewed
            return new Date(review.nextReview) <= now;
        }).length;

        return NextResponse.json({
            deck: {
                id: deck.id,
                name: deck.name,
                description: deck.description,
                isPublic: deck.isPublic,
                owner: deck.user,
                isOwner: deck.userId === userId,
                cardCount: deck.cards.length,
                cardsDue
            },
            cards: (deck.cards as CardWithReviews[]).map(card => ({
                id: card.id,
                front: card.front,
                back: card.back,
                review: card.reviews?.[0] || null
            }))
        });

    } catch (error) {
        console.error("Failed to fetch flashcard deck:", error);
        return NextResponse.json(
            { error: "Failed to fetch flashcard deck" },
            { status: 500 }
        );
    }
}

// PUT /api/flashcards/[deckId] - Cập nhật deck
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deck = await db.flashcardDeck.findUnique({
            where: { id: deckId }
        });

        if (!deck || deck.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
        }

        const body = await request.json();
        const { name, description, isPublic } = body;

        const updated = await db.flashcardDeck.update({
            where: { id: deckId },
            data: {
                name: name ?? deck.name,
                description: description ?? deck.description,
                isPublic: isPublic ?? deck.isPublic
            }
        });

        return NextResponse.json({ success: true, deck: updated });

    } catch (error) {
        console.error("Failed to update flashcard deck:", error);
        return NextResponse.json(
            { error: "Failed to update flashcard deck" },
            { status: 500 }
        );
    }
}

// DELETE /api/flashcards/[deckId] - Xóa deck
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const deck = await db.flashcardDeck.findUnique({
            where: { id: deckId }
        });

        if (!deck || deck.userId !== session.user.id) {
            return NextResponse.json({ error: "Not found or not owner" }, { status: 404 });
        }

        await db.flashcardDeck.delete({ where: { id: deckId } });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Failed to delete flashcard deck:", error);
        return NextResponse.json(
            { error: "Failed to delete flashcard deck" },
            { status: 500 }
        );
    }
}
