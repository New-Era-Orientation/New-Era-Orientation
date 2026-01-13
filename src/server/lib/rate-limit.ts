/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or Upstash
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  maxRequests: number;
}

class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private config: RateLimiterConfig;

  constructor(config: RateLimiterConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 60 * 1000);
    }
  }

  /**
   * Check if a request should be allowed
   * @param key Unique identifier (IP, email, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(key: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const record = this.store.get(key);

    // No record or expired
    if (!record || now > record.resetAt) {
      const newRecord = {
        count: 1,
        resetAt: now + this.config.windowMs,
      };
      this.store.set(key, newRecord);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetAt: newRecord.resetAt,
      };
    }

    // Check limit
    if (record.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: record.resetAt,
      };
    }

    // Increment count
    record.count++;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetAt: record.resetAt,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // Auth endpoints - 5 requests per minute
  auth: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
  }),

  // Login - 10 attempts per 15 minutes
  login: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  }),

  // Password reset - 3 requests per hour
  passwordReset: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
  }),

  // API general - 100 requests per minute
  api: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),

  // AI Chat - 20 requests per minute
  aiChat: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
  }),

  // Exam submission - 5 per minute (prevent spam)
  examSubmit: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
  }),
};

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Reset': String(resetAt),
      },
    }
  );
}

export { RateLimiter };
