'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  Download,
  Save,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Edit3,
  Split,
  Columns,
  FileUp,
} from 'lucide-react';

// ============================================
// Types
// ============================================

interface ExamChoice {
  label: string;
  content: string;
  isCorrect: boolean;
}

interface ExamQuestion {
  id: string;
  order: number;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  choices: ExamChoice[];
  correctAnswer?: string;
  images?: string[];
  explanation?: string;
}

interface ExamPart {
  id: string;
  name: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  questions: ExamQuestion[];
}

interface ExamData {
  title: string;
  subject?: string;
  year?: number;
  duration: number;
  province?: string;
  source?: string;
  parts: ExamPart[];
}

interface ParsedImage {
  id: string;
  contentType: string;
  data: string;
}

// ============================================
// Utilities
// ============================================

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function createEmptyQuestion(order: number, type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP' = 'MULTIPLE_CHOICE'): ExamQuestion {
  return {
    id: generateId(),
    order,
    content: '',
    type,
    choices: type === 'MULTIPLE_CHOICE' 
      ? [
          { label: 'A', content: '', isCorrect: false },
          { label: 'B', content: '', isCorrect: false },
          { label: 'C', content: '', isCorrect: false },
          { label: 'D', content: '', isCorrect: false },
        ]
      : [
          { label: 'a', content: '', isCorrect: false },
          { label: 'b', content: '', isCorrect: false },
          { label: 'c', content: '', isCorrect: false },
          { label: 'd', content: '', isCorrect: false },
        ],
  };
}

function createEmptyExam(): ExamData {
  return {
    title: 'Đề thi mới',
    duration: 50,
    parts: [
      {
        id: generateId(),
        name: 'Phần I: Trắc nghiệm nhiều lựa chọn',
        type: 'MULTIPLE_CHOICE',
        questions: [createEmptyQuestion(1)],
      },
    ],
  };
}

// ============================================
// Text Format Conversion
// ============================================

function examToText(exam: ExamData): string {
  const lines: string[] = [];

  // Metadata
  if (exam.title) lines.push(`Tiêu đề: ${exam.title}`);
  if (exam.subject) lines.push(`Môn: ${exam.subject}`);
  if (exam.year) lines.push(`Năm: ${exam.year}`);
  if (exam.duration) lines.push(`Thời gian: ${exam.duration}`);
  if (exam.province) lines.push(`Tỉnh: ${exam.province}`);
  if (exam.source) lines.push(`Nguồn: ${exam.source}`);
  
  if (lines.length > 0) lines.push('');

  // Parts and questions
  for (const part of exam.parts) {
    lines.push(part.name);
    lines.push('');

    for (const question of part.questions) {
      lines.push(`Câu ${question.order}: ${question.content}`);
      
      for (const choice of question.choices) {
        const marker = choice.isCorrect ? '**' : '';
        lines.push(`${marker}${choice.label}. ${choice.content}${marker}`);
      }
      
      if (question.explanation) {
        lines.push(`Giải thích: ${question.explanation}`);
      }
      
      lines.push('');
    }
  }

  return lines.join('\n');
}

