'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

const ICON_OPTIONS = [
  '📚', '📖', '📝', '📐', '🔬', '🧪', '🌍', '🏛️', 
  '💻', '🎨', '🎵', '⚽', '🧮', '🔢', '📊', '🧬'
];

export default function NewSubjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '📚',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    setLoading(true);
    try {
      const res = await fetch('/api/admin/content/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error === 'SLUG_EXISTS') {
          setErrors({ slug: 'Slug này đã tồn tại' });
          return;
        }
        throw new Error(data.error || 'Failed to create subject');
      }

      router.push('/admin/content');
    } catch (error) {
      console.error('Error creating subject:', error);
      alert('Không thể tạo môn học. Vui lòng thử lại.');
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
            Thêm môn học mới
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
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Toán học, Vật lý..."
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
                  placeholder="toan-hoc"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Slug sẽ xuất hiện trong URL: /study/{form.slug || 'slug'}
                </p>
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
                  placeholder="Mô tả ngắn về môn học..."
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
              Tạo môn học
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
