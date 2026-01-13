import { NextRequest, NextResponse } from "next/server";
import { RegisterUseCase } from "@/domain/usecases/RegisterUseCase";
import { PrismaAuthRepository } from "@/data/repositories/PrismaAuthRepository";
import { rateLimiters, getClientIP, createRateLimitResponse } from "@/server/lib/rate-limit";

export async function POST(req: NextRequest) {
    // Rate limiting
    const ip = getClientIP(req);
    const rateLimit = rateLimiters.auth.check(ip);
    
    if (!rateLimit.allowed) {
        return createRateLimitResponse(rateLimit.resetAt);
    }

    try {
        const { name, email, password } = await req.json();

        const registerUseCase = new RegisterUseCase(new PrismaAuthRepository());
        const user = await registerUseCase.execute(email, password, name);

        return NextResponse.json(
            {
                message: "Tạo tài khoản thành công",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Register error:", error);
        const message = error instanceof Error ? error.message : "Đã xảy ra lỗi khi tạo tài khoản";
        return NextResponse.json(
            { error: message },
            { status: 400 } // Use 400 for business logic errors (e.g. duplicate email)
        );
    }
}
