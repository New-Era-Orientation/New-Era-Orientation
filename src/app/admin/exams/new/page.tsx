'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Input } from '@/client/components/ui/Input';

const QuickExamCreator = dynamic(() => import('@/client/components/admin/QuickExamCreator'), {
  loading: () => <div className="p-8 text-center text-gray-500">Đang tải công cụ nhập nhanh...</div>
});

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

interface ExamPart {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  expanded: boolean;
}

export default function NewExamPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');
  const [showQuickCreator, setShowQuickCreator] = useState(false);

  // Exam info
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    subject: 'Tin học',
    year: new Date().getFullYear(),
    source: '',
    type: 'STANDARD' as 'STANDARD' | 'HSG' | 'MOCK',
    duration: 50,
    published: false,
  });

  // Exam parts
  const [parts, setParts] = useState<ExamPart[]>([
    {
      id: '1',
      title: 'Phần 1: Trắc nghiệm',
      description: '28 câu, mỗi câu 0.25 điểm',
      questions: [],
      expanded: true,
    },
  ]);

  const handleQuickImport = (importedQuestions: Question[]) => {
    if (parts.length > 0) {
      // Add to the first part
      const firstPart = parts[0];
      const newQuestions = importedQuestions.map(q => ({ ...q, id: Date.now().toString() + Math.random() }));

      setParts(parts.map(p =>
        p.id === firstPart.id
          ? { ...p, questions: [...p.questions, ...newQuestions] }
          : p
      ));
    }
    setShowQuickCreator(false);
  };

  const addPart = () => {
    const newPart: ExamPart = {
      id: Date.now().toString(),
      title: `Phần ${parts.length + 1}`,
      description: '',
      questions: [],
      expanded: true,
    };
    setParts([...parts, newPart]);
  };

  const removePart = (partId: string) => {
    if (parts.length === 1) return;
    setParts(parts.filter(p => p.id !== partId));
  };

  const togglePartExpand = (partId: string) => {
    setParts(parts.map(p =>
      p.id === partId ? { ...p, expanded: !p.expanded } : p
    ));
  };

  const updatePart = (partId: string, updates: Partial<ExamPart>) => {
    setParts(parts.map(p =>
      p.id === partId ? { ...p, ...updates } : p
    ));
  };

  const addQuestion = (partId: string, type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP') => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      content: '',
      type,
      choices: type === 'MULTIPLE_CHOICE' ? ['', '', '', ''] : [],
      correctAnswer: type === 'MULTIPLE_CHOICE' ? 'A' : '',
      subQuestions: type === 'TRUE_FALSE_GROUP' ? [
        { id: '1', content: '', isCorrect: true },
        { id: '2', content: '', isCorrect: false },
        { id: '3', content: '', isCorrect: true },
        { id: '4', content: '', isCorrect: false },
      ] : undefined,
    };

    setParts(parts.map(p =>
      p.id === partId
        ? { ...p, questions: [...p.questions, newQuestion] }
        : p
    ));
  };

  const removeQuestion = (partId: string, questionId: string) => {
    setParts(parts.map(p =>
      p.id === partId
        ? { ...p, questions: p.questions.filter(q => q.id !== questionId) }
        : p
    ));
  };

  const updateQuestion = (partId: string, questionId: string, updates: Partial<Question>) => {
    setParts(parts.map(p =>
      p.id === partId
        ? {
          ...p,
          questions: p.questions.map(q =>
            q.id === questionId ? { ...q, ...updates } : q
          )
        }
        : p
    ));
  };

  const handleSave = async (publish: boolean = false) => {
    if (!examData.title || !examData.source) {
      alert('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/admin/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...examData,
          published: publish,
          parts: parts.map(p => ({
            title: p.title,
            description: p.description,
            questions: p.questions,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save exam');
      }

      router.push('/admin/exams');
    } catch (error) {
      console.error('Error saving exam:', error);
      alert('Không thể lưu đề thi');
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = parts.reduce((sum, p) => sum + p.questions.length, 0);

  if (showQuickCreator) {
    // Lazy load logic if needed, but for now direct import
    const QuickExamCreator = require('@/client/components/admin/QuickExamCreator').default;
    return <QuickExamCreator onImport={handleQuickImport} onCancel={() => setShowQuickCreator(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/exams"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Tạo đề thi mới
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalQuestions} câu hỏi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={() => setShowQuickCreator(true)}
              >
                <FileText className="w-4 h-4" />
                Nhập nhanh (Azota Style)
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                Lưu nháp
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Đang lưu...' : 'Xuất bản'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-4 border-b border-gray-200 dark:border-gray-700 -mb-px">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'info'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
            >
              Thông tin cơ bản
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition ${activeTab === 'questions'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
            >
              Câu hỏi ({totalQuestions})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {activeTab === 'info' ? (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đề thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiêu đề đề thi *
                  </label>
                  <input
                    type="text"
                    value={examData.title}
                    onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                    placeholder="VD: Đề thi THPT Quốc gia 2025 - Mã đề 101"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={examData.description}
                    onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn về đề thi..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nguồn đề *
                  </label>
                  <input
                    type="text"
                    value={examData.source}
                    onChange={(e) => setExamData({ ...examData, source: e.target.value })}
                    placeholder="VD: Sở GD&ĐT Hà Nội"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Năm
                  </label>
                  <input
                    type="number"
                    value={examData.year}
                    onChange={(e) => setExamData({ ...examData, year: parseInt(e.target.value) })}
                    min={2020}
                    max={2030}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại đề
                  </label>
                  <select
                    value={examData.type}
                    onChange={(e) => setExamData({ ...examData, type: e.target.value as typeof examData.type })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="STANDARD">Tiêu chuẩn (TN THPT)</option>
                    <option value="HSG">Học sinh giỏi</option>
                    <option value="MOCK">Thi thử</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    value={examData.duration}
                    onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) })}
                    min={10}
                    max={180}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button onClick={() => setActiveTab('questions')}>
                  Tiếp tục thêm câu hỏi →
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Parts */}
            {parts.map((part, partIndex) => (
              <Card key={part.id}>
                <CardHeader className="cursor-pointer" onClick={() => togglePartExpand(part.id)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                      <div>
                        <input
                          type="text"
                          value={part.title}
                          onChange={(e) => {
                            e.stopPropagation();
                            updatePart(part.id, { title: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold bg-transparent border-none focus:ring-0 p-0 text-gray-900 dark:text-white"
                        />
                        <p className="text-sm text-gray-500">{part.questions.length} câu hỏi</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {parts.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removePart(part.id);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {part.expanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {part.expanded && (
                  <CardContent className="space-y-4">
                    {/* Questions */}
                    {part.questions.map((question, qIndex) => (
                      <div
                        key={question.id}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
                            {qIndex + 1}
                          </span>
                          <button
                            onClick={() => removeQuestion(part.id, question.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Question content */}
                        <textarea
                          value={question.content}
                          onChange={(e) => updateQuestion(part.id, question.id, { content: e.target.value })}
                          placeholder="Nhập nội dung câu hỏi..."
                          rows={2}
                          className="w-full px-3 py-2 mb-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                        />

                        {question.type === 'MULTIPLE_CHOICE' ? (
                          <div className="grid grid-cols-2 gap-2">
                            {question.choices.map((choice, cIndex) => (
                              <div key={cIndex} className="flex items-center gap-2">
                                <button
                                  onClick={() => updateQuestion(part.id, question.id, {
                                    correctAnswer: String.fromCharCode(65 + cIndex)
                                  })}
                                  className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium transition ${question.correctAnswer === String.fromCharCode(65 + cIndex)
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-500 hover:border-green-500'
                                    }`}
                                >
                                  {String.fromCharCode(65 + cIndex)}
                                </button>
                                <input
                                  type="text"
                                  value={choice}
                                  onChange={(e) => {
                                    const newChoices = [...question.choices];
                                    newChoices[cIndex] = e.target.value;
                                    updateQuestion(part.id, question.id, { choices: newChoices });
                                  }}
                                  placeholder={`Đáp án ${String.fromCharCode(65 + cIndex)}`}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-500 mb-2">Các mệnh đề đúng/sai:</p>
                            {question.subQuestions?.map((sub, sIndex) => (
                              <div key={sub.id} className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 w-6">{String.fromCharCode(97 + sIndex)})</span>
                                <input
                                  type="text"
                                  value={sub.content}
                                  onChange={(e) => {
                                    const newSubs = [...(question.subQuestions || [])];
                                    newSubs[sIndex] = { ...newSubs[sIndex], content: e.target.value };
                                    updateQuestion(part.id, question.id, { subQuestions: newSubs });
                                  }}
                                  placeholder="Nội dung mệnh đề..."
                                  className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                                <button
                                  onClick={() => {
                                    const newSubs = [...(question.subQuestions || [])];
                                    newSubs[sIndex] = { ...newSubs[sIndex], isCorrect: !newSubs[sIndex].isCorrect };
                                    updateQuestion(part.id, question.id, { subQuestions: newSubs });
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${sub.isCorrect
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}
                                >
                                  {sub.isCorrect ? 'Đúng' : 'Sai'}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Add question buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => addQuestion(part.id, 'MULTIPLE_CHOICE')}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm trắc nghiệm
                      </button>
                      <button
                        onClick={() => addQuestion(part.id, 'TRUE_FALSE_GROUP')}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-purple-500 hover:text-purple-600 transition"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm đúng/sai
                      </button>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            {/* Add part button */}
            <button
              onClick={addPart}
              className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Thêm phần mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
