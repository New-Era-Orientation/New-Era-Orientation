import { User } from "../models/User";

export interface IAuthRepository {
    login(email: string, password: string): Promise<User>;
    register(email: string, password: string, name?: string): Promise<User>;
    getCurrentUser(): Promise<User | null>;
    logout(): Promise<void>;
}
