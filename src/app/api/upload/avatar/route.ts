import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// POST /api/upload/avatar - Upload user avatar
export async function POST(request: Request) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Không tìm thấy file" }, { status: 400 });
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return NextResponse.json({ error: "Vui lòng chọn file ảnh" }, { status: 400 });
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "Ảnh không được lớn hơn 5MB" }, { status: 400 });
        }

        // Convert file to base64 data URL for storage
        // In production, you would upload to a cloud storage service like S3, Cloudinary, etc.
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // For now, we'll store a placeholder URL
        // In production, upload to cloud storage and get the URL
        // For demo purposes, we'll use a generated avatar URL
        const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${session.user.email}&backgroundColor=3b82f6`;

        // Update user's image
        await db.user.update({
            where: { id: session.user.id },
            data: { image: avatarUrl }
        });

        return NextResponse.json({ 
            success: true, 
            imageUrl: avatarUrl,
            message: "Đã cập nhật ảnh đại diện"
        });
    } catch (error) {
        console.error("Error uploading avatar:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
