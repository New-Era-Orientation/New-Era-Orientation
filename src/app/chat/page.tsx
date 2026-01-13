"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import {
    MessageSquare,
    Plus,
    Send,
    Trash2,
    Bot,
    User,
    Loader2,
    Sparkles,
    BookOpen,
    HelpCircle,
    Lightbulb,
} from "lucide-react";

interface Message {
    id: string;
    role: "USER" | "ASSISTANT" | "SYSTEM";
    content: string;
    createdAt: string;
    metadata?: {
        type?: string;
    };
}

interface Conversation {
    id: string;
    title: string | null;
    context: string | null;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}

const quickActions = [
    { icon: BookOpen, label: "Giải thích bài học", prompt: "Giải thích cho tôi về " },
    { icon: HelpCircle, label: "Hỏi đáp", prompt: "Tôi có câu hỏi về " },
    { icon: Lightbulb, label: "Gợi ý học tập", prompt: "Gợi ý cách học hiệu quả về " },
    { icon: Sparkles, label: "Bài tập luyện", prompt: "Cho tôi bài tập luyện về " },
];

export default function ChatPage() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [activeConversation?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/chat");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
            }
        } catch (error) {
            console.error("Error fetching conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const createConversation = async () => {
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: "Cuộc trò chuyện mới" }),
            });
            
            if (res.ok) {
                const newConversation = await res.json();
                setConversations((prev) => [{ ...newConversation, messages: [] }, ...prev]);
                setActiveConversation({ ...newConversation, messages: [] });
            }
        } catch (error) {
            console.error("Error creating conversation:", error);
        }
    };

    const selectConversation = async (id: string) => {
        try {
            const res = await fetch(`/api/chat/${id}`);
            if (res.ok) {
                const data = await res.json();
                setActiveConversation(data);
            }
        } catch (error) {
            console.error("Error fetching conversation:", error);
        }
    };

    const deleteConversation = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/chat/${id}`, { method: "DELETE" });
            setConversations((prev) => prev.filter((c) => c.id !== id));
            if (activeConversation?.id === id) {
                setActiveConversation(null);
            }
        } catch (error) {
            console.error("Error deleting conversation:", error);
        }
    };

    const sendMessage = async (content: string = message) => {
        if (!content.trim() || !activeConversation || sending) return;

        setSending(true);
        setMessage("");

        // Optimistically add user message
        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "USER",
            content,
            createdAt: new Date().toISOString(),
        };

        setActiveConversation((prev) =>
            prev
                ? { ...prev, messages: [...prev.messages, tempUserMessage] }
                : null
        );

        try {
            const res = await fetch(`/api/chat/${activeConversation.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });

            if (res.ok) {
                const { userMessage, assistantMessage } = await res.json();
                
                setActiveConversation((prev) =>
                    prev
                        ? {
                              ...prev,
                              messages: [
                                  ...prev.messages.filter((m) => m.id !== tempUserMessage.id),
                                  userMessage,
                                  assistantMessage,
                              ],
                          }
                        : null
                );
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setSending(false);
        }
    };

    const handleQuickAction = (prompt: string) => {
        if (!activeConversation) {
            createConversation().then(() => {
                setMessage(prompt);
            });
        } else {
            setMessage(prompt);
        }
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return "Hôm nay";
        if (days === 1) return "Hôm qua";
        if (days < 7) return `${days} ngày trước`;
        return d.toLocaleDateString("vi-VN");
    };

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <div
                className={`${
                    showSidebar ? "w-80" : "w-0"
                } flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-all duration-300 overflow-hidden`}
            >
                <div className="p-4 h-full flex flex-col">
                    <Button
                        onClick={createConversation}
                        className="w-full mb-4 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Cuộc trò chuyện mới
                    </Button>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => selectConversation(conv.id)}
                                className={`p-3 rounded-lg cursor-pointer group flex items-center justify-between transition-colors ${
                                    activeConversation?.id === conv.id
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <MessageSquare className="h-4 w-4 flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">
                                            {conv.title || "Cuộc trò chuyện"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {formatDate(conv.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => deleteConversation(conv.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {!activeConversation ? (
                    /* Welcome Screen */
                    <div className="flex-1 flex flex-col items-center justify-center p-8">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                            <Bot className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            AI Tutor
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                            Trợ lý học tập thông minh - Sẵn sàng giải đáp mọi thắc mắc
                            và hỗ trợ bạn trong quá trình học tập
                        </p>

                        <div className="grid grid-cols-2 gap-4 max-w-lg">
                            {quickActions.map((action) => (
                                <Card
                                    key={action.label}
                                    className="cursor-pointer hover:shadow-lg transition-shadow"
                                    onClick={() => {
                                        createConversation();
                                        handleQuickAction(action.prompt);
                                    }}
                                >
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <action.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="font-medium text-sm">
                                            {action.label}
                                        </span>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Chat Messages */
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {activeConversation.messages.length === 0 && (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Bắt đầu cuộc trò chuyện với AI Tutor</p>
                                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                                        {quickActions.map((action) => (
                                            <Button
                                                key={action.label}
                                                variant="outline"
                                                size="sm"
                                                onClick={() => sendMessage(action.prompt)}
                                            >
                                                <action.icon className="h-4 w-4 mr-2" />
                                                {action.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeConversation.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex gap-3 ${
                                        msg.role === "USER" ? "justify-end" : "justify-start"
                                    }`}
                                >
                                    {msg.role !== "USER" && (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Bot className="h-4 w-4 text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                                            msg.role === "USER"
                                                ? "bg-blue-600 text-white"
                                                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                                        }`}
                                    >
                                        <div className="whitespace-pre-wrap text-sm">
                                            {msg.content}
                                        </div>
                                    </div>
                                    {msg.role === "USER" && (
                                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                            <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {sending && (
                                <div className="flex gap-3 justify-start">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="h-4 w-4 text-white" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span className="text-sm text-gray-500">
                                                Đang suy nghĩ...
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    sendMessage();
                                }}
                                className="flex gap-2"
                            >
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Nhập câu hỏi của bạn..."
                                    className="flex-1"
                                    disabled={sending}
                                />
                                <Button type="submit" disabled={!message.trim() || sending}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
