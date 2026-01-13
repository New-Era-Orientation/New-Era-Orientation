import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { auth } from "@/server/auth";

// SM-2 Algorithm for Spaced Repetition
function calculateNextReview(
    quality: number, // 0-5 rating (0-2 fail, 3-5 pass)
    prevEaseFactor: number,
    prevInterval: number,
    prevRepetitions: number
): { easeFactor: number; interval: number; repetitions: number; nextReview: Date } {
    let easeFactor = prevEaseFactor;
    let interval = prevInterval;
    let repetitions = prevRepetitions;

    if (quality < 3) {
        // Failed - reset
        repetitions = 0;
        interval = 1;
    } else {
        // Passed
        if (repetitions === 0) {
            interval = 1;
        } else if (repetitions === 1) {
            interval = 6;
        } else {
            interval = Math.round(prevInterval * prevEaseFactor);
        }
        repetitions++;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    return { easeFactor, interval, repetitions, nextReview };
}

// POST /api/flashcards/[deckId]/review - Submit review
export async function POST(
    request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { cardId, quality } = body; // quality: 0-5

        if (quality === undefined || quality < 0 || quality > 5) {
            return NextResponse.json(
                { error: "Quality must be 0-5" },
                { status: 400 }
            );
        }

        // Verify card belongs to deck
        const card = await db.flashcard.findFirst({
            where: { id: cardId, deckId },
            include: {
                reviews: {
                    where: { userId: session.user.id },
                    take: 1
                }
            }
        });

        if (!card) {
            return NextResponse.json({ error: "Card not found" }, { status: 404 });
        }

        const existingReview = card.reviews[0];
        const prevEaseFactor = existingReview?.easeFactor ?? 2.5;
        const prevInterval = existingReview?.interval ?? 0;
        const prevRepetitions = existingReview?.repetitions ?? 0;

        const { easeFactor, interval, repetitions, nextReview } = calculateNextReview(
            quality,
            prevEaseFactor,
            prevInterval,
            prevRepetitions
        );

        // Upsert review
        const review = await db.flashcardReview.upsert({
            where: {
                userId_flashcardId: {
                    userId: session.user.id,
                    flashcardId: cardId
                }
            },
            update: {
                easeFactor,
                interval,
                repetitions,
                nextReview
            },
            create: {
                userId: session.user.id,
                flashcardId: cardId,
                easeFactor,
                interval,
                repetitions,
                nextReview
            }
        });

        return NextResponse.json({
            success: true,
            review: {
                nextReview: review.nextReview,
                interval: review.interval,
                repetitions: review.repetitions
            }
        });

    } catch (error) {
        console.error("Failed to submit review:", error);
        return NextResponse.json(
            { error: "Failed to submit review" },
            { status: 500 }
        );
    }
}

// GET /api/flashcards/[deckId]/review - Get cards due for review
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ deckId: string }> }
) {
    try {
        const { deckId } = await params;
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const now = new Date();

        // Get deck cards with review status
        const cards = await db.flashcard.findMany({
            where: { deckId },
            include: {
                reviews: {
                    where: { userId: session.user.id },
                    take: 1
                }
            }
        });

        // Filter cards due for review
        const dueCards = cards
            .filter(card => {
                const review = card.reviews[0];
                if (!review) return true; // Never reviewed
                return new Date(review.nextReview) <= now;
            })
            .map(card => ({
                id: card.id,
                front: card.front,
                back: card.back,
                isNew: !card.reviews[0]
            }));

        // Stats
        const stats = {
            total: cards.length,
            due: dueCards.length,
            new: dueCards.filter(c => c.isNew).length,
            review: dueCards.filter(c => !c.isNew).length
        };

        return NextResponse.json({
            cards: dueCards,
            stats
        });

    } catch (error) {
        console.error("Failed to get review cards:", error);
        return NextResponse.json(
            { error: "Failed to get review cards" },
            { status: 500 }
        );
    }
}
