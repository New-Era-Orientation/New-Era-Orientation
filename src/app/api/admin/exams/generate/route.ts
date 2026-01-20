import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getAIService } from "@/server/services/ai-service";

export const dynamic = "force-dynamic";

// POST - Generate exam using AI
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { topic, totalQuestions, singleChoice, multiChoice, difficulty } = body;

        if (!topic || !totalQuestions) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const aiService = getAIService();
        const generatedText = await aiService.generateExam(
            topic,
            totalQuestions,
            singleChoice || 0,
            multiChoice || 0,
            difficulty || "thông hiểu"
        );

        return NextResponse.json({ success: true, content: generatedText });
    } catch (error) {
        console.error("Exam generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate exam" },
            { status: 500 }
        );
    }
}
