"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Card } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import { Badge } from "@/client/components/ui/Badge";
import {
    Plus, Layers, BookOpen, Trash2, Edit, Globe, Lock,
    Play, Loader2, MoreHorizontal, Search, X
} from "lucide-react";
import Link from "next/link";

interface FlashcardDeck {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    cardCount: number;
    owner: { name: string | null; image: string | null };
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function FlashcardsPage() {
    const [decks, setDecks] = useState<FlashcardDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showPublic, setShowPublic] = useState(false);

    useEffect(() => {
        loadDecks();
    }, [showPublic]);

    async function loadDecks() {
        try {
            setLoading(true);
            const response = await fetch(`/api/flashcards?public=${showPublic}`);
            const data = await response.json();
            setDecks(data.decks || []);
        } catch (error) {
            console.error("Failed to load decks:", error);
        } finally {
            setLoading(false);
        }
    }

    const filteredDecks = decks.filter(deck =>
        deck.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deck.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const myDecks = filteredDecks.filter(d => d.isOwner);
    const publicDecks = filteredDecks.filter(d => !d.isOwner);

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
            <main className="container mx-auto p-6 lg:p-10">
                {/* Header */}
                <section className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Layers className="h-8 w-8 text-primary" />
                                <h1 className="text-4xl font-bold text-foreground">Flashcards</h1>
                            </div>
                            <p className="text-lg text-muted-foreground">
                                Học từ vựng và khái niệm với phương pháp lặp lại ngắt quãng
                            </p>
                        </div>
                        <Button onClick={() => setShowCreateModal(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Tạo bộ thẻ
                        </Button>
                    </div>
                </section>

                {/* Filters */}
                <section className="mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="relative flex-1 min-w-[250px]">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm bộ thẻ..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                leftIcon={<Search className="h-5 w-5" />}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowPublic(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    !showPublic
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground"
                                }`}
                            >
                                <Lock className="h-4 w-4 inline mr-2" />
                                Của tôi
                            </button>
                            <button
                                onClick={() => setShowPublic(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    showPublic
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground"
                                }`}
                            >
                                <Globe className="h-4 w-4 inline mr-2" />
                                Công khai
                            </button>
                        </div>
                    </div>
                </section>

                {loading ? (
                    <div className="flex items-center justify-center min-h-[40vh]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* My Decks */}
                        {myDecks.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">
                                    Bộ thẻ của tôi
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {myDecks.map((deck) => (
                                        <DeckCard key={deck.id} deck={deck} onDelete={loadDecks} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Public Decks */}
                        {publicDecks.length > 0 && (
                            <section className="mb-8">
                                <h2 className="text-xl font-semibold text-foreground mb-4">
                                    Bộ thẻ công khai
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {publicDecks.map((deck) => (
                                        <DeckCard key={deck.id} deck={deck} onDelete={loadDecks} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Empty State */}
                        {filteredDecks.length === 0 && (
                            <Card className="p-12 text-center">
                                <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    Chưa có bộ thẻ nào
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Tạo bộ thẻ đầu tiên để bắt đầu học
                                </p>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo bộ thẻ
                                </Button>
                            </Card>
                        )}
                    </>
                )}

                {/* Create Modal */}
                {showCreateModal && (
                    <CreateDeckModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            loadDecks();
                        }}
                    />
                )}
            </main>
        </div>
    );
}

function DeckCard({ deck, onDelete }: { deck: FlashcardDeck; onDelete: () => void }) {
    const [showMenu, setShowMenu] = useState(false);
    const [deleting, setDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm("Bạn có chắc muốn xóa bộ thẻ này?")) return;
        
        try {
            setDeleting(true);
            await fetch(`/api/flashcards/${deck.id}`, { method: "DELETE" });
            onDelete();
        } catch (error) {
            console.error("Failed to delete:", error);
        } finally {
            setDeleting(false);
        }
    }

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">{deck.name}</h3>
                        {deck.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                                {deck.description}
                            </p>
                        )}
                    </div>
                </div>
                
                {deck.isOwner && (
                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1 hover:bg-secondary rounded"
                        >
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 top-8 bg-popover border rounded-lg shadow-lg py-1 z-10">
                                <Link
                                    href={`/flashcards/${deck.id}/edit`}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-secondary text-sm"
                                >
                                    <Edit className="h-4 w-4" />
                                    Chỉnh sửa
                                </Link>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-2 px-4 py-2 hover:bg-secondary text-sm text-red-500 w-full"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deleting ? "Đang xóa..." : "Xóa"}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mb-4">
                <Badge variant="info">
                    {deck.cardCount} thẻ
                </Badge>
                {deck.isPublic ? (
                    <Badge variant="success">
                        <Globe className="h-3 w-3 mr-1" />
                        Công khai
                    </Badge>
                ) : (
                    <Badge variant="info">
                        <Lock className="h-3 w-3 mr-1" />
                        Riêng tư
                    </Badge>
                )}
            </div>

            {!deck.isOwner && (
                <p className="text-xs text-muted-foreground mb-3">
                    Bởi {deck.owner.name || "Ẩn danh"}
                </p>
            )}

            <Link href={`/flashcards/${deck.id}`}>
                <Button variant="outline" className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Học ngay
                </Button>
            </Link>
        </Card>
    );
}

function CreateDeckModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [creating, setCreating] = useState(false);

    async function handleCreate() {
        if (!name.trim()) return;

        try {
            setCreating(true);
            const response = await fetch("/api/flashcards", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description, isPublic })
            });

            if (response.ok) {
                onCreated();
            }
        } catch (error) {
            console.error("Failed to create deck:", error);
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Tạo bộ thẻ mới</h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Tên bộ thẻ *
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="VD: Từ vựng Tin học"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            Mô tả
                        </label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về bộ thẻ..."
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        <label htmlFor="isPublic" className="text-sm text-foreground">
                            Chia sẻ công khai cho mọi người
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} className="flex-1">
                        Hủy
                    </Button>
                    <Button onClick={handleCreate} disabled={!name.trim() || creating} className="flex-1">
                        {creating ? "Đang tạo..." : "Tạo bộ thẻ"}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