function textToExam(text: string): ExamData {
  const lines = text.split('\n');
  const exam: ExamData = {
    title: 'Đề thi mới',
    duration: 50,
    parts: [],
  };

  let currentPart: ExamPart | null = null;
  let currentQuestion: ExamQuestion | null = null;
  let questionOrder = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Metadata
    if (line.startsWith('Tiêu đề:')) {
      exam.title = line.replace('Tiêu đề:', '').trim();
      continue;
    }
    if (line.startsWith('Môn:')) {
      exam.subject = line.replace('Môn:', '').trim();
      continue;
    }
    if (line.startsWith('Năm:')) {
      exam.year = parseInt(line.replace('Năm:', '').trim()) || undefined;
      continue;
    }
    if (line.startsWith('Thời gian:')) {
      exam.duration = parseInt(line.replace('Thời gian:', '').trim()) || 50;
      continue;
    }
    if (line.startsWith('Tỉnh:')) {
      exam.province = line.replace('Tỉnh:', '').trim();
      continue;
    }
    if (line.startsWith('Nguồn:')) {
      exam.source = line.replace('Nguồn:', '').trim();
      continue;
    }

    // Part header
    const partMatch = line.match(/^PH[ẦAÀ]N\s*(I{1,2}|[12])[:.]\s*(.*)?$/iu);
    if (partMatch) {
      if (currentQuestion && currentPart) {
        currentPart.questions.push(currentQuestion);
        currentQuestion = null;
      }

      const partNum = partMatch[1];
      const partName = partMatch[2]?.trim() || (
        partNum === '1' || partNum === 'I' 
          ? 'Trắc nghiệm nhiều lựa chọn' 
          : 'Trắc nghiệm đúng sai'
      );
      
      currentPart = {
        id: generateId(),
        name: `Phần ${partNum === 'I' || partNum === '1' ? 'I' : 'II'}: ${partName}`,
        type: partNum === '1' || partNum === 'I' ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE_GROUP',
        questions: [],
      };
      exam.parts.push(currentPart);
      questionOrder = 0;
      continue;
    }

    // Question
    const questionMatch = line.match(/^(?:C[âaà]u\s*)?(\d+)[.:]\s*(.*)$/iu);
    if (questionMatch) {
      if (currentQuestion && currentPart) {
        currentPart.questions.push(currentQuestion);
      }

      if (!currentPart) {
        currentPart = {
          id: generateId(),
          name: 'Phần I: Trắc nghiệm nhiều lựa chọn',
          type: 'MULTIPLE_CHOICE',
          questions: [],
        };
        exam.parts.push(currentPart);
      }

      questionOrder++;
      currentQuestion = {
        id: generateId(),
        order: questionOrder,
        content: questionMatch[2].trim(),
        type: currentPart.type,
        choices: [],
      };
      continue;
    }

    // Choice
    const choiceMatch = line.match(/^(\*\*)?([A-Da-d])[.)]\s*(.+?)(\*\*)?$/);
    if (choiceMatch && currentQuestion) {
      const isCorrect = !!choiceMatch[1] || !!choiceMatch[4];
      const label = choiceMatch[2].toUpperCase();
      const content = choiceMatch[3].trim();

      currentQuestion.choices.push({
        label,
        content,
        isCorrect,
      });

      if (isCorrect) {
        currentQuestion.correctAnswer = label;
      }
      continue;
    }

    // Answer marker
    const answerMatch = line.match(/^[Đđ][áa]p\s*[áa]n[:\s]+([A-D])/i);
    if (answerMatch && currentQuestion) {
      const correctLabel = answerMatch[1].toUpperCase();
      currentQuestion.correctAnswer = correctLabel;
      for (const choice of currentQuestion.choices) {
        choice.isCorrect = choice.label === correctLabel;
      }
      continue;
    }

    // Explanation
    if (line.startsWith('Giải thích:') && currentQuestion) {
      currentQuestion.explanation = line.replace('Giải thích:', '').trim();
      continue;
    }

    // Continue question content
    if (currentQuestion && !line.match(/^[A-Da-d][.)]/)) {
      currentQuestion.content += ' ' + line;
    }
  }

  // Save last question
  if (currentQuestion && currentPart) {
    currentPart.questions.push(currentQuestion);
  }

  return exam;
}

// ============================================
// Components
// ============================================

