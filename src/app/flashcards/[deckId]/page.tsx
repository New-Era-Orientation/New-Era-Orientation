"use client";

import { useState, useEffect, use } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { ProgressRing } from "@/client/components/ui/ProgressRing";
import {
    ArrowLeft, ArrowRight, RotateCcw, Check, X,
    Loader2, Layers, Play, Eye, BookOpen
} from "lucide-react";
import Link from "next/link";

interface FlashCard {
    id: string;
    front: string;
    back: string;
    isNew?: boolean;
}

interface DeckInfo {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    isOwner: boolean;
    cardCount: number;
    cardsDue: number;
}

interface ReviewStats {
    total: number;
    due: number;
    new: number;
    review: number;
}

export default function FlashcardStudyPage({ params }: { params: Promise<{ deckId: string }> }) {
    const { deckId } = use(params);
    const [deck, setDeck] = useState<DeckInfo | null>(null);
    const [cards, setCards] = useState<FlashCard[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<"overview" | "study" | "complete">("overview");
    
    // Study state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [reviewed, setReviewed] = useState(0);

    useEffect(() => {
        loadDeck();
    }, [deckId]);

    async function loadDeck() {
        try {
            setLoading(true);
            const [deckResponse, reviewResponse] = await Promise.all([
                fetch(`/api/flashcards/${deckId}`),
                fetch(`/api/flashcards/${deckId}/review`)
            ]);
            
            const deckData = await deckResponse.json();
            const reviewData = await reviewResponse.json();
            
            setDeck(deckData.deck);
            setCards(reviewData.cards || []);
            setStats(reviewData.stats);
        } catch (error) {
            console.error("Failed to load deck:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleReview(quality: number) {
        const card = cards[currentIndex];
        if (!card) return;

        try {
            await fetch(`/api/flashcards/${deckId}/review`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cardId: card.id, quality })
            });

            setReviewed(r => r + 1);
            setShowAnswer(false);

            if (currentIndex < cards.length - 1) {
                setCurrentIndex(i => i + 1);
            } else {
                setMode("complete");
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        }
    }

    function startStudy() {
        setCurrentIndex(0);
        setShowAnswer(false);
        setReviewed(0);
        setMode("study");
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto p-6 lg:p-10 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    if (!deck) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto p-6 lg:p-10">
                    <Card className="p-12 text-center">
                        <h2 className="text-xl font-semibold mb-2">Không tìm thấy bộ thẻ</h2>
                        <Link href="/flashcards">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </Button>
                        </Link>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href="/flashcards">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{deck.name}</h1>
                        {deck.description && (
                            <p className="text-muted-foreground">{deck.description}</p>
                        )}
                    </div>
                </div>

                {mode === "overview" && (
                    <OverviewMode 
                        deck={deck} 
                        stats={stats} 
                        onStart={startStudy} 
                    />
                )}

                {mode === "study" && cards.length > 0 && (
                    <StudyMode
                        card={cards[currentIndex]}
                        currentIndex={currentIndex}
                        totalCards={cards.length}
                        showAnswer={showAnswer}
                        onShowAnswer={() => setShowAnswer(true)}
                        onReview={handleReview}
                    />
                )}

                {mode === "complete" && (
                    <CompleteMode
                        reviewed={reviewed}
                        totalCards={cards.length}
                        onRestart={startStudy}
                    />
                )}
            </main>
        </div>
    );
}

function OverviewMode({ 
    deck, 
    stats, 
    onStart 
}: { 
    deck: DeckInfo; 
    stats: ReviewStats | null; 
    onStart: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                    <div className="p-4 rounded-full bg-primary/10">
                        <Layers className="h-12 w-12 text-primary" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Sẵn sàng học?
                </h2>

                {stats && (
                    <div className="flex justify-center gap-6 my-6">
                        <div className="text-center">
                            <p className="text-3xl font-bold text-blue-500">{stats.new}</p>
                            <p className="text-sm text-muted-foreground">Thẻ mới</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-green-500">{stats.review}</p>
                            <p className="text-sm text-muted-foreground">Cần ôn tập</p>
                        </div>
                        <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                            <p className="text-sm text-muted-foreground">Tổng số thẻ</p>
                        </div>
                    </div>
                )}

                {stats && stats.due > 0 ? (
                    <Button size="lg" onClick={onStart} className="mt-4">
                        <Play className="h-5 w-5 mr-2" />
                        Bắt đầu học ({stats.due} thẻ)
                    </Button>
                ) : (
                    <div className="mt-4">
                        <Badge variant="success" className="text-lg px-4 py-2">
                            <Check className="h-4 w-4 mr-2" />
                            Đã hoàn thành tất cả!
                        </Badge>
                        <p className="text-muted-foreground mt-2">
                            Quay lại sau để ôn tập thêm
                        </p>
                    </div>
                )}

                <Link href={`/flashcards/${deck.id}/edit`} className="block mt-4">
                    <Button variant="outline">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Xem tất cả thẻ
                    </Button>
                </Link>
            </Card>
        </div>
    );
}

function StudyMode({
    card,
    currentIndex,
    totalCards,
    showAnswer,
    onShowAnswer,
    onReview
}: {
    card: FlashCard;
    currentIndex: number;
    totalCards: number;
    showAnswer: boolean;
    onShowAnswer: () => void;
    onReview: (quality: number) => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${((currentIndex + 1) / totalCards) * 100}%` }}
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {totalCards}
                </span>
            </div>

            {/* Card */}
            <Card className="p-8 min-h-[300px] flex flex-col justify-center">
                <div className="text-center">
                    {/* Front */}
                    <div className="mb-6">
                        <p className="text-sm text-muted-foreground mb-2">Câu hỏi</p>
                        <p className="text-xl font-medium text-foreground">{card.front}</p>
                    </div>

                    {/* Answer */}
                    {showAnswer ? (
                        <div className="pt-6 border-t">
                            <p className="text-sm text-muted-foreground mb-2">Đáp án</p>
                            <p className="text-xl font-medium text-primary">{card.back}</p>
                        </div>
                    ) : (
                        <Button onClick={onShowAnswer} size="lg" className="mt-4">
                            <Eye className="h-4 w-4 mr-2" />
                            Xem đáp án
                        </Button>
                    )}
                </div>
            </Card>

            {/* Rating buttons */}
            {showAnswer && (
                <div className="mt-6">
                    <p className="text-center text-sm text-muted-foreground mb-4">
                        Bạn nhớ được không?
                    </p>
                    <div className="flex gap-2 justify-center">
                        <Button
                            variant="outline"
                            onClick={() => onReview(1)}
                            className="flex-1 max-w-[120px] border-red-300 text-red-600 hover:bg-red-50"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Quên
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onReview(3)}
                            className="flex-1 max-w-[120px] border-yellow-300 text-yellow-600 hover:bg-yellow-50"
                        >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Khó
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onReview(4)}
                            className="flex-1 max-w-[120px] border-green-300 text-green-600 hover:bg-green-50"
                        >
                            <Check className="h-4 w-4 mr-1" />
                            Tốt
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onReview(5)}
                            className="flex-1 max-w-[120px] border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Dễ
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function CompleteMode({
    reviewed,
    totalCards,
    onRestart
}: {
    reviewed: number;
    totalCards: number;
    onRestart: () => void;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
                <div className="flex justify-center mb-6">
                    <ProgressRing progress={100} size="lg" strokeWidth={10} />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                    🎉 Tuyệt vời!
                </h2>
                <p className="text-muted-foreground mb-6">
                    Bạn đã ôn tập xong {reviewed} thẻ
                </p>

                <div className="flex gap-4 justify-center">
                    <Button variant="outline" onClick={onRestart}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Học lại
                    </Button>
                    <Link href="/flashcards">
                        <Button>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                    </Link>
                </div>
            </Card>
        </div>
    );
}
