import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// PDF Report Generation API
// This generates a downloadable PDF study report
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const reportType = searchParams.get("type") || "weekly";
        const format = searchParams.get("format") || "pdf";

        const now = new Date();
        let startDate: Date;
        let periodLabel: string;

        switch (reportType) {
            case "monthly":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                periodLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;
                break;
            case "yearly":
                startDate = new Date(now.getFullYear(), 0, 1);
                periodLabel = `Năm ${now.getFullYear()}`;
                break;
            default: // weekly
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                periodLabel = `${startDate.toLocaleDateString("vi-VN")} - ${now.toLocaleDateString("vi-VN")}`;
        }

        // Gather report data
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true },
        });

        const attempts = await db.examAttempt.findMany({
            where: {
                userId: session.user.id,
                completedAt: { gte: startDate, lte: now },
            },
            include: {
                exam: { 
                    select: { 
                        title: true, 
                        subject: true,
                        parts: true,
                    } 
                },
            },
            orderBy: { completedAt: "desc" },
        });

        const streak = await db.userStreak.findUnique({
            where: { userId: session.user.id },
        });

        const achievements = await db.userAchievement.findMany({
            where: {
                userId: session.user.id,
                unlockedAt: { gte: startDate, lte: now },
            },
            include: { achievement: true },
        });

        // Calculate statistics
        const scores = attempts.map((a) => a.score || 0);
        const avgScore = scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
            : 0;
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;
        const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);

        // Analyze topics from exam parts JSON
        const topicStats: Record<string, { correct: number; total: number }> = {};
        
        for (const attempt of attempts) {
            const answers = typeof attempt.answers === "string"
                ? JSON.parse(attempt.answers)
                : attempt.answers as Record<string, string>;
            
            const parts = attempt.exam?.parts as any[] | null;
            if (!parts || !answers) continue;

            for (const part of parts) {
                const topic = part.name || "Khác";
                if (!topicStats[topic]) {
                    topicStats[topic] = { correct: 0, total: 0 };
                }
                
                for (const question of (part.questions || [])) {
                    topicStats[topic].total++;
                    if (answers[question.id] === question.correctAnswer) {
                        topicStats[topic].correct++;
                    }
                }
            }
        }

        const topicPerformance = Object.entries(topicStats)
            .map(([topic, stats]) => ({
                topic,
                accuracy: Math.round((stats.correct / stats.total) * 100),
                total: stats.total,
            }))
            .sort((a, b) => a.accuracy - b.accuracy);

        // Generate report based on format
        if (format === "json") {
            return NextResponse.json({
                report: {
                    title: `Báo cáo học tập`,
                    period: periodLabel,
                    generatedAt: now.toISOString(),
                    user: {
                        name: user?.name || "Học sinh",
                        email: user?.email,
                    },
                    summary: {
                        examsCompleted: attempts.length,
                        averageScore: avgScore,
                        highestScore,
                        lowestScore,
                        totalStudyTime: totalTime,
                        currentStreak: streak?.currentStreak || 0,
                        longestStreak: streak?.longestStreak || 0,
                        achievementsUnlocked: achievements.length,
                    },
                    topicPerformance,
                    exams: attempts.map((a) => ({
                        title: a.exam.title,
                        subject: a.exam.subject,
                        score: a.score,
                        timeSpent: a.timeSpent,
                        completedAt: a.completedAt,
                    })),
                    achievements: achievements.map((ua) => ({
                        name: ua.achievement.name,
                        description: ua.achievement.description,
                        unlockedAt: ua.unlockedAt,
                    })),
                    recommendations: generateReportRecommendations(
                        avgScore,
                        topicPerformance,
                        streak?.currentStreak || 0
                    ),
                },
            });
        }

        // Generate HTML-based PDF (can be converted to PDF client-side or by a service)
        const htmlContent = generateReportHTML({
            userName: user?.name || "Học sinh",
            period: periodLabel,
            generatedAt: now.toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
            summary: {
                examsCompleted: attempts.length,
                averageScore: avgScore,
                highestScore,
                lowestScore,
                totalStudyTime: totalTime,
                currentStreak: streak?.currentStreak || 0,
                achievementsUnlocked: achievements.length,
            },
            topicPerformance,
            exams: attempts.slice(0, 10).map((a) => ({
                title: a.exam.title,
                score: a.score || 0,
                date: a.completedAt?.toLocaleDateString("vi-VN") || "",
            })),
            recommendations: generateReportRecommendations(
                avgScore,
                topicPerformance,
                streak?.currentStreak || 0
            ),
        });

        return new NextResponse(htmlContent, {
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Content-Disposition": `attachment; filename="bao-cao-hoc-tap-${reportType}.html"`,
            },
        });
    } catch (error) {
        console.error("Report generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate report" },
            { status: 500 }
        );
    }
}

