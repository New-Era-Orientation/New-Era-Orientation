'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Upload,
  Download,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
}

export default function ImportExportPage() {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExams = async () => {
    if (exams.length > 0) return;
    
    setLoadingExams(true);
    try {
      const res = await fetch('/api/admin/exams?limit=100');
      if (!res.ok) throw new Error('Failed to fetch exams');
      
      const data = await res.json();
      setExams(data.exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoadingExams(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const content = await file.text();
      let data;

      // Try to parse as JSON
      try {
        data = JSON.parse(content);
      } catch {
        setImportResult({
          success: false,
          imported: 0,
          errors: ['File không phải định dạng JSON hợp lệ'],
        });
        return;
      }

      // Validate structure
      if (!data.exam && !data.questions) {
        setImportResult({
          success: false,
          imported: 0,
          errors: ['File phải chứa "exam" hoặc "questions"'],
        });
        return;
      }

      // Send to API
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [result.error || 'Import thất bại'],
        });
        return;
      }

      setImportResult({
        success: true,
        imported: result.imported,
        errors: result.errors || [],
      });
    } catch (error) {
      console.error('Error importing:', error);
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Đã xảy ra lỗi khi import'],
      });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    if (!selectedExamId) {
      alert('Vui lòng chọn đề thi để export');
      return;
    }

    setExporting(true);

    try {
      const res = await fetch(`/api/admin/export?examId=${selectedExamId}&format=${format}`);
      
      if (!res.ok) {
        throw new Error('Export failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exam-${selectedExamId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Export thất bại');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Import / Export Dữ liệu
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Nhập hoặc xuất dữ liệu đề thi và câu hỏi
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Nhập đề thi và câu hỏi từ file JSON. File phải tuân theo cấu trúc chuẩn.
              </p>

              {/* Format Example */}
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2">
                  Cấu trúc file JSON:
                </p>
                <pre className="text-xs overflow-x-auto">
{`{
  "exam": {
    "title": "Đề thi mẫu",
    "duration": 90,
    "parts": [...]
  }
}`}
                </pre>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button
                onClick={handleImportClick}
                disabled={importing}
                className="w-full gap-2"
              >
                {importing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileJson className="w-4 h-4" />
                )}
                Chọn file JSON để import
              </Button>

              {/* Import Result */}
              {importResult && (
                <div
                  className={`p-4 rounded-lg ${
                    importResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {importResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div>
                      <p
                        className={`font-medium ${
                          importResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                        }`}
                      >
                        {importResult.success
                          ? `Import thành công ${importResult.imported} câu hỏi`
                          : 'Import thất bại'}
                      </p>
                      {importResult.errors.length > 0 && (
                        <ul className="mt-2 text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                          {importResult.errors.map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-green-600" />
                Export Dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Xuất đề thi và câu hỏi ra file JSON hoặc CSV.
              </p>

              {/* Exam Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chọn đề thi
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  onFocus={fetchExams}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {loadingExams ? 'Đang tải...' : 'Chọn đề thi'}
                  </option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleExport('json')}
                  disabled={exporting || !selectedExamId}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileJson className="w-4 h-4" />
                  )}
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv')}
                  disabled={exporting || !selectedExamId}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Download */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Mẫu Import</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tải về mẫu file JSON để sử dụng cho việc import dữ liệu.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                const template = {
                  exam: {
                    title: "Đề thi mẫu",
                    description: "Mô tả đề thi",
                    duration: 90,
                    year: 2024,
                    province: "Hà Nội",
                    type: "THPT",
                    parts: [
                      {
                        name: "Phần 1",
                        order: 1,
                        questions: [
                          {
                            type: "MULTIPLE_CHOICE",
                            content: "Nội dung câu hỏi?",
                            order: 1,
                            choices: [
                              { content: "Đáp án A", isCorrect: true },
                              { content: "Đáp án B", isCorrect: false },
                              { content: "Đáp án C", isCorrect: false },
                              { content: "Đáp án D", isCorrect: false }
                            ]
                          },
                          {
                            type: "TRUE_FALSE_GROUP",
                            content: "Đọc đoạn văn sau và xác định đúng/sai",
                            order: 2,
                            statements: [
                              { content: "Phát biểu 1", isCorrect: true },
                              { content: "Phát biểu 2", isCorrect: false },
                              { content: "Phát biểu 3", isCorrect: true },
                              { content: "Phát biểu 4", isCorrect: false }
                            ]
                          }
                        ]
                      }
                    ]
                  }
                };
                
                const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'import-template.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              }}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Tải mẫu JSON
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
