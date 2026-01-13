import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";

// Simple in-memory cache for server-side
const cache = new Map<string, { data: unknown; expiry: number }>();

function getFromCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCache(key: string, data: unknown, ttlSeconds: number): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000,
    });
}

// GET - Get homepage statistics (cached)
export async function GET() {
    try {
        // Check cache first
        const cacheKey = "homepage_stats";
        const cached = getFromCache<{
            totalUsers: number;
            totalExams: number;
            totalAttempts: number;
            passRate: number;
        }>(cacheKey);
        
        if (cached) {
            return NextResponse.json({
                success: true,
                data: cached,
                cached: true,
            }, {
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
            });
        }
        
        // Fetch fresh data
        const [totalUsers, totalExams, totalAttempts, passedAttempts] = await Promise.all([
            db.user.count(),
            db.exam.count(),
            db.examAttempt.count(),
            db.examAttempt.count({
                where: {
                    score: { gte: 5 },
                },
            }),
        ]);
        
        const passRate = totalAttempts > 0 
            ? Math.round((passedAttempts / totalAttempts) * 100) 
            : 0;
        
        const data = {
            totalUsers,
            totalExams,
            totalAttempts,
            passRate,
        };
        
        // Cache for 5 minutes
        setCache(cacheKey, data, 300);
        
        return NextResponse.json({
            success: true,
            data,
            cached: false,
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
            },
        });
    } catch (error) {
        console.error("Error fetching stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch stats" },
            { status: 500 }
        );
    }
}
