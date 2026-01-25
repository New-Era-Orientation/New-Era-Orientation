/**
 * Exam Data Types & API Functions
 * 
 * Sử dụng API thay vì import trực tiếp từ JSON file
 */

// ============ TYPES ============

export interface Exam {
    id: string;
    title: string;
    slug: string;
    year: number;
    source: string;
    type: "HSG" | "STANDARD" | "MOCK";
    duration: number;
    questionCount?: number;
    parts?: ExamPart[];
}

export interface ExamPart {
    id: number;
    title: string;
    questions: Question[];
}

export interface Question {
    id: string;
    num: number;
    content: string;
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE_GROUP";
    track: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS";
    choices?: string[];
    subQuestions?: SubQuestion[];
    correctAnswer?: string;
    points?: number;
}

export interface SubQuestion {
    id: string;
    content: string;
    isCorrect: boolean;
}

export interface ExamListResponse {
    exams: Exam[];
    pagination: {
        page: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
    };
}

export interface ExamSubmitRequest {
    answers: Record<string, string | Record<string, boolean>>;
    duration: number;
    track?: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS";
    startedAt?: string;
}

export interface ExamSubmitResponse {
    success: boolean;
    data?: {
        attemptId: string;
        score: number;
        maxScore: number;
        percentage: number;
        results: Record<string, unknown>;
        timeSpent: number;
    };
    error?: string;
}

// ============ API FUNCTIONS ============

const API_BASE = "/api";

/**
 * Lấy danh sách đề thi với phân trang và filter
 */
export async function fetchExams(params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    year?: number;
    search?: string;
    subjectId?: string;
}): Promise<ExamListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.pageSize) searchParams.set("pageSize", params.pageSize.toString());
    if (params?.type) searchParams.set("type", params.type);
    if (params?.year) searchParams.set("year", params.year.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.subjectId) searchParams.set("subjectId", params.subjectId);

    const url = `${API_BASE}/exams?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch exams");
    }

    return response.json();
}

/**
 * Lấy chi tiết một đề thi theo slug
 */
export async function fetchExamBySlug(slug: string): Promise<Exam | null> {
    const response = await fetch(`${API_BASE}/exams/${slug}`);

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error("Failed to fetch exam");
    }

    return response.json();
}

/**
 * Nộp bài thi
 */
export async function submitExam(
    slug: string,
    data: ExamSubmitRequest
): Promise<ExamSubmitResponse> {
    const response = await fetch(`${API_BASE}/exams/${slug}/submit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit exam");
    }

    return response.json();
}

// ============ LEGACY FUNCTIONS (for backward compatibility) ============

import examData from "@/server/data/exam-ninh-binh.json";

export function transformExamData(data: Record<string, unknown>): Exam {
    return {
        id: data.slug as string,
        title: data.title as string,
        slug: data.slug as string,
        year: data.year as number,
        source: data.source as string,
        type: data.type as "HSG" | "STANDARD" | "MOCK",
        duration: data.duration as number,
        parts: (data.parts as ExamPart[]) || [],
    };
}

/**
 * @deprecated Use fetchExams() instead
 */
export function getAllExams(): Exam[] {
    return [transformExamData(examData as Record<string, unknown>)];
}

/**
 * @deprecated Use fetchExamBySlug() instead
 */
export function getExamBySlug(slug: string): Exam | null {
    const exams = getAllExams();
    return exams.find((exam) => exam.slug === slug) || null;
}
