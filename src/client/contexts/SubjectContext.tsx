"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { useSession } from "next-auth/react";

// --- Types ---
export type PracticeMode = "CHAPTER" | "TOPIC" | "QUESTION_IDS";

export interface TopicInfo {
    id: string;
    name: string;
    slug: string;
    order: number;
    description?: string | null;
    questionCount?: number;
    metadata?: {
        questionIds?: Record<string, number[]>;
        [key: string]: unknown;
    } | null;
}

export interface ChapterInfo {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    topicCount: number;
    questionCount?: number;
    topics: TopicInfo[];
}

export interface SubjectInfo {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    practiceMode: PracticeMode;
    school: { id: string; name: string; code: string | null } | null;
    chapters: ChapterInfo[];
}

interface SubjectContextType {
    selectedSubjectId: string | null;
    selectedSubject: SubjectInfo | null;
    subjects: SubjectInfo[];
    setSelectedSubjectId: (id: string) => void;
    isLoading: boolean;
    error: string | null;
}

// --- Context ---
const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export function SubjectProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch subjects on mount
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("/api/subjects");
                if (!res.ok) throw new Error("Failed to fetch subjects");
                const json = await res.json();

                if (json.success) {
                    setSubjects(json.data);

                    // Restore selection from localStorage or default to first
                    const savedId = localStorage.getItem("neo_selected_subject_id");
                    if (savedId && json.data.some((s: SubjectInfo) => s.id === savedId)) {
                        setSelectedSubjectId(savedId);
                    } else if (json.data.length > 0) {
                        setSelectedSubjectId(json.data[0].id);
                    }
                } else {
                    setError("Invalid response format");
                }
            } catch (err) {
                console.error("Subject fetch error:", err);
                setError("Có lỗi khi tải danh sách môn học");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubjects();
    }, []);

    // Save selection
    const handleSetSubjectId = (id: string) => {
        setSelectedSubjectId(id);
        localStorage.setItem("neo_selected_subject_id", id);
    };

    // Derived state
    const selectedSubject = useMemo(() =>
        subjects.find(s => s.id === selectedSubjectId) || null,
        [subjects, selectedSubjectId]);

    return (
        <SubjectContext.Provider value={{
            subjects,
            selectedSubjectId,
            selectedSubject,
            setSelectedSubjectId: handleSetSubjectId,
            isLoading,
            error
        }}>
            {children}
        </SubjectContext.Provider>
    );
}

export function useSubject() {
    const context = useContext(SubjectContext);
    if (context === undefined) {
        throw new Error("useSubject must be used within a SubjectProvider");
    }
    return context;
}
