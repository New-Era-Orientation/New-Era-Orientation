import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';
import { getAIService } from '@/server/services/ai-service';

// GET - Get personalized study recommendations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Gather user's learning data
    const [examAttempts, studyProgress, flashcardProgress] = await Promise.all([
      // Recent exam attempts
      db.examAttempt.findMany({
        where: { userId: session.user.id },
        orderBy: { startedAt: 'desc' },
        take: 20,
        include: {
          exam: {
            select: { title: true, subject: true },
          },
        },
      }),
      
      // Study progress
      db.userProgress.findMany({
        where: { userId: session.user.id },
        include: {
          topic: {
            select: { name: true, slug: true },
          },
        },
      }),
      
      // Flashcard progress - get reviews with SRS data
      db.flashcardReview.findMany({
        where: { userId: session.user.id },
        select: {
          easeFactor: true,
          interval: true,
          repetitions: true,
        },
      }),
    ]);

    // Analyze performance
    const analysis = analyzeUserPerformance(examAttempts, studyProgress, flashcardProgress);

    // If user has enough data, use AI for personalized recommendations
    if (analysis.totalAttempts >= 3) {
      try {
        const aiService = getAIService();
        const prompt = buildRecommendationPrompt(analysis);
        
        const response = await aiService.chat([
          { role: 'user', content: prompt }
        ]);

        const recommendations = parseRecommendations(response.content);

        return NextResponse.json({
          success: true,
          analysis,
          recommendations,
          aiGenerated: true,
        });
      } catch (error) {
        console.error('AI recommendation failed:', error);
        // Fall back to rule-based recommendations
      }
    }

    // Rule-based recommendations for new users or when AI fails
    const recommendations = generateRuleBasedRecommendations(analysis);

    return NextResponse.json({
      success: true,
      analysis,
      recommendations,
      aiGenerated: false,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
}

interface UserAnalysis {
  totalAttempts: number;
  averageScore: number;
  strongSubjects: string[];
  weakSubjects: string[];
  studyStreak: number;
  topicsCompleted: number;
  topicsInProgress: number;
  flashcardMastery: number;
  recentScores: number[];
  trend: 'improving' | 'stable' | 'declining';
}

function analyzeUserPerformance(
  examAttempts: Array<{ score: number | null; exam: { title: string; subject: string | null } | null }>,
  studyProgress: Array<{ completed: boolean; topic: { name: string; slug: string } | null }>,
  flashcardReviews: Array<{ easeFactor: number; interval: number; repetitions: number }>
): UserAnalysis {
  // Calculate average score
  const scores = examAttempts.filter(a => a.score !== null).map(a => a.score as number);
  const averageScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;

  // Analyze subjects performance
  const subjectScores: Record<string, number[]> = {};
  examAttempts.forEach(attempt => {
    if (attempt.score === null) return;
    const subject = attempt.exam?.subject || 'Khác';
    if (!subjectScores[subject]) {
      subjectScores[subject] = [];
    }
    subjectScores[subject].push(attempt.score);
  });

  const subjectAverages = Object.entries(subjectScores).map(([subject, scores]) => ({
    subject,
    average: scores.reduce((a, b) => a + b, 0) / scores.length,
  }));

  const strongSubjects = subjectAverages
    .filter(s => s.average >= 70)
    .map(s => s.subject);

  const weakSubjects = subjectAverages
    .filter(s => s.average < 60)
    .map(s => s.subject);

  // Study progress
  const topicsCompleted = studyProgress.filter(p => p.completed).length;
  const topicsInProgress = studyProgress.filter(p => !p.completed).length;

  // Flashcard mastery - using reviews data directly
  const masteredCards = flashcardReviews.filter(r => r.interval >= 21).length;
  const flashcardMastery = flashcardReviews.length > 0 
    ? (masteredCards / flashcardReviews.length) * 100 
    : 0;

  // Score trend (last 5 vs previous 5)
  const recentScores = scores.slice(0, 5);
  const previousScores = scores.slice(5, 10);
  
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (recentScores.length >= 3 && previousScores.length >= 3) {
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    const previousAvg = previousScores.reduce((a, b) => a + b, 0) / previousScores.length;
    
    if (recentAvg - previousAvg > 5) trend = 'improving';
    else if (previousAvg - recentAvg > 5) trend = 'declining';
  }

  return {
    totalAttempts: examAttempts.length,
    averageScore: Math.round(averageScore * 10) / 10,
    strongSubjects,
    weakSubjects,
    studyStreak: 0, // Would need activity data
    topicsCompleted,
    topicsInProgress,
    flashcardMastery: Math.round(flashcardMastery),
    recentScores,
    trend,
  };
}

function buildRecommendationPrompt(analysis: UserAnalysis): string {
  return `Bạn là cố vấn học tập AI cho học sinh THPT Việt Nam.

DỮ LIỆU HỌC SINH:
- Điểm trung bình: ${analysis.averageScore}/100
- Số bài đã làm: ${analysis.totalAttempts}
- Xu hướng: ${analysis.trend === 'improving' ? 'Tiến bộ' : analysis.trend === 'declining' ? 'Giảm sút' : 'Ổn định'}
- Môn mạnh: ${analysis.strongSubjects.join(', ') || 'Chưa xác định'}
- Môn yếu: ${analysis.weakSubjects.join(', ') || 'Chưa xác định'}
- Topics hoàn thành: ${analysis.topicsCompleted}
- Topics đang học: ${analysis.topicsInProgress}
- Flashcard mastery: ${analysis.flashcardMastery}%

HÃY ĐƯA RA 5 GỢI Ý HỌC TẬP CÁ NHÂN HÓA.

FORMAT (JSON):
[
  {
    "type": "focus|practice|review|break|milestone",
    "priority": "high|medium|low",
    "title": "Tiêu đề ngắn gọn",
    "description": "Mô tả chi tiết",
    "actionUrl": "/study hoặc /exam hoặc /flashcards",
    "estimatedTime": "30 phút"
  }
]

Chỉ trả về JSON.`;
}

function parseRecommendations(content: string): unknown[] {
  try {
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  actionUrl: string;
  estimatedTime: string;
}

function generateRuleBasedRecommendations(analysis: UserAnalysis): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // New user
  if (analysis.totalAttempts < 3) {
    recommendations.push({
      type: 'practice',
      priority: 'high',
      title: 'Bắt đầu với bài thi thử',
      description: 'Hãy làm vài bài thi để chúng tôi hiểu trình độ của bạn và đưa ra gợi ý phù hợp.',
      actionUrl: '/exam',
      estimatedTime: '45 phút',
    });
  }

  // Weak subjects
  if (analysis.weakSubjects.length > 0) {
    recommendations.push({
      type: 'focus',
      priority: 'high',
      title: `Tập trung vào ${analysis.weakSubjects[0]}`,
      description: `Môn ${analysis.weakSubjects[0]} cần cải thiện. Hãy ôn tập lý thuyết và làm thêm bài tập.`,
      actionUrl: '/study',
      estimatedTime: '1 giờ',
    });
  }

  // Declining trend
  if (analysis.trend === 'declining') {
    recommendations.push({
      type: 'review',
      priority: 'high',
      title: 'Ôn lại kiến thức cơ bản',
      description: 'Điểm số gần đây có xu hướng giảm. Hãy ôn lại các khái niệm cơ bản trước khi tiếp tục.',
      actionUrl: '/study',
      estimatedTime: '45 phút',
    });
  }

  // Flashcard reminder
  if (analysis.flashcardMastery < 50) {
    recommendations.push({
      type: 'review',
      priority: 'medium',
      title: 'Ôn tập Flashcard',
      description: 'Flashcard giúp ghi nhớ lâu dài. Hãy dành thời gian ôn tập mỗi ngày.',
      actionUrl: '/flashcards',
      estimatedTime: '15 phút',
    });
  }

  // Topics in progress
  if (analysis.topicsInProgress > 0) {
    recommendations.push({
      type: 'focus',
      priority: 'medium',
      title: 'Hoàn thành bài học đang dở',
      description: `Bạn có ${analysis.topicsInProgress} bài học chưa hoàn thành. Hãy hoàn thành trước khi học mới.`,
      actionUrl: '/study',
      estimatedTime: '30 phút',
    });
  }

  // Good performance
  if (analysis.averageScore >= 80) {
    recommendations.push({
      type: 'milestone',
      priority: 'low',
      title: 'Tuyệt vời! Thử thách nâng cao',
      description: 'Bạn đang làm rất tốt! Hãy thử các đề khó hơn để tiếp tục tiến bộ.',
      actionUrl: '/exam',
      estimatedTime: '60 phút',
    });
  }

  // Default practice
  if (recommendations.length < 3) {
    recommendations.push({
      type: 'practice',
      priority: 'medium',
      title: 'Luyện đề hàng ngày',
      description: 'Làm đề thường xuyên giúp làm quen với format và quản lý thời gian.',
      actionUrl: '/exam',
      estimatedTime: '45 phút',
    });
  }

  return recommendations.slice(0, 5);
}
