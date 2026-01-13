'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Bold, Italic, List, Code, Image, Link2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

export default function EditTopicPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [breadcrumb, setBreadcrumb] = useState({ subject: '', chapter: '' });
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    content: '',
    summary: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const res = await fetch(`/api/admin/content/topics/${topicId}`);
      if (!res.ok) throw new Error('Failed to fetch topic');
      
      const data = await res.json();
      setForm({
        name: data.topic.name,
        slug: data.topic.slug,
        content: data.topic.content || '',
        summary: data.topic.summary || '',
      });
      setBreadcrumb({
        subject: data.topic.chapter?.subject?.name || '',
        chapter: data.topic.chapter?.name || '',
      });
    } catch (error) {
      console.error('Error fetching topic:', error);
      alert('Không thể tải bài học');
      router.push('/admin/content');
    } finally {
      setLoading(false);
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
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/topics/${topicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'SLUG_EXISTS') {
          setErrors({ slug: 'Slug này đã tồn tại' });
          return;
        }
        throw new Error(data.error || 'Failed to update topic');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error updating topic:', error);
      alert('Không thể cập nhật bài học. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
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
            Chỉnh sửa bài học
          </h1>
          {(breadcrumb.subject || breadcrumb.chapter) && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {breadcrumb.subject} {breadcrumb.subject && breadcrumb.chapter && '→'} {breadcrumb.chapter}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin bài học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tên bài học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
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
                  className={`w-full px-4 py-3 border rounded-b-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.content && (
                  <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                )}
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
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
