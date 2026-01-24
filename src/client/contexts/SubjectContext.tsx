"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { useSession } from "next-auth/react";

interface SubjectInfo {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    school: { id: string; name: string; code: string | null } | null;
    chapters: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        topicCount: number;
        topics: {
            id: string;
            name: string;
            slug: string;
            order: number;
        }[];
    }[];
}

interface SubjectContextType {
    selectedSubjectId: string | null;
    selectedSubject: SubjectInfo | null;
    subjects: SubjectInfo[];
    setSelectedSubjectId: (id: string) => void;
    isLoading: boolean;
}

const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

export function SubjectProvider({ children }: { children: ReactNode }) {
    const { data: session } = useSession();
    const [selectedSubjectId, setSelectedSubjectIdState] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<SubjectInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch subjects
                const subjectsRes = await fetch("/api/subjects");
                let fetchedSubjects: SubjectInfo[] = [];
                if (subjectsRes.ok) {
                    const data = await subjectsRes.json();
                    fetchedSubjects = data.data || [];
                    setSubjects(fetchedSubjects);
                }

                // Determine selected subject
                let subjectIdToSet: string | null = null;

                // 1. Try URL param (if any - though usually handled by page)

                // 2. Try API settings (Logged in user)
                try {
                    const settingsRes = await fetch("/api/settings");
                    if (settingsRes.ok) {
                        const data = await settingsRes.json();
                        if (data.settings?.selectedSubjectId) {
                            subjectIdToSet = data.settings.selectedSubjectId;
                        }
                    }
                } catch (e) {
                    // Ignore API error (guest)
                }

                // 3. Try LocalStorage (Guest / Fallback)
                if (!subjectIdToSet) {
                    const localId = localStorage.getItem("selectedSubjectId");
                    if (localId) {
                        // Verify it exists in fetched subjects
                        if (fetchedSubjects.some(s => s.id === localId)) {
                            subjectIdToSet = localId;
                        }
                    }
                }

                // 4. Default to "tin-hoc-thpt"
                if (!subjectIdToSet) {
                    const defaultSubject = fetchedSubjects.find((s: SubjectInfo) => s.slug === "tin-hoc-thpt");
                    if (defaultSubject) {
                        subjectIdToSet = defaultSubject.id;
                    }
                }

                if (subjectIdToSet) {
                    setSelectedSubjectIdState(subjectIdToSet);
                }
            } catch (error) {
                console.error("SubjectContext: Failed to fetch data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const setSelectedSubjectId = useCallback(async (id: string) => {
        setSelectedSubjectIdState(id);

        // Persist to LocalStorage (Always)
        localStorage.setItem("selectedSubjectId", id);

        // Persist to API (Only if logged in)
        if (session?.user) {
            try {
                await fetch("/api/settings", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ selectedSubjectId: id }),
                });
            } catch (error) {
                // Network error - acceptable
            }
        }
    }, [session]);

    const selectedSubject = subjects.find(s => s.id === selectedSubjectId) || null;

    return (
        <SubjectContext.Provider value={{
            selectedSubjectId,
            selectedSubject,
            subjects,
            setSelectedSubjectId,
            isLoading,
        }}>
            {children}
        </SubjectContext.Provider>
    );
}

export function useSubject() {
    const context = useContext(SubjectContext);
    if (!context) {
        throw new Error("useSubject must be used within SubjectProvider");
    }
    return context;
}
