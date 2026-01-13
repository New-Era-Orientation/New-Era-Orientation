import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

// Cost per 1000 tokens (approximate)
const COST_PER_1K_TOKENS = {
  'gemini-1.5-flash': 0.000075, // $0.075 per 1M tokens
  'gemini-1.5-pro': 0.00125,    // $1.25 per 1M tokens
  'gpt-4o-mini': 0.00015,       // $0.15 per 1M input
  'gpt-4o': 0.005,              // $5 per 1M input
};

// GET - Get user's AI usage stats
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, all

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Get usage stats
    const [totalUsage, usageByProvider, usageByFeature, dailyUsage] = await Promise.all([
      // Total tokens and cost
      db.aIUsage.aggregate({
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _sum: {
          tokens: true,
          cost: true,
        },
        _count: true,
      }),

      // Group by provider
      db.aIUsage.groupBy({
        by: ['provider'],
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _sum: {
          tokens: true,
          cost: true,
        },
        _count: true,
      }),

      // Group by feature
      db.aIUsage.groupBy({
        by: ['feature'],
        where: {
          userId: session.user.id,
          createdAt: { gte: startDate },
        },
        _sum: {
          tokens: true,
        },
        _count: true,
      }),

      // Daily breakdown (last 7 days)
      db.aIUsage.groupBy({
        by: ['createdAt'],
        where: {
          userId: session.user.id,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        _sum: {
          tokens: true,
        },
      }),
    ]);

    // Get usage limit (could be from user tier/subscription)
    const MONTHLY_TOKEN_LIMIT = 100000; // 100k tokens per month free
    const monthlyUsage = await db.aIUsage.aggregate({
      where: {
        userId: session.user.id,
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
      _sum: {
        tokens: true,
      },
    });

    const usedTokens = monthlyUsage._sum.tokens || 0;
    const remainingTokens = Math.max(0, MONTHLY_TOKEN_LIMIT - usedTokens);
    const usagePercentage = Math.min(100, (usedTokens / MONTHLY_TOKEN_LIMIT) * 100);

    return NextResponse.json({
      success: true,
      period,
      summary: {
        totalTokens: totalUsage._sum.tokens || 0,
        totalCost: totalUsage._sum.cost || 0,
        requestCount: totalUsage._count,
      },
      limits: {
        monthlyLimit: MONTHLY_TOKEN_LIMIT,
        used: usedTokens,
        remaining: remainingTokens,
        percentage: Math.round(usagePercentage),
      },
      byProvider: usageByProvider.map(p => ({
        provider: p.provider,
        tokens: p._sum.tokens || 0,
        cost: p._sum.cost || 0,
        count: p._count,
      })),
      byFeature: usageByFeature.map(f => ({
        feature: f.feature,
        tokens: f._sum.tokens || 0,
        count: f._count,
      })),
    });
  } catch (error) {
    console.error('Error getting AI usage:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}

// Helper function to record usage (called by other AI endpoints)
export async function recordAIUsage(
  userId: string,
  provider: string,
  model: string,
  feature: string,
  tokens: number
) {
  const costPer1K = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS] || 0.0001;
  const cost = (tokens / 1000) * costPer1K;

  await db.aIUsage.create({
    data: {
      userId,
      provider,
      model,
      feature,
      tokens,
      cost,
    },
  });

  return { tokens, cost };
}
