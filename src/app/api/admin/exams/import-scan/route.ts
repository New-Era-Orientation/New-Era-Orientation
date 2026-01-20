import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getAIService } from "@/server/services/ai-service";

export const dynamic = "force-dynamic";

// POST - Scan uploaded exam file
export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user || session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type (PDF, Word, Images)
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
            "image/jpeg",
            "image/png",
            "image/webp"
        ];

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Supported: PDF, DOCX, JPG, PNG." }, { status: 400 });
        }

        // Convert file to Base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64Data = buffer.toString("base64");

        const aiService = getAIService();
        const extractedText = await aiService.scanExam(base64Data, file.type);

        return NextResponse.json({ success: true, content: extractedText });
    } catch (error) {
        console.error("Exam scanning error:", error);
        return NextResponse.json(
            { error: "Failed to scan exam" },
            { status: 500 }
        );
    }
}
