import { IAuthRepository } from "@/domain/repositories/IAuthRepository";
import { User } from "@/domain/models/User";
import { db } from "@/server/db";
import { compare, hash } from "bcryptjs";

export class PrismaAuthRepository implements IAuthRepository {
    async login(email: string, password: string): Promise<User> {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user || !user.password) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
            throw new Error("Email hoặc mật khẩu không đúng");
        }

        return {
            id: user.id,
            email: user.email!,
            name: user.name,
            image: user.image,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async register(email: string, password: string, name?: string): Promise<User> {
        // Check duplication
        const existing = await db.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error("Email đã được sử dụng");
        }

        const hashedPassword = await hash(password, 12);

        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "STUDENT",
            },
        });

        return {
            id: user.id,
            email: user.email!,
            name: user.name,
            image: user.image,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async getCurrentUser(): Promise<User | null> {
        throw new Error("Method not implemented.");
    }

    async logout(): Promise<void> {
        return Promise.resolve();
    }
}
