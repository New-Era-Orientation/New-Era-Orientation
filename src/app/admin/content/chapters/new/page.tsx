'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

interface Subject {
  id: string;
  name: string;
}

export default function NewChapterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSubjectId = searchParams.get('subjectId');

  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    subjectId: presetSubjectId || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

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
      newErrors.name = 'Tên chương là bắt buộc';
    }

    if (!form.slug.trim()) {
      newErrors.slug = 'Slug là bắt buộc';
    }

    if (!form.subjectId) {
      newErrors.subjectId = 'Vui lòng chọn môn học';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'SLUG_EXISTS') {
          setErrors({ slug: 'Slug này đã tồn tại trong môn học' });
          return;
        }
        throw new Error(data.error || 'Failed to create chapter');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Không thể tạo chương. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
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
            Thêm chương mới
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin chương</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Môn học <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.subjectId}
                  onChange={(e) => {
                    setForm({ ...form, subjectId: e.target.value });
                    if (errors.subjectId) setErrors({ ...errors, subjectId: '' });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.subjectId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Chọn môn học</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && (
                  <p className="mt-1 text-sm text-red-500">{errors.subjectId}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên chương <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Chương 1: Hàm số và đồ thị..."
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
                  placeholder="chuong-1-ham-so-va-do-thi"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-500">{errors.slug}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  placeholder="Mô tả ngắn về chương..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </CardContent>
          </Card>

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
              Tạo chương
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
