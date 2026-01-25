"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface StudyChapterContextType {
    selectedChapterId: string | null;
    setSelectedChapterId: (id: string | null) => void;
}

const StudyChapterContext = createContext<StudyChapterContextType | undefined>(undefined);

export function StudyChapterProvider({ children }: { children: ReactNode }) {
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

    return (
        <StudyChapterContext.Provider value={{ selectedChapterId, setSelectedChapterId }}>
            {children}
        </StudyChapterContext.Provider>
    );
}

export function useStudyChapter() {
    const context = useContext(StudyChapterContext);
    if (context === undefined) {
        throw new Error("useStudyChapter must be used within a StudyChapterProvider");
    }
    return context;
}
