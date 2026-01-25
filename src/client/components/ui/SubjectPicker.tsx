"use client";

import { useSubject } from "@/client/contexts/SubjectContext";
import { ChevronDown, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function SubjectPicker() {
    const { selectedSubject, subjects, setSelectedSubjectId, isLoading } = useSubject();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Đang tải...</span>
            </div>
        );
    }

    // Group subjects by school
    // THPT subjects: No school OR School Code is "THPT"
    const thptSubjects = subjects.filter(s => !s.school || s.school.code === "THPT");

    // Other subjects: Have school AND Code is NOT "THPT"
    const schoolGroups = subjects
        .filter(s => s.school && s.school.code !== "THPT")
        .reduce((acc, s) => {
            const key = s.school!.name;
            if (!acc[key]) acc[key] = [];
            acc[key].push(s);
            return acc;
        }, {} as Record<string, typeof subjects>);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
            >
                <span className="text-lg">{selectedSubject?.icon || "📚"}</span>
                <span className="font-medium text-foreground max-w-[150px] truncate">
                    {selectedSubject?.name || "Chọn môn học"}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg z-50">
                    {/* THPT Subjects */}
                    {thptSubjects.length > 0 && (
                        <div>
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                                THPT
                            </div>
                            {thptSubjects.map(subject => (
                                <button
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubjectId(subject.id);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors ${selectedSubject?.id === subject.id ? "bg-primary/10 text-primary" : "text-foreground"
                                        }`}
                                >
                                    <span className="text-lg">{subject.icon || "📘"}</span>
                                    <span className="font-medium truncate">{subject.name}</span>
                                    {selectedSubject?.id === subject.id && (
                                        <span className="ml-auto text-primary">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* School Groups */}
                    {Object.entries(schoolGroups).map(([schoolName, schoolSubjects]) => (
                        <div key={schoolName}>
                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50">
                                {schoolName}
                            </div>
                            {schoolSubjects.map(subject => (
                                <button
                                    key={subject.id}
                                    onClick={() => {
                                        setSelectedSubjectId(subject.id);
                                        setOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary transition-colors ${selectedSubject?.id === subject.id ? "bg-primary/10 text-primary" : "text-foreground"
                                        }`}
                                >
                                    <span className="text-lg">{subject.icon || "📘"}</span>
                                    <span className="font-medium truncate">{subject.name}</span>
                                    {selectedSubject?.id === subject.id && (
                                        <span className="ml-auto text-primary">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