function generateReportRecommendations(
    avgScore: number,
    topicPerformance: { topic: string; accuracy: number }[],
    currentStreak: number
): string[] {
    const recommendations: string[] = [];

    // Score-based recommendations
    if (avgScore < 5) {
        recommendations.push(
            "Cần tập trung ôn lại kiến thức cơ bản. Xem lại các chủ đề có độ chính xác thấp."
        );
    } else if (avgScore < 7) {
        recommendations.push(
            "Kết quả khá tốt! Tiếp tục luyện tập đều đặn để nâng cao điểm số."
        );
    } else {
        recommendations.push(
            "Kết quả xuất sắc! Thử thách bản thân với các đề thi khó hơn."
        );
    }

    // Weak topic recommendations
    const weakTopics = topicPerformance.filter((t) => t.accuracy < 60);
    if (weakTopics.length > 0) {
        const topicNames = weakTopics.slice(0, 3).map((t) => t.topic).join(", ");
        recommendations.push(
            `Chủ đề cần cải thiện: ${topicNames}. Hãy dành thêm thời gian ôn tập.`
        );
    }

    // Streak recommendations
    if (currentStreak === 0) {
        recommendations.push(
            "Hãy bắt đầu streak học tập mới! Học mỗi ngày giúp ghi nhớ tốt hơn."
        );
    } else if (currentStreak >= 7) {
        recommendations.push(
            `Tuyệt vời! Bạn đã duy trì streak ${currentStreak} ngày. Tiếp tục phát huy!`
        );
    }

    return recommendations.slice(0, 4);
}

function generateReportHTML(data: {
    userName: string;
    period: string;
    generatedAt: string;
    summary: {
        examsCompleted: number;
        averageScore: number;
        highestScore: number;
        lowestScore: number;
        totalStudyTime: number;
        currentStreak: number;
        achievementsUnlocked: number;
    };
    topicPerformance: { topic: string; accuracy: number; total?: number }[];
    exams: { title: string; score: number; date: string }[];
    recommendations: string[];
}): string {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} phút`;
    };

    return `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Báo cáo học tập - NEO-EDU</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }
        .report {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        .header .period {
            font-size: 18px;
            opacity: 0.9;
        }
        .header .meta {
            font-size: 14px;
            margin-top: 15px;
            opacity: 0.8;
        }
        .section {
            padding: 25px 30px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child {
            border-bottom: none;
        }
        .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #444;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        .stat-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #667eea;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .topic-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .topic-item {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .topic-name {
            width: 150px;
            font-size: 14px;
        }
        .topic-bar {
            flex: 1;
            height: 24px;
            background: #e9ecef;
            border-radius: 12px;
            overflow: hidden;
        }
        .topic-fill {
            height: 100%;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10px;
            color: white;
            font-size: 12px;
            font-weight: 600;
        }
        .topic-fill.good { background: #28a745; }
        .topic-fill.medium { background: #ffc107; color: #333; }
        .topic-fill.poor { background: #dc3545; }
        .exam-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .exam-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .exam-title {
            font-weight: 500;
        }
        .exam-meta {
            display: flex;
            gap: 20px;
            font-size: 14px;
            color: #666;
        }
        .exam-score {
            font-weight: 600;
            color: #667eea;
        }
        .recommendations {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        .recommendation {
            display: flex;
            gap: 12px;
            padding: 15px;
            background: #f0f4ff;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .recommendation-icon {
            font-size: 20px;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 12px;
        }
        @media print {
            body { background: white; padding: 0; }
            .report { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="report">
        <div class="header">
            <h1>📊 Báo cáo học tập</h1>
            <div class="period">${data.period}</div>
            <div class="meta">
                Học sinh: <strong>${data.userName}</strong><br>
                Ngày tạo: ${data.generatedAt}
            </div>
        </div>

        <div class="section">
            <div class="section-title">📈 Tổng quan</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${data.summary.examsCompleted}</div>
                    <div class="stat-label">Đề thi hoàn thành</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.summary.averageScore}</div>
                    <div class="stat-label">Điểm trung bình</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${formatTime(data.summary.totalStudyTime)}</div>
                    <div class="stat-label">Thời gian học</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${data.summary.currentStreak}</div>
                    <div class="stat-label">Streak hiện tại</div>
                </div>
            </div>
        </div>

        ${data.topicPerformance.length > 0 ? `
        <div class="section">
            <div class="section-title">📚 Hiệu suất theo chủ đề</div>
            <div class="topic-list">
                ${data.topicPerformance.map(topic => `
                    <div class="topic-item">
                        <span class="topic-name">${topic.topic}</span>
                        <div class="topic-bar">
                            <div class="topic-fill ${topic.accuracy >= 70 ? 'good' : topic.accuracy >= 50 ? 'medium' : 'poor'}" 
                                 style="width: ${topic.accuracy}%">
                                ${topic.accuracy}%
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        ${data.exams.length > 0 ? `
        <div class="section">
            <div class="section-title">📝 Đề thi gần đây</div>
            <div class="exam-list">
                ${data.exams.map(exam => `
                    <div class="exam-item">
                        <span class="exam-title">${exam.title}</span>
                        <div class="exam-meta">
                            <span>${exam.date}</span>
                            <span class="exam-score">${exam.score}/10</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <div class="section">
            <div class="section-title">💡 Đề xuất</div>
            <div class="recommendations">
                ${data.recommendations.map(rec => `
                    <div class="recommendation">
                        <span class="recommendation-icon">✨</span>
                        <span>${rec}</span>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="footer">
            Báo cáo được tạo bởi NEO-EDU | © ${new Date().getFullYear()}
        </div>
    </div>
</body>
</html>
    `;
}
