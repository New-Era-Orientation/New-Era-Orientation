import { IAuthRepository } from "../repositories/IAuthRepository";
import { User } from "../models/User";

export class LoginUseCase {
    constructor(private authRepository: IAuthRepository) { }

    async execute(email: string, password: string): Promise<User> {
        if (!email || !password) {
            throw new Error("Email and password are required");
        }
        // Additional business logic can go here (e.g., validation)
        return this.authRepository.login(email, password);
    }
}
