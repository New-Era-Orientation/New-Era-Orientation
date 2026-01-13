export interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    role: "STUDENT" | "TEACHER" | "ADMIN";
    createdAt: Date;
    updatedAt: Date;
}

export type UserRole = User["role"];
