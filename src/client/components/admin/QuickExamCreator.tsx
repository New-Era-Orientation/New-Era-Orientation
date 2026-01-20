'use client';

import { useState, useEffect, useRef } from 'react';
import mammoth from 'mammoth';
import {
    FileText,
    Upload,
    AlertCircle,
    Check,
    X,
    HelpCircle,
    Copy,
    FileType
} from 'lucide-react';
import { Button } from '@/client/components/ui/Button';
import { Card } from '@/client/components/ui/Card';
import { Badge } from '@/client/components/ui/Badge';

// Types from parent
interface Question {
    id: string;
    content: string;
    type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
    choices: string[];
    correctAnswer: string;
    subQuestions?: SubQuestion[];
}

interface SubQuestion {
    id: string;
    content: string;
    isCorrect: boolean;
}

interface QuickExamCreatorProps {
    onImport: (questions: Question[]) => void;
    onCancel: () => void;
}

export default function QuickExamCreator({ onImport, onCancel }: QuickExamCreatorProps) {
    const [text, setText] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parsing Logic
    useEffect(() => {
        if (!text.trim()) {
            setParsedQuestions([]);
            return;
        }

        try {
            const questions = parseDSL(text);
            setParsedQuestions(questions);
            setError(null);
        } catch (err) {
            // Don't error immediately on typing, maybe just show warning or partial results
            console.warn("Parsing error", err);
        }
    }, [text]);

    const parseDSL = (input: string): Question[] => {
        const lines = input.split('\n').map(l => l.trim()).filter(l => l);
        const questions: Question[] = [];
        let currentQ: Partial<Question> | null = null;
        let currentChoices: string[] = [];
        let currentSubs: SubQuestion[] = [];

        // Regex
        const questionStartRegex = /^(Câu|Bài)\s+(\d+)[:.]\s*(.*)/i;
        const choiceRegex = /^([A-D])[.[:]\s+(.*)/i; // A. Content
        const correctRegex = /^\*\s*([A-D])[.[:]\s+(.*)/i; // *A. Content (Correct)

        // True/False Regex
        const tfRegex = /^([a-d])\)\s+(.*)/i; // a) Statement
        const tfCorrectRegex = /^\*\s*([a-d])\)\s+(.*)/i; // *a) Statement (True)

        // Helper to push current question
        const flushQuestion = () => {
            if (currentQ && currentQ.content) {
                if (currentSubs.length > 0) {
                    // True/False Group
                    questions.push({
                        id: Date.now().toString() + Math.random(),
                        content: currentQ.content,
                        type: 'TRUE_FALSE_GROUP',
                        choices: [],
                        correctAnswer: '',
                        subQuestions: currentSubs
                    });
                } else if (currentChoices.length > 0) {
                    // Multiple Choice
                    // Determine correct answer from * mark or Answer Block (not implemented yet for block)
                    // For now assume * mark in choices

                    // If we found a * in user input, it's handled in the loop. 
                    // If no *, default to A or leave empty?

                    questions.push({
                        id: Date.now().toString() + Math.random(),
                        content: currentQ.content,
                        type: 'MULTIPLE_CHOICE',
                        choices: currentChoices,
                        correctAnswer: currentQ.correctAnswer || 'A', // Default
                        subQuestions: []
                    });
                }
            }
        };

        lines.forEach(line => {
            // Check for Question Start
            const qMatch = line.match(questionStartRegex);
            if (qMatch) {
                flushQuestion();
                currentQ = {
                    content: qMatch[3] || `Câu ${qMatch[2]}`
                };
                currentChoices = [];
                currentSubs = [];
                return;
            }

            // Check for Multiple Choice Options
            const correctMatch = line.match(correctRegex);
            const choiceMatch = line.match(choiceRegex);

            if (correctMatch) {
                // It's a correct answer line: *A. Content
                const char = correctMatch[1].toUpperCase();
                const content = correctMatch[2];
                // We store the content. The order matters? 
                // Assuming user inputs A, B, C, D in order.
                currentChoices.push(content);
                if (currentQ) currentQ.correctAnswer = char;
                return;
            }

            if (choiceMatch) {
                const content = choiceMatch[2];
                currentChoices.push(content);
                return;
            }

            // Check for True/False Options (*a), a), etc)
            const tfCorrectMatch = line.match(tfCorrectRegex);
            const tfMatch = line.match(tfRegex);

            if (tfCorrectMatch) {
                currentSubs.push({
                    id: Date.now().toString() + Math.random(),
                    content: tfCorrectMatch[2],
                    isCorrect: true
                });
                return;
            }

            if (tfMatch) {
                currentSubs.push({
                    id: Date.now().toString() + Math.random(),
                    content: tfMatch[2],
                    isCorrect: false
                });
                return;
            }

            // If just text line, append to question content if matches
            if (currentQ && currentChoices.length === 0 && currentSubs.length === 0) {
                currentQ.content += ' ' + line;
            }
        });

        flushQuestion(); // Flush last
        return questions;
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.name.endsWith('.docx')) {
            const arrayBuffer = await file.arrayBuffer();
            try {
                const result = await mammoth.extractRawText({ arrayBuffer });
                setText(text + '\n' + result.value);
            } catch (err) {
                setError('Không thể đọc file DOCX');
            }
        } else {
            // Plain text
            const text = await file.text();
            setText(prev => prev + '\n' + text);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File (DOCX/TXT)
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".docx,.txt"
                            onChange={handleFileUpload}
                        />
                    </div>
                    <div className="text-sm text-gray-500">
                        {parsedQuestions.length} câu hỏi được nhận diện
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel}>Hủy</Button>
                    <Button onClick={() => onImport(parsedQuestions)} disabled={parsedQuestions.length === 0}>
                        <Check className="w-4 h-4 mr-2" />
                        Áp dụng
                    </Button>
                </div>
            </div>

            {/* Content Split */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Preview (Azota Style) */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold mb-4 text-gray-700 dark:text-gray-300">Xem trước</h3>
                    <div className="space-y-4">
                        {parsedQuestions.map((q, i) => (
                            <Card key={q.id || i} className="p-4">
                                <div className="flex gap-3">
                                    <Badge variant="default" className="h-6 w-6 rounded-full flex items-center justify-center p-0">
                                        {i + 1}
                                    </Badge>
                                    <div className="flex-1">
                                        <p className="font-medium mb-3">{q.content}</p>
                                        {q.type === 'MULTIPLE_CHOICE' ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {q.choices.map((c, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-2 rounded border text-sm ${String.fromCharCode(65 + idx) === q.correctAnswer
                                                            ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                                                            : 'border-gray-200 dark:border-gray-700'
                                                            }`}
                                                    >
                                                        <span className="font-bold mr-2">{String.fromCharCode(65 + idx)}.</span>
                                                        {c}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {q.subQuestions?.map((sub, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-sm p-2 bg-gray-100 dark:bg-gray-800 rounded">
                                                        <span>{String.fromCharCode(97 + idx)}) {sub.content}</span>
                                                        <Badge variant={sub.isCorrect ? 'success' : 'error'}>
                                                            {sub.isCorrect ? 'Đúng' : 'Sai'}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                    {parsedQuestions.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <p>Chưa có câu hỏi nào.</p>
                            <p className="text-sm">Paste nội dung hoặc upload file để bắt đầu.</p>
                        </div>
                    )}
                </div>

                {/* Right: Editor */}
                <div className="w-1/2 flex flex-col h-full bg-white dark:bg-gray-800">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
                        <span>Editor (DSL Format)</span>
                        <span className="flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" />
                            Cú pháp chuẩn
                        </span>
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 font-mono text-sm resize-none focus:outline-none bg-transparent"
                        placeholder={`Câu 1. Nội dung câu hỏi...
A. Đáp án A
*B. Đáp án B (Đúng)
C. Đáp án C
D. Đáp án D

Câu 2. Câu hỏi đúng sai...
*a) Mệnh đề đúng
b) Mệnh đề sai`}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
}
