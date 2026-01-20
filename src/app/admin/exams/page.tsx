'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Badge } from '@/client/components/ui/Badge';
import { Input } from '@/client/components/ui/Input';

interface Exam {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  subject: string | null;
  year: number;
  source: string;
  type: 'STANDARD' | 'HSG' | 'MOCK';
  duration: number;
  published: boolean;
  createdAt: string;
  _count: {
    attempts: number;
    questions: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchExams();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchExams(true); // silent refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [pagination.page, filter, search]);

  const fetchExams = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...(search && { search }),
        ...(filter !== 'all' && { published: filter === 'published' ? 'true' : 'false' }),
      });

      const res = await fetch(`/api/admin/exams?${params}`);
      if (!res.ok) throw new Error('Failed to fetch exams');

      const data = await res.json();
      setExams(data.exams);
      setPagination(prev => ({
        ...prev,
        total: data.total,
        totalPages: data.totalPages,
      }));
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleDelete = async (examId: string) => {
    if (!confirm('Bạn có chắc muốn xóa đề thi này?')) return;

    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete exam');

      setExams(exams.filter(e => e.id !== examId));
      setActionMenu(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
      alert('Không thể xóa đề thi');
    }
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !currentStatus }),
      });

      if (!res.ok) throw new Error('Failed to update exam');

      setExams(exams.map(e =>
        e.id === examId ? { ...e, published: !currentStatus } : e
      ));
      setActionMenu(null);
    } catch (error) {
      console.error('Error updating exam:', error);
    }
  };

  const handleDuplicate = async (examId: string) => {
    try {
      const res = await fetch(`/api/admin/exams/${examId}/duplicate`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to duplicate exam');

      fetchExams();
      setActionMenu(null);
    } catch (error) {
      console.error('Error duplicating exam:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'HSG': return 'Học sinh giỏi';
      case 'MOCK': return 'Thi thử';
      default: return 'Tiêu chuẩn';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'HSG': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'MOCK': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      default: return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMode, setAiMode] = useState<'generate' | 'scan'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');

  // Generation Params
  const [genParams, setGenParams] = useState({
    topic: '',
    total: 10,
    single: 6,
    multi: 4,
    difficulty: 'thông hiểu'
  });

  // Import Params
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      const res = await fetch('/api/admin/exams/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: genParams.topic,
          totalQuestions: genParams.total,
          singleChoice: genParams.single,
          multiChoice: genParams.multi,
          difficulty: genParams.difficulty
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');

      setGeneratedContent(data.content);
    } catch (error) {
      console.error(error);
      alert('Tạo đề thất bại: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScan = async () => {
    if (!importFile) return;

    try {
      setIsGenerating(true);
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/admin/exams/import-scan', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');

      setGeneratedContent(data.content);
    } catch (error) {
      console.error(error);
      alert('Quét đề thất bại: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    alert('Đã sao chép vào bộ nhớ tạm!');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-blue-600">Admin</Link>
              <span>/</span>
              <span>Quản lý đề thi</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quản lý đề thi
            </h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowAIModal(true)}
            >
              <div className="w-4 h-4 text-purple-600">✨</div>
              Tạo đề bằng AI
            </Button>
            <Link href="/admin/exams/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm đề thi
              </Button>
            </Link>
          </div>
        </div>

        {/* AI Modal */}
        {showAIModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-2xl">✨</span> Tạo đề thi thông minh
                </h2>
                <button
                  onClick={() => setShowAIModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setAiMode('generate')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${aiMode === 'generate'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                      }`}
                  >
                    📝 Tạo mới từ chủ đề
                  </button>
                  <button
                    onClick={() => setAiMode('scan')}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition ${aiMode === 'scan'
                        ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
                      }`}
                  >
                    📂 Import từ Word/PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Panel: Inputs */}
                  <div className="space-y-4">
                    {aiMode === 'generate' ? (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-1">Chủ đề / Nội dung</label>
                          <Input
                            value={genParams.topic}
                            onChange={(e) => setGenParams({ ...genParams, topic: e.target.value })}
                            placeholder="Ví dụ: Lịch sử Việt Nam thế kỷ 20..."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Tổng số câu</label>
                            <Input
                              type="number"
                              value={genParams.total}
                              onChange={(e) => setGenParams({ ...genParams, total: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Độ khó</label>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-transparent"
                              value={genParams.difficulty}
                              onChange={(e) => setGenParams({ ...genParams, difficulty: e.target.value })}
                            >
                              <option value="nhận biết">Nhận biết</option>
                              <option value="thông hiểu">Thông hiểu</option>
                              <option value="vận dụng">Vận dụng</option>
                              <option value="vận dụng cao">Vận dụng cao</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Số câu 1 đáp án</label>
                            <Input
                              type="number"
                              value={genParams.single}
                              onChange={(e) => setGenParams({ ...genParams, single: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Số câu Đ/S</label>
                            <Input
                              type="number"
                              value={genParams.multi}
                              onChange={(e) => setGenParams({ ...genParams, multi: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <Button
                          className="w-full mt-2"
                          onClick={handleGenerate}
                          disabled={isGenerating || !genParams.topic}
                        >
                          {isGenerating ? 'Đang tạo...' : '🚀 Tạo đề thi'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center bg-gray-50 dark:bg-gray-800/50">
                          <input
                            type="file"
                            id="file-upload"
                            className="hidden"
                            accept=".pdf,.docx,.doc,.jpg,.png"
                            onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                          />
                          <label htmlFor="file-upload" className="cursor-pointer block">
                            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileText className="w-8 h-8 text-blue-600" />
                            </div>
                            <p className="font-medium text-lg mb-1">
                              {importFile ? importFile.name : 'Chọn file Word, PDF hoặc Ảnh'}
                            </p>
                            <p className="text-sm text-gray-500">
                              Hỗ trợ scan nội dung tự động
                            </p>
                          </label>
                        </div>
                        <Button
                          className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                          onClick={handleScan}
                          disabled={isGenerating || !importFile}
                        >
                          {isGenerating ? 'Đang phân tích...' : '🤖 Quét & Tạo đề'}
                        </Button>
                      </>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                      <strong>💡 Lưu ý:</strong> AI sẽ tạo đề theo định dạng chuẩn Plain Text. Bạn có thể chỉnh sửa kết quả bên phải trước khi lưu.
                    </div>
                  </div>

                  {/* Right Panel: Output */}
                  <div className="flex flex-col h-full min-h-[400px]">
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium">Kết quả generated</label>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!generatedContent}>
                        <Copy className="w-4 h-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <textarea
                      className="flex-1 w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm leading-relaxed bg-gray-50 dark:bg-gray-900 resize-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nội dung đề thi sẽ xuất hiện ở đây..."
                      value={generatedContent}
                      onChange={(e) => setGeneratedContent(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm đề thi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setFilter('published')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'published'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Đã xuất bản
                </button>
                <button
                  onClick={() => setFilter('draft')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === 'draft'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  Bản nháp
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Đề thi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Loại
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Câu hỏi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Lượt thi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-4">
                          <div className="animate-pulse flex items-center gap-4">
                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                            <div className="flex-1">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : exams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Chưa có đề thi nào</p>
                        <Link href="/admin/exams/new" className="text-blue-600 hover:underline mt-2 inline-block">
                          Thêm đề thi mới
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {exam.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {exam.source} • {exam.year}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(exam.type)}`}>
                            {getTypeLabel(exam.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white">
                          {exam._count.questions} câu
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4" />
                            {exam._count.attempts}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {exam.published ? (
                            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Đã xuất bản
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                              <Clock className="w-4 h-4" />
                              Bản nháp
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() => setActionMenu(actionMenu === exam.id ? null : exam.id)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>

                            {actionMenu === exam.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                                <Link
                                  href={`/exam/${exam.slug}`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Eye className="w-4 h-4" />
                                  Xem trước
                                </Link>
                                <Link
                                  href={`/admin/exams/${exam.id}/edit`}
                                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Edit className="w-4 h-4" />
                                  Chỉnh sửa
                                </Link>
                                <button
                                  onClick={() => handleDuplicate(exam.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  <Copy className="w-4 h-4" />
                                  Nhân bản
                                </button>
                                <button
                                  onClick={() => handleTogglePublish(exam.id, exam.published)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                  {exam.published ? (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      Hủy xuất bản
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4" />
                                      Xuất bản
                                    </>
                                  )}
                                </button>
                                <hr className="border-gray-200 dark:border-gray-700" />
                                <button
                                  onClick={() => handleDelete(exam.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} đề thi
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setPagination(p => ({ ...p, page }))}
                      className={`px-3 py-1 rounded-lg ${page === pagination.page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Click outside to close menu */}
      {actionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setActionMenu(null)}
        />
      )}
    </div>
  );
}
