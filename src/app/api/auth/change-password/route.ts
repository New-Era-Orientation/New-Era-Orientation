import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";

// POST /api/auth/change-password - Change user password
export async function POST(request: Request) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { currentPassword, newPassword, confirmPassword } = body;

        // Validate inputs
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ 
                error: "Vui lòng điền đầy đủ thông tin" 
            }, { status: 400 });
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json({ 
                error: "Mật khẩu mới không khớp" 
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ 
                error: "Mật khẩu mới phải có ít nhất 6 ký tự" 
            }, { status: 400 });
        }

        // Get user with password
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                password: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check if user has a password (OAuth users might not)
        if (!user.password) {
            return NextResponse.json({ 
                error: "Tài khoản của bạn sử dụng đăng nhập mạng xã hội và không có mật khẩu" 
            }, { status: 400 });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return NextResponse.json({ 
                error: "Mật khẩu hiện tại không đúng" 
            }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await db.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Mật khẩu đã được thay đổi thành công"
        });
    } catch (error) {
        console.error("Error changing password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
