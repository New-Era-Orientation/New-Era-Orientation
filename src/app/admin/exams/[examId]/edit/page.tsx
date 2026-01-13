'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

interface Choice {
  id?: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

interface Statement {
  id?: string;
  content: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id?: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  content: string;
  order: number;
  choices: Choice[];
  statements: Statement[];
  expanded: boolean;
}

interface Part {
  id?: string;
  name: string;
  order: number;
  questions: Question[];
  expanded: boolean;
}

interface ExamForm {
  title: string;
  description: string;
  duration: number;
  year: number;
  province: string;
  type: string;
  isPublished: boolean;
}

export default function EditExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'questions'>('info');
  
  const [form, setForm] = useState<ExamForm>({
    title: '',
    description: '',
    duration: 90,
    year: new Date().getFullYear(),
    province: '',
    type: 'THPT',
  isPublished: false,
  });
  
  const [parts, setParts] = useState<Part[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchExam();
  }, [examId]);

  const fetchExam = async () => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`);
      if (!res.ok) throw new Error('Failed to fetch exam');
      
      const data = await res.json();
      const exam = data.exam;
      
      setForm({
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        year: exam.year,
        province: exam.province || '',
        type: exam.type || 'THPT',
        isPublished: exam.isPublished,
      });
      
      setParts(exam.parts.map((p: Part & { questions: Question[] }) => ({
        ...p,
        expanded: true,
        questions: p.questions.map((q: Question) => ({
          ...q,
          expanded: false,
          choices: q.choices || [],
          statements: q.statements || [],
        })),
      })));
    } catch (error) {
      console.error('Error fetching exam:', error);
      alert('Không thể tải đề thi');
      router.push('/admin/exams');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Tiêu đề đề thi là bắt buộc';
    }

    if (form.duration < 1) {
      newErrors.duration = 'Thời gian phải lớn hơn 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publish?: boolean) => {
    if (!validateForm()) {
      setActiveTab('info');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        isPublished: publish ?? form.isPublished,
        parts: parts.map(p => ({
          id: p.id,
          name: p.name,
          order: p.order,
          questions: p.questions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            order: q.order,
            choices: q.type === 'MULTIPLE_CHOICE' ? q.choices.map(c => ({
              id: c.id,
              content: c.content,
              isCorrect: c.isCorrect,
              order: c.order,
            })) : undefined,
            statements: q.type === 'TRUE_FALSE_GROUP' ? q.statements.map(s => ({
              id: s.id,
              content: s.content,
              isCorrect: s.isCorrect,
              order: s.order,
            })) : undefined,
          })),
        })),
      };

      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update exam');
      }

      router.push('/admin/exams');
    } catch (error) {
      console.error('Error updating exam:', error);
      alert('Không thể cập nhật đề thi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const addPart = () => {
    setParts([
      ...parts,
      {
        name: `Phần ${parts.length + 1}`,
        order: parts.length + 1,
        questions: [],
        expanded: true,
      },
    ]);
  };

  const removePart = (index: number) => {
    if (!confirm('Xóa phần này và tất cả câu hỏi trong đó?')) return;
    setParts(parts.filter((_, i) => i !== index));
  };

  const addQuestion = (partIndex: number, type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP') => {
    const newParts = [...parts];
    const part = newParts[partIndex];
    
    const newQuestion: Question = {
      type,
      content: '',
      order: part.questions.length + 1,
      expanded: true,
      choices: type === 'MULTIPLE_CHOICE' 
        ? [
            { content: '', isCorrect: true, order: 1 },
            { content: '', isCorrect: false, order: 2 },
            { content: '', isCorrect: false, order: 3 },
            { content: '', isCorrect: false, order: 4 },
          ]
        : [],
      statements: type === 'TRUE_FALSE_GROUP'
        ? [
            { content: '', isCorrect: true, order: 1 },
            { content: '', isCorrect: false, order: 2 },
            { content: '', isCorrect: true, order: 3 },
            { content: '', isCorrect: false, order: 4 },
          ]
        : [],
    };

    part.questions.push(newQuestion);
    setParts(newParts);
  };

  const removeQuestion = (partIndex: number, questionIndex: number) => {
    const newParts = [...parts];
    newParts[partIndex].questions.splice(questionIndex, 1);
    setParts(newParts);
  };

  const togglePart = (index: number) => {
    const newParts = [...parts];
    newParts[index].expanded = !newParts[index].expanded;
    setParts(newParts);
  };

  const toggleQuestion = (partIndex: number, questionIndex: number) => {
    const newParts = [...parts];
    newParts[partIndex].questions[questionIndex].expanded = 
      !newParts[partIndex].questions[questionIndex].expanded;
    setParts(newParts);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Chỉnh sửa đề thi
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Lưu nháp
            </Button>
            <Button onClick={() => handleSubmit(true)} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Xuất bản
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Thông tin cơ bản
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Câu hỏi ({parts.reduce((sum, p) => sum + p.questions.length, 0)})
          </button>
        </div>

        {/* Info Tab */}
        {activeTab === 'info' && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đề thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setForm({ ...form, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Thời gian (phút)
                  </label>
                  <input
                    type="number"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 0 })}
                    min={1}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Năm
                  </label>
                  <input
                    type="number"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || new Date().getFullYear() })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tỉnh/Thành phố
                  </label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => setForm({ ...form, province: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Loại đề
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="THPT">THPT</option>
                    <option value="THCS">THCS</option>
                    <option value="HSG">HSG</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="space-y-4">
            {parts.map((part, partIndex) => (
              <Card key={partIndex}>
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => togglePart(partIndex)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    {part.expanded ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <input
                      type="text"
                      value={part.name}
                      onChange={(e) => {
                        const newParts = [...parts];
                        newParts[partIndex].name = e.target.value;
                        setParts(newParts);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0"
                    />
                    <span className="text-sm text-gray-500">
                      ({part.questions.length} câu)
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePart(partIndex);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {part.expanded && (
                  <CardContent className="border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-4">
                      {part.questions.map((question, qIndex) => (
                        <div
                          key={qIndex}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          <div
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                            onClick={() => toggleQuestion(partIndex, qIndex)}
                          >
                            <div className="flex items-center gap-2">
                              {question.expanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <span className="text-sm font-medium">
                                Câu {qIndex + 1}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                {question.type === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeQuestion(partIndex, qIndex);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {question.expanded && (
                            <div className="p-4 space-y-4">
                              <div>
                                <label className="block text-sm font-medium mb-2">Nội dung câu hỏi</label>
                                <textarea
                                  value={question.content}
                                  onChange={(e) => {
                                    const newParts = [...parts];
                                    newParts[partIndex].questions[qIndex].content = e.target.value;
                                    setParts(newParts);
                                  }}
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                />
                              </div>

                              {question.type === 'MULTIPLE_CHOICE' && (
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">Các đáp án</label>
                                  {question.choices.map((choice, cIndex) => (
                                    <div key={cIndex} className="flex items-center gap-2">
                                      <input
                                        type="radio"
                                        name={`correct-${partIndex}-${qIndex}`}
                                        checked={choice.isCorrect}
                                        onChange={() => {
                                          const newParts = [...parts];
                                          newParts[partIndex].questions[qIndex].choices.forEach((c, i) => {
                                            c.isCorrect = i === cIndex;
                                          });
                                          setParts(newParts);
                                        }}
                                        className="w-4 h-4 text-blue-600"
                                      />
                                      <span className="text-sm font-medium w-6">
                                        {String.fromCharCode(65 + cIndex)}.
                                      </span>
                                      <input
                                        type="text"
                                        value={choice.content}
                                        onChange={(e) => {
                                          const newParts = [...parts];
                                          newParts[partIndex].questions[qIndex].choices[cIndex].content = e.target.value;
                                          setParts(newParts);
                                        }}
                                        className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        placeholder={`Đáp án ${String.fromCharCode(65 + cIndex)}`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {question.type === 'TRUE_FALSE_GROUP' && (
                                <div className="space-y-2">
                                  <label className="block text-sm font-medium">Các phát biểu</label>
                                  {question.statements.map((statement, sIndex) => (
                                    <div key={sIndex} className="flex items-center gap-2">
                                      <span className="text-sm font-medium w-6">
                                        {String.fromCharCode(97 + sIndex)})
                                      </span>
                                      <input
                                        type="text"
                                        value={statement.content}
                                        onChange={(e) => {
                                          const newParts = [...parts];
                                          newParts[partIndex].questions[qIndex].statements[sIndex].content = e.target.value;
                                          setParts(newParts);
                                        }}
                                        className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                                        placeholder={`Phát biểu ${String.fromCharCode(97 + sIndex)}`}
                                      />
                                      <select
                                        value={statement.isCorrect ? 'true' : 'false'}
                                        onChange={(e) => {
                                          const newParts = [...parts];
                                          newParts[partIndex].questions[qIndex].statements[sIndex].isCorrect = e.target.value === 'true';
                                          setParts(newParts);
                                        }}
                                        className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                                      >
                                        <option value="true">Đúng</option>
                                        <option value="false">Sai</option>
                                      </select>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Question Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addQuestion(partIndex, 'MULTIPLE_CHOICE')}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Trắc nghiệm
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addQuestion(partIndex, 'TRUE_FALSE_GROUP')}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Đúng/Sai
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}

            <Button variant="outline" onClick={addPart} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Thêm phần mới
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
