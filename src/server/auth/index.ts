import NextAuth from "next-auth";
import { authConfig } from "./config";

export const {
    handlers: { GET, POST },
    auth,
    signIn,
    signOut,
} = NextAuth(authConfig);

// Helper to get current user in server components
export async function getCurrentUser() {
    const session = await auth();
    return session?.user;
}

// Type augmentation for NextAuth
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: string;
            email: string;
            name?: string | null;
            image?: string | null;
        };
    }
}
