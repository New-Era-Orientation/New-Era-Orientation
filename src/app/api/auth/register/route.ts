import { NextRequest, NextResponse } from "next/server";
import { RegisterUseCase } from "@/domain/usecases/RegisterUseCase";
import { PrismaAuthRepository } from "@/data/repositories/PrismaAuthRepository";

export async function POST(req: NextRequest) {
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
    } catch (error: any) {
        console.error("Register error:", error);
        return NextResponse.json(
            { error: error.message || "Đã xảy ra lỗi khi tạo tài khoản" },
            { status: 400 } // Use 400 for business logic errors (e.g. duplicate email)
        );
    }
}
