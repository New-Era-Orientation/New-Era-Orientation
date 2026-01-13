import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sendPasswordResetEmail } from '@/server/email';
import crypto from 'crypto';

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 3; // Max 3 requests per hour per email

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(email);
  
  if (!record || now > record.resetAt) {
    rateLimitStore.set(email, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email là bắt buộc' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 1 giờ.' },
        { status: 429 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, name: true, email: true },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
      });
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Create new token
    await db.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires,
      },
    });

    // Send email
    const result = await sendPasswordResetEmail(
      normalizedEmail,
      user.name || 'Bạn',
      token
    );

    if (!result.success) {
      console.error('Failed to send password reset email:', result.error);
      // Still return success to prevent enumeration
    }

    return NextResponse.json({
      message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
