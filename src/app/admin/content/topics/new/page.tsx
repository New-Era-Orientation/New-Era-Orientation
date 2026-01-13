'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Bold, Italic, List, Code, Image, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

interface Subject {
  id: string;
  name: string;
  chapters: { id: string; name: string }[];
}

interface Chapter {
  id: string;
  name: string;
}

export default function NewTopicPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetChapterId = searchParams.get('chapterId');

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    chapterId: presetChapterId || '',
    content: '',
    summary: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const subject = subjects.find(s => s.id === selectedSubjectId);
    if (subject) {
      setChapters(subject.chapters);
    } else {
      setChapters([]);
    }
  }, [selectedSubjectId, subjects]);

  // If preset chapterId, find and set subject
  useEffect(() => {
    if (presetChapterId && subjects.length > 0) {
      for (const subject of subjects) {
        if (subject.chapters.some(c => c.id === presetChapterId)) {
          setSelectedSubjectId(subject.id);
          break;
        }
      }
    }
  }, [presetChapterId, subjects]);

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/admin/content');
      if (!res.ok) throw new Error('Failed to fetch subjects');
      
      const data = await res.json();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: generateSlug(name),
    });
    if (errors.name) {
      setErrors({ ...errors, name: '' });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Tên bài học là bắt buộc';
    }

    if (!form.slug.trim()) {
      newErrors.slug = 'Slug là bắt buộc';
    }

    if (!form.chapterId) {
      newErrors.chapterId = 'Vui lòng chọn chương';
    }

    if (!form.content.trim()) {
      newErrors.content = 'Nội dung bài học là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = form.content.substring(start, end);
    const newText = form.content.substring(0, start) + prefix + selectedText + suffix + form.content.substring(end);
    
    setForm({ ...form, content: newText });
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'SLUG_EXISTS') {
          setErrors({ slug: 'Slug này đã tồn tại trong chương' });
          return;
        }
        throw new Error(data.error || 'Failed to create topic');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error creating topic:', error);
      alert('Không thể tạo bài học. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Thêm bài học mới
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin bài học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Môn học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setForm({ ...form, chapterId: '' });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn môn học</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chương <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.chapterId}
                    onChange={(e) => {
                      setForm({ ...form, chapterId: e.target.value });
                      if (errors.chapterId) setErrors({ ...errors, chapterId: '' });
                    }}
                    disabled={!selectedSubjectId}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                      errors.chapterId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <option value="">Chọn chương</option>
                    {chapters.map((chapter) => (
                      <option key={chapter.id} value={chapter.id}>
                        {chapter.name}
                      </option>
                    ))}
                  </select>
                  {errors.chapterId && (
                    <p className="mt-1 text-sm text-red-500">{errors.chapterId}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên bài học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ví dụ: Phương trình bậc hai..."
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => {
                      setForm({ ...form, slug: e.target.value });
                      if (errors.slug) setErrors({ ...errors, slug: '' });
                    }}
                    placeholder="phuong-trinh-bac-hai"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
                  )}
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tóm tắt
                  </label>
                  <textarea
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    rows={2}
                    placeholder="Tóm tắt ngắn về bài học..."
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Nội dung bài học</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 dark:border-gray-600 rounded-t-lg bg-gray-50 dark:bg-gray-800">
                  <button
                    type="button"
                    onClick={() => insertFormat('**', '**')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('*', '*')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n- ')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('`', '`')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Code"
                  >
                    <Code className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('\n```\n', '\n```\n')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-xs font-mono"
                    title="Code Block"
                  >
                    {'</>'}
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('[', '](url)')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('![alt](', ')')}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    title="Image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <div className="border-l border-gray-300 dark:border-gray-600 mx-1" />
                  <button
                    type="button"
                    onClick={() => insertFormat('## ')}
                    className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm font-bold"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormat('### ')}
                    className="px-2 py-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm font-bold"
                    title="Heading 3"
                  >
                    H3
                  </button>
                </div>

                {/* Editor */}
                <textarea
                  id="content-editor"
                  value={form.content}
                  onChange={(e) => {
                    setForm({ ...form, content: e.target.value });
                    if (errors.content) setErrors({ ...errors, content: '' });
                  }}
                  rows={20}
                  placeholder="Viết nội dung bài học bằng Markdown..."
                  className={`w-full px-4 py-3 border rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Hỗ trợ Markdown. Sử dụng ## cho tiêu đề, **bold**, *italic*, `code`, v.v.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Link href="/admin/content">
              <Button type="button" variant="outline">
                Hủy
              </Button>
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Tạo bài học
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
