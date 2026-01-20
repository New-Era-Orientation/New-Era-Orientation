'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Book,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  FileText,
  GripVertical,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';
import { Badge } from '@/client/components/ui/Badge';

interface Topic {
  id: string;
  name: string;
  slug: string;
  order: number;
  _count: {
    progress: number;
  };
}

interface Chapter {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  order: number;
  topics: Topic[];
  expanded: boolean;
}

interface Subject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  order: number;
  chapters: Chapter[];
  _count: {
    chapters: number;
  };
}

export default function AdminContentPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchContent();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchContent(true); // silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchContent = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch('/api/admin/content');
      if (!res.ok) throw new Error('Failed to fetch content');
      
      const data = await res.json();
      setSubjects(data.subjects);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const toggleSubject = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!confirm('Bạn có chắc muốn xóa môn học này? Tất cả chương và bài học sẽ bị xóa.')) return;

    try {
      const res = await fetch(`/api/admin/content/subjects/${subjectId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete subject');
      
      setSubjects(subjects.filter(s => s.id !== subjectId));
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Không thể xóa môn học');
    }
  };

  const handleDeleteChapter = async (subjectId: string, chapterId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chương này? Tất cả bài học sẽ bị xóa.')) return;

    try {
      const res = await fetch(`/api/admin/content/chapters/${chapterId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete chapter');
      
      setSubjects(subjects.map(s => 
        s.id === subjectId 
          ? { ...s, chapters: s.chapters.filter(c => c.id !== chapterId) }
          : s
      ));
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert('Không thể xóa chương');
    }
  };

  const getTotalTopics = (subject: Subject) => {
    return subject.chapters.reduce((sum, ch) => sum + ch.topics.length, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-blue-600">Admin</Link>
              <span>/</span>
              <span>Nội dung học tập</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quản lý nội dung học tập
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/content/subjects/new">
              <Button variant="outline" className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm môn học
              </Button>
            </Link>
            <Link href="/admin/content/topics/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Thêm bài học
              </Button>
            </Link>
          </div>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm môn học, chương, bài..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Content Tree */}
        {loading ? (
          <Card>
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                Đang tải...
              </div>
            </CardContent>
          </Card>
        ) : subjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Chưa có nội dung học tập
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Bắt đầu bằng cách tạo môn học đầu tiên
              </p>
              <Link href="/admin/content/subjects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm môn học
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <Card key={subject.id} className="overflow-hidden">
                {/* Subject Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => toggleSubject(subject.id)}
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {expandedSubjects.has(subject.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-xl">
                      {subject.icon || '📚'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {subject.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {subject.chapters.length} chương • {getTotalTopics(subject)} bài học
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/content/subjects/${subject.id}/edit`}>
                      <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                        <Edit className="w-4 h-4" />
                      </button>
                    </Link>
                    <Link href={`/admin/content/chapters/new?subjectId=${subject.id}`}>
                      <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg">
                        <Plus className="w-4 h-4" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDeleteSubject(subject.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Chapters */}
                {expandedSubjects.has(subject.id) && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {subject.chapters.length === 0 ? (
                      <div className="p-4 pl-16 text-gray-500 dark:text-gray-400 text-sm">
                        Chưa có chương nào.{' '}
                        <Link
                          href={`/admin/content/chapters/new?subjectId=${subject.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Thêm chương mới
                        </Link>
                      </div>
                    ) : (
                      subject.chapters.map((chapter) => (
                        <div key={chapter.id}>
                          {/* Chapter Header */}
                          <div
                            className="flex items-center justify-between p-3 pl-16 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800"
                            onClick={() => toggleChapter(chapter.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedChapters.has(chapter.id) ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                              <FolderOpen className="w-5 h-5 text-amber-500" />
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {chapter.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {chapter.topics.length} bài học
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <Link href={`/admin/content/chapters/${chapter.id}/edit`}>
                                <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <Link href={`/admin/content/topics/new?chapterId=${chapter.id}`}>
                                <button className="p-1.5 text-gray-400 hover:text-green-600 rounded">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <button
                                onClick={() => handleDeleteChapter(subject.id, chapter.id)}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Topics */}
                          {expandedChapters.has(chapter.id) && (
                            <div className="bg-gray-50 dark:bg-gray-800/30">
                              {chapter.topics.length === 0 ? (
                                <div className="p-3 pl-24 text-gray-500 text-sm">
                                  Chưa có bài học.{' '}
                                  <Link
                                    href={`/admin/content/topics/new?chapterId=${chapter.id}`}
                                    className="text-blue-600 hover:underline"
                                  >
                                    Thêm bài học
                                  </Link>
                                </div>
                              ) : (
                                chapter.topics.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className="flex items-center justify-between p-2 pl-24 hover:bg-gray-100 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
                                  >
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-4 h-4 text-gray-400" />
                                      <span className="text-sm text-gray-700 dark:text-gray-300">
                                        {topic.name}
                                      </span>
                                      {topic._count.progress > 0 && (
                                        <Badge variant="default" className="text-xs">
                                          {topic._count.progress} lượt học
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Link href={`/study/${topic.slug}`}>
                                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                                          <Eye className="w-3.5 h-3.5" />
                                        </button>
                                      </Link>
                                      <Link href={`/admin/content/topics/${topic.id}/edit`}>
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                      </Link>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
