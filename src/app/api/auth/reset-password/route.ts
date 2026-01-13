import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có ít nhất 6 ký tự' },
        { status: 400 }
      );
    }

    // Find valid token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expires) {
      // Delete expired token
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      return NextResponse.json(
        { error: 'Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu link mới.' },
        { status: 400 }
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(password, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Delete the used token
    await db.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    // Delete all other reset tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: resetToken.email },
    });

    return NextResponse.json({
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập với mật khẩu mới.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

// Verify token validity (GET request)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token không được cung cấp' },
        { status: 400 }
      );
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { valid: false, error: 'Token không hợp lệ' },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expires) {
      return NextResponse.json(
        { valid: false, error: 'Token đã hết hạn' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, error: 'Lỗi xác thực token' },
      { status: 500 }
    );
  }
}
