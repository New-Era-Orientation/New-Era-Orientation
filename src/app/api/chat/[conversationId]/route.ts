import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getAIService, type ChatMessage } from "@/server/services/ai-service";

// GET - Get conversation with messages
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const session = await auth();
    const { conversationId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const conversation = await db.chatConversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation:", error);
        return NextResponse.json(
            { error: "Failed to fetch conversation" },
            { status: 500 }
        );
    }
}

// POST - Send message and get AI response
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const session = await auth();
    const { conversationId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { content } = await request.json();

        // Verify conversation belongs to user
        const conversation = await db.chatConversation.findFirst({
            where: {
                id: conversationId,
                userId: session.user.id,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                    take: 10, // Context window
                },
            },
        });

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 }
            );
        }

        // Save user message
        const userMessage = await db.chatMessage.create({
            data: {
                conversationId,
                role: "USER",
                content,
            },
        });

        // Build messages for AI
        const aiMessages: ChatMessage[] = [
            ...conversation.messages.map(m => ({
                role: m.role === "USER" ? "user" as const : "assistant" as const,
                content: m.content,
            })),
            { role: "user" as const, content },
        ];

        // Generate AI response using real AI service
        let aiResponse: { content: string; model?: string; tokensUsed?: number };
        
        try {
            const aiService = getAIService();
            aiResponse = await aiService.chat(aiMessages, conversation.context || undefined);
        } catch (error) {
            console.error("AI service error, using fallback:", error);
            // Fallback to simulated response if AI service fails
            aiResponse = await generateFallbackResponse(content, conversation.context, conversation.messages);
        }

        // Save AI response
        const assistantMessage = await db.chatMessage.create({
            data: {
                conversationId,
                role: "ASSISTANT",
                content: aiResponse.content,
                metadata: { 
                    model: aiResponse.model,
                    tokensUsed: aiResponse.tokensUsed,
                },
            },
        });

        // Update conversation timestamp
        await db.chatConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });

        return NextResponse.json({
            userMessage,
            assistantMessage,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { error: "Failed to send message" },
            { status: 500 }
        );
    }
}

// DELETE - Delete conversation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const session = await auth();
    const { conversationId } = await params;
    
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await db.chatConversation.deleteMany({
            where: {
                id: conversationId,
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting conversation:", error);
        return NextResponse.json(
            { error: "Failed to delete conversation" },
            { status: 500 }
        );
    }
}

// Fallback Response Generator (when AI service is unavailable)
interface Message {
    role: string;
    content: string;
}

async function generateFallbackResponse(
    userMessage: string,
    context: string | null,
    previousMessages: Message[]
): Promise<{ content: string; model?: string; tokensUsed?: number }> {
    // Build context from previous messages
    const contextString = previousMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

    // Simple response logic based on keywords
    const lowercaseMessage = userMessage.toLowerCase();
    
    // Educational responses based on content
    if (lowercaseMessage.includes("giải thích") || lowercaseMessage.includes("explain")) {
        return {
            content: `Tôi sẽ giải thích cho bạn về chủ đề này một cách chi tiết.

${context ? `Trong ngữ cảnh ${context}:` : ""}

Để hiểu rõ vấn đề này, chúng ta cần xem xét các khía cạnh sau:

1. **Khái niệm cơ bản**: Đây là nền tảng để hiểu sâu hơn về chủ đề.

2. **Ứng dụng thực tế**: Kiến thức này có thể áp dụng trong nhiều tình huống.

3. **Các điểm cần lưu ý**: Hãy chú ý đến các chi tiết quan trọng khi học.

Bạn có câu hỏi cụ thể nào về phần này không?`,
            model: "fallback",
        };
    }

    if (lowercaseMessage.includes("bài tập") || lowercaseMessage.includes("exercise") || lowercaseMessage.includes("luyện")) {
        return {
            content: `Tuyệt vời! Đây là một số bài tập để bạn luyện tập:

**Bài tập 1**: Câu hỏi cơ bản
- Định nghĩa các khái niệm chính
- Xác định các thành phần quan trọng

**Bài tập 2**: Vận dụng
- Áp dụng kiến thức vào tình huống cụ thể
- Phân tích và đưa ra giải pháp

**Bài tập 3**: Nâng cao
- Kết hợp nhiều khái niệm
- Giải quyết vấn đề phức tạp

Hãy cho tôi biết khi bạn hoàn thành, tôi sẽ kiểm tra và góp ý!`,
            model: "fallback",
        };
    }

    if (lowercaseMessage.includes("tóm tắt") || lowercaseMessage.includes("summary")) {
        return {
            content: `📝 **Tóm tắt nội dung**

${context ? `Chủ đề: ${context}` : ""}

**Điểm chính:**
• Khái niệm cốt lõi và định nghĩa
• Các nguyên tắc quan trọng
• Ứng dụng và ví dụ thực tế

**Lưu ý quan trọng:**
• Nắm vững cơ bản trước khi đến nâng cao
• Luyện tập thường xuyên để nhớ lâu
• Liên hệ với kiến thức đã học

Bạn muốn tôi giải thích chi tiết phần nào?`,
            model: "fallback",
        };
    }

    if (lowercaseMessage.includes("gợi ý") || lowercaseMessage.includes("hint") || lowercaseMessage.includes("mẹo")) {
        return {
            content: `💡 **Gợi ý học tập**

1. **Phương pháp học hiệu quả:**
   - Chia nhỏ thời gian học (25-30 phút/phiên)
   - Ôn tập định kỳ
   - Ghi chép bằng sơ đồ tư duy

2. **Kỹ thuật ghi nhớ:**
   - Liên kết với hình ảnh
   - Sử dụng ví dụ thực tế
   - Giải thích lại cho người khác

3. **Luyện thi hiệu quả:**
   - Làm đề thi thử
   - Phân tích lỗi sai
   - Tập trung vào điểm yếu

Bạn cần gợi ý cụ thể hơn về phần nào?`,
            model: "fallback",
        };
    }

    // Default helpful response
    return {
        content: `Cảm ơn bạn đã đặt câu hỏi! 

Tôi là AI Tutor, sẵn sàng hỗ trợ bạn học tập. Tôi có thể giúp bạn:

🎯 **Giải thích bài học** - Hỏi "Giải thích [chủ đề]"
📝 **Đề xuất bài tập** - Hỏi "Cho tôi bài tập về [chủ đề]"
📋 **Tóm tắt nội dung** - Hỏi "Tóm tắt [chủ đề]"
💡 **Gợi ý học tập** - Hỏi "Gợi ý cách học [chủ đề]"

${context ? `\nHiện tại chúng ta đang thảo luận về: **${context}**` : ""}

⚠️ *Lưu ý: AI service chưa được cấu hình. Vui lòng thêm GOOGLE_AI_API_KEY hoặc OPENAI_API_KEY để sử dụng đầy đủ tính năng.*

Bạn muốn tôi hỗ trợ gì?`,
        model: "fallback",
    };
}
