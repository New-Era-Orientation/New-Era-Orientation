import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// GET /api/practice/questions - Lấy câu hỏi theo topicId, chapterId hoặc questionIds
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const topicId = searchParams.get("topicId");
        const chapterId = searchParams.get("chapterId");
        const questionIdsParam = searchParams.get("questionIds");

        const questionSelect = {
            id: true,
            content: true,
            explanation: true,
            difficulty: true,
            options: {
                select: {
                    id: true,
                    content: true,
                    isCorrect: true,
                    explanation: true,
                }
            },
            topic: {
                select: {
                    id: true,
                    name: true,
                    chapter: {
                        select: {
                            id: true,
                            name: true,
                        }
                    }
                }
            }
        };

        let questions = [];

        if (questionIdsParam) {
            // Parse questionIds (format: "id1,id2,id3")
            const ids = questionIdsParam.split(",").map(id => id.trim()).filter(id => id);
            
            if (ids.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: "No valid question IDs provided"
                }, { status: 400 });
            }

            // Fetch questions by IDs
            questions = await db.question.findMany({
                where: {
                    id: { in: ids }
                },
                select: questionSelect,
            });

        } else if (chapterId) {
            // Fetch all questions from all topics in the chapter
            questions = await db.question.findMany({
                where: {
                    topic: {
                        chapterId: chapterId
                    }
                },
                select: questionSelect,
            });

        } else if (topicId) {
            // Fetch questions by topicId
            questions = await db.question.findMany({
                where: {
                    topicId: topicId
                },
                select: questionSelect,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: "Missing topicId, chapterId or questionIds parameter"
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            data: questions,
            count: questions.length
        });

    } catch (error) {
        console.error("Error fetching practice questions:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to fetch questions"
        }, { status: 500 });
    }
}