function QuestionCard({ 
  question, 
  partType,
  onUpdate, 
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  question: ExamQuestion;
  partType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  onUpdate: (question: ExamQuestion) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(true);

  const handleChoiceCorrect = (label: string) => {
    const updatedChoices = question.choices.map(c => ({
      ...c,
      isCorrect: c.label === label,
    }));
    onUpdate({
      ...question,
      choices: updatedChoices,
      correctAnswer: label,
    });
  };

  const handleChoiceContent = (label: string, content: string) => {
    const updatedChoices = question.choices.map(c => 
      c.label === label ? { ...c, content } : c
    );
    onUpdate({ ...question, choices: updatedChoices });
  };

  return (
    <div className="border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 font-medium text-gray-900 dark:text-white"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          <span>Câu {question.order}</span>
          {question.correctAnswer && (
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded">
              Đáp án: {question.correctAnswer}
            </span>
          )}
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
            title="Di chuyển lên"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
            title="Di chuyển xuống"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Xóa câu hỏi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nội dung câu hỏi
            </label>
            <textarea
              value={question.content}
              onChange={(e) => onUpdate({ ...question, content: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* Choices */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Đáp án (click để chọn đáp án đúng)
            </label>
            <div className="space-y-2">
              {question.choices.map((choice, choiceIndex) => (
                <div key={`${question.id}-choice-${choiceIndex}`} className="flex items-start gap-2">
                  <button
                    onClick={() => handleChoiceCorrect(choice.label)}
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium transition-colors ${
                      choice.isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-green-100'
                    }`}
                    title={choice.isCorrect ? 'Đáp án đúng' : 'Click để chọn làm đáp án đúng'}
                  >
                    {choice.label}
                  </button>
                  <input
                    type="text"
                    value={choice.content}
                    onChange={(e) => handleChoiceContent(choice.label, e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder={`Nội dung đáp án ${choice.label}...`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Giải thích (tùy chọn)
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => onUpdate({ ...question, explanation: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Nhập giải thích cho đáp án..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Page Component
// ============================================

export default function ExamEditorPage() {
  // State
  const [exam, setExam] = useState<ExamData>(createEmptyExam());
  const [textContent, setTextContent] = useState('');
  const [images, setImages] = useState<ParsedImage[]>([]);
  const [activeView, setActiveView] = useState<'split' | 'form' | 'text'>('split');
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync text when exam changes (from form)
  const syncTextFromExam = useCallback(() => {
    setSyncing(true);
    const text = examToText(exam);
    setTextContent(text);
    setTimeout(() => setSyncing(false), 300);
  }, [exam]);

  // Sync exam when text changes (from text editor)
  const syncExamFromText = useCallback(() => {
    setSyncing(true);
    try {
      const parsed = textToExam(textContent);
      setExam(parsed);
    } catch (e) {
      console.error('Parse error:', e);
    }
    setTimeout(() => setSyncing(false), 300);
  }, [textContent]);

  // Initial sync
  useEffect(() => {
    syncTextFromExam();
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/exam-editor/parse', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setTextContent(data.text);
      if (data.images) {
        setImages(data.images);
      }

      // Parse to exam structure
      const parsed = textToExam(data.text);
      setExam(parsed);
      setHasUnsavedChanges(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Question handlers
  const handleAddQuestion = (partIndex: number) => {
    const updatedParts = [...exam.parts];
    const part = updatedParts[partIndex];
    const newOrder = part.questions.length + 1;
    part.questions.push(createEmptyQuestion(newOrder, part.type));
    setExam({ ...exam, parts: updatedParts });
    setHasUnsavedChanges(true);
  };

  const handleUpdateQuestion = (partIndex: number, questionIndex: number, updated: ExamQuestion) => {
    const updatedParts = [...exam.parts];
    updatedParts[partIndex].questions[questionIndex] = updated;
    setExam({ ...exam, parts: updatedParts });
    setHasUnsavedChanges(true);
  };

  const handleDeleteQuestion = (partIndex: number, questionIndex: number) => {
    const updatedParts = [...exam.parts];
    updatedParts[partIndex].questions.splice(questionIndex, 1);
    // Re-order
    updatedParts[partIndex].questions.forEach((q, i) => {
      q.order = i + 1;
    });
    setExam({ ...exam, parts: updatedParts });
    setHasUnsavedChanges(true);
  };

  const handleMoveQuestion = (partIndex: number, questionIndex: number, direction: 'up' | 'down') => {
    const updatedParts = [...exam.parts];
    const questions = updatedParts[partIndex].questions;
    const newIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
    
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    [questions[questionIndex], questions[newIndex]] = [questions[newIndex], questions[questionIndex]];
    questions.forEach((q, i) => {
      q.order = i + 1;
    });
    
    setExam({ ...exam, parts: updatedParts });
    setHasUnsavedChanges(true);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Download as text
  const handleDownload = () => {
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title || 'exam'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const totalQuestions = exam.parts.reduce((sum, p) => sum + p.questions.length, 0);
  const answeredQuestions = exam.parts.reduce(
    (sum, p) => sum + p.questions.filter(q => q.correctAnswer).length, 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/import-export"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exam Editor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalQuestions} câu hỏi • {answeredQuestions} có đáp án
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setActiveView('form')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeView === 'form'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveView('split')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeView === 'split'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Columns className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveView('text')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeView === 'text'
                    ? 'bg-white dark:bg-gray-600 shadow'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileUp className="w-4 h-4" />
              )}
              Upload DOCX
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Tải về
            </button>
          </div>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Main content */}
      <div className={`flex ${activeView === 'split' ? 'divide-x dark:divide-gray-700' : ''}`}>
        {/* Left Panel - Form Editor */}
        {(activeView === 'form' || activeView === 'split') && (
          <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} h-[calc(100vh-73px)] overflow-y-auto`}>
            <div className="p-4 space-y-4">
              {/* Exam metadata */}
              <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 space-y-4">
                <h2 className="font-medium text-gray-900 dark:text-white">Thông tin đề thi</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tiêu đề</label>
                    <input
                      type="text"
                      value={exam.title}
                      onChange={(e) => {
                        setExam({ ...exam, title: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Môn học</label>
                    <input
                      type="text"
                      value={exam.subject || ''}
                      onChange={(e) => {
                        setExam({ ...exam, subject: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="VD: Tin học"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Năm</label>
                    <input
                      type="number"
                      value={exam.year || ''}
                      onChange={(e) => {
                        setExam({ ...exam, year: parseInt(e.target.value) || undefined });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="2025"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Thời gian (phút)</label>
                    <input
                      type="number"
                      value={exam.duration}
                      onChange={(e) => {
                        setExam({ ...exam, duration: parseInt(e.target.value) || 50 });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Tỉnh/Thành</label>
                    <input
                      type="text"
                      value={exam.province || ''}
                      onChange={(e) => {
                        setExam({ ...exam, province: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="VD: Hà Nội"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Nguồn</label>
                    <input
                      type="text"
                      value={exam.source || ''}
                      onChange={(e) => {
                        setExam({ ...exam, source: e.target.value });
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="VD: Sở GD&ĐT Hà Nội"
                    />
                  </div>
                </div>
              </div>

              {/* Parts & Questions */}
              {exam.parts.map((part, partIndex) => (
                <div key={part.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium text-gray-900 dark:text-white">{part.name}</h2>
                    <span className="text-sm text-gray-500">{part.questions.length} câu</span>
                  </div>

                  {part.questions.map((question, qIndex) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      partType={part.type}
                      onUpdate={(updated) => handleUpdateQuestion(partIndex, qIndex, updated)}
                      onDelete={() => handleDeleteQuestion(partIndex, qIndex)}
                      onMoveUp={() => handleMoveQuestion(partIndex, qIndex, 'up')}
                      onMoveDown={() => handleMoveQuestion(partIndex, qIndex, 'down')}
                      isFirst={qIndex === 0}
                      isLast={qIndex === part.questions.length - 1}
                    />
                  ))}

                  <button
                    onClick={() => handleAddQuestion(partIndex)}
                    className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm câu hỏi
                  </button>
                </div>
              ))}

              {/* Sync button */}
              <button
                onClick={syncTextFromExam}
                disabled={syncing}
                className="w-full py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Đồng bộ sang Text
              </button>
            </div>
          </div>
        )}

        {/* Right Panel - Text Editor */}
        {(activeView === 'text' || activeView === 'split') && (
          <div className={`${activeView === 'split' ? 'w-1/2' : 'w-full'} h-[calc(100vh-73px)] flex flex-col`}>
            {/* Text editor toolbar */}
            <div className="px-4 py-2 border-b dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Format: **đáp án đúng**
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={syncExamFromText}
                  disabled={syncing}
                  className="flex items-center gap-1 px-2 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
                  Sync to Form
                </button>
              </div>
            </div>

            {/* Text area */}
            <textarea
              value={textContent}
              onChange={(e) => {
                setTextContent(e.target.value);
                setHasUnsavedChanges(true);
              }}
              className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:outline-none"
              placeholder={`Tiêu đề: Đề thi mới
Môn: Tin học
Năm: 2025
Thời gian: 50

Phần I: Trắc nghiệm nhiều lựa chọn

Câu 1: Nội dung câu hỏi?
A. Đáp án A
**B. Đáp án B (đúng)**
C. Đáp án C
D. Đáp án D

Câu 2: ...`}
              spellCheck={false}
            />

            {/* Images panel (if any) */}
            {images.length > 0 && (
              <div className="border-t dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <ImageIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hình ảnh ({images.length})
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((img) => (
                    <img
                      key={img.id}
                      src={`data:${img.contentType};base64,${img.data}`}
                      alt={img.id}
                      className="h-16 rounded border dark:border-gray-600 cursor-pointer hover:opacity-80"
                      title={img.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
