'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

const ICON_OPTIONS = [
  '📚', '📖', '📝', '📐', '🔬', '🧪', '🌍', '🏛️', 
  '💻', '🎨', '🎵', '⚽', '🧮', '🔢', '📊', '🧬'
];

export default function EditSubjectPage({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📚',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubject();
  }, [subjectId]);

  const fetchSubject = async () => {
    try {
      const res = await fetch(`/api/admin/content/subjects/${subjectId}`);
      if (!res.ok) throw new Error('Failed to fetch subject');
      
      const data = await res.json();
      setForm({
        name: data.subject.name,
        slug: data.subject.slug,
        description: data.subject.description || '',
        icon: data.subject.icon || '📚',
      });
    } catch (error) {
      console.error('Error fetching subject:', error);
      alert('Không thể tải môn học');
      router.push('/admin/content');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      newErrors.name = 'Tên môn học là bắt buộc';
    }

    if (!form.slug.trim()) {
      newErrors.slug = 'Slug là bắt buộc';
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/subjects/${subjectId}`, {
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
        throw new Error(data.error || 'Failed to update subject');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error updating subject:', error);
      alert('Không thể cập nhật môn học. Vui lòng thử lại.');
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
            Chỉnh sửa môn học
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Thông tin môn học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Biểu tượng
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-10 h-10 text-xl rounded-lg border-2 transition-colors ${
                        form.icon === icon
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên môn học <span className="text-red-500">*</span>
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

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
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
