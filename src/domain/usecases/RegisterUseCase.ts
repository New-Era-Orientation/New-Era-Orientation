import { IAuthRepository } from "../repositories/IAuthRepository";
import { User } from "../models/User";

export class RegisterUseCase {
    constructor(private authRepository: IAuthRepository) { }

    async execute(email: string, password: string, name?: string): Promise<User> {
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        if (password.length < 8) {
            throw new Error("Password must be at least 8 characters");
        }

        // Check if user exists? Usually repository handles unique constraint or we do it here.
        // Ideally: check existence first.
        // For now, let repository handle it or simple implementation.

        return this.authRepository.register(email, password, name);
    }
}
