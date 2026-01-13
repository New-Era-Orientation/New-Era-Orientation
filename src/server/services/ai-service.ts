import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed?: number;
}

// System prompt for educational AI tutor
const SYSTEM_PROMPT = `Bạn là AI Tutor thông minh, chuyên hỗ trợ học sinh Việt Nam ôn thi THPT Quốc gia.

Nhiệm vụ:
- Giải thích kiến thức một cách dễ hiểu, rõ ràng
- Đưa ra ví dụ thực tế và minh họa
- Hướng dẫn giải bài tập từng bước
- Gợi ý phương pháp học tập hiệu quả
- Phân tích điểm yếu và đề xuất cải thiện

Nguyên tắc:
- Sử dụng tiếng Việt chuẩn, dễ hiểu
- Trả lời ngắn gọn nhưng đầy đủ
- Khuyến khích học sinh tự suy nghĩ
- Đưa ra feedback tích cực
- Không đưa đáp án trực tiếp nếu không cần thiết, hướng dẫn học sinh tự tìm ra

Các môn học chính: Toán, Vật Lý, Hóa Học, Sinh Học, Ngữ Văn, Tiếng Anh, Lịch Sử, Địa Lý, GDCD.`;

// Gemini Client
class GeminiClient {
  private client: GoogleGenerativeAI | null = null;

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY not configured');
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  async chat(messages: ChatMessage[], context?: string): Promise<AIResponse> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation history
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const prompt = context 
      ? `[Ngữ cảnh: ${context}]\n\n${SYSTEM_PROMPT}\n\nHọc sinh: ${lastMessage.content}`
      : `${SYSTEM_PROMPT}\n\nHọc sinh: ${lastMessage.content}`;

    const result = await chat.sendMessage(prompt);
    const response = result.response;

    return {
      content: response.text(),
      model: 'gemini-1.5-flash',
      tokensUsed: response.usageMetadata?.totalTokenCount,
    };
  }

  async *streamChat(messages: ChatMessage[], context?: string): AsyncGenerator<string> {
    const client = this.getClient();
    const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1];
    const prompt = context 
      ? `[Ngữ cảnh: ${context}]\n\n${SYSTEM_PROMPT}\n\nHọc sinh: ${lastMessage.content}`
      : `${SYSTEM_PROMPT}\n\nHọc sinh: ${lastMessage.content}`;

    const result = await chat.sendMessageStream(prompt);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        yield text;
      }
    }
  }
}

// OpenAI Client
class OpenAIClient {
  private client: OpenAI | null = null;

  private getClient() {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      this.client = new OpenAI({ apiKey });
    }
    return this.client;
  }

  async chat(messages: ChatMessage[], context?: string): Promise<AIResponse> {
    const client = this.getClient();

    const systemMessage = context 
      ? `${SYSTEM_PROMPT}\n\nNgữ cảnh hiện tại: ${context}`
      : SYSTEM_PROMPT;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective model
      messages: [
        { role: 'system', content: systemMessage },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    return {
      content: response.choices[0].message.content || '',
      model: 'gpt-4o-mini',
      tokensUsed: response.usage?.total_tokens,
    };
  }

  async *streamChat(messages: ChatMessage[], context?: string): AsyncGenerator<string> {
    const client = this.getClient();

    const systemMessage = context 
      ? `${SYSTEM_PROMPT}\n\nNgữ cảnh hiện tại: ${context}`
      : SYSTEM_PROMPT;

    const stream = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }
}

// AI Service - Main interface
export class AIService {
  private gemini: GeminiClient;
  private openai: OpenAIClient;
  private preferredProvider: 'gemini' | 'openai';

  constructor() {
    this.gemini = new GeminiClient();
    this.openai = new OpenAIClient();
    
    // Default to Gemini (free tier) if available, else OpenAI
    this.preferredProvider = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY 
      ? 'gemini' 
      : 'openai';
  }

  async chat(messages: ChatMessage[], context?: string, provider?: 'gemini' | 'openai'): Promise<AIResponse> {
    const selectedProvider = provider || this.preferredProvider;

    try {
      if (selectedProvider === 'gemini') {
        return await this.gemini.chat(messages, context);
      } else {
        return await this.openai.chat(messages, context);
      }
    } catch (error) {
      // Fallback to other provider
      console.error(`${selectedProvider} failed, trying fallback:`, error);
      
      try {
        if (selectedProvider === 'gemini') {
          return await this.openai.chat(messages, context);
        } else {
          return await this.gemini.chat(messages, context);
        }
      } catch (fallbackError) {
        console.error('Both AI providers failed:', fallbackError);
        throw new Error('AI service unavailable. Please try again later.');
      }
    }
  }

  async *streamChat(messages: ChatMessage[], context?: string, provider?: 'gemini' | 'openai'): AsyncGenerator<string> {
    const selectedProvider = provider || this.preferredProvider;

    try {
      if (selectedProvider === 'gemini') {
        yield* this.gemini.streamChat(messages, context);
      } else {
        yield* this.openai.streamChat(messages, context);
      }
    } catch (error) {
      console.error(`${selectedProvider} streaming failed:`, error);
      throw new Error('AI streaming unavailable. Please try again later.');
    }
  }

  getAvailableProviders(): string[] {
    const providers: string[] = [];
    if (process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY) {
      providers.push('gemini');
    }
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }
    return providers;
  }
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = new AIService();
  }
  return aiServiceInstance;
}

export default AIService;
