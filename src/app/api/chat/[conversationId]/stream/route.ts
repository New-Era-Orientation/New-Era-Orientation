import { NextRequest } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { getAIService } from '@/server/services/ai-service';

export const runtime = 'nodejs';

// POST - Send message and stream AI response
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  const session = await auth();
  const { conversationId } = await params;

  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { content, provider } = await request.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Message content required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify conversation belongs to user
    const conversation = await db.chatConversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save user message first
    const userMessage = await db.chatMessage.create({
      data: {
        conversationId,
        role: 'USER',
        content,
      },
    });

    // Build messages for AI
    const aiMessages = [
      ...conversation.messages.map(m => ({
        role: m.role === 'USER' ? 'user' as const : 'assistant' as const,
        content: m.content,
      })),
      { role: 'user' as const, content },
    ];

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const aiService = getAIService();
          
          // Send user message ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'user_message', id: userMessage.id })}\n\n`));

          // Stream AI response
          for await (const chunk of aiService.streamChat(aiMessages, conversation.context || undefined, provider)) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          // Save complete AI response to database
          const assistantMessage = await db.chatMessage.create({
            data: {
              conversationId,
              role: 'ASSISTANT',
              content: fullResponse,
              metadata: { provider: provider || 'auto', streaming: true },
            },
          });

          // Update conversation timestamp
          await db.chatConversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          // Send completion event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'done', 
            assistantMessageId: assistantMessage.id,
            tokensUsed: fullResponse.length // Rough estimate
          })}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          
          // If streaming fails, fall back to simple response
          const errorMessage = error instanceof Error ? error.message : 'AI service error';
          
          // Save error response
          const fallbackResponse = `Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn. Vui lòng thử lại.\n\nLỗi: ${errorMessage}`;
          
          await db.chatMessage.create({
            data: {
              conversationId,
              role: 'ASSISTANT',
              content: fallbackResponse,
              metadata: { error: true, errorMessage },
            },
          });

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error', 
            message: errorMessage 
          })}\n\n`));
          
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in streaming chat:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
