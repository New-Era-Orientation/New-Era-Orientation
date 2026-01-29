'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import {
  Upload,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  FileType,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  HelpCircle,
  X,
  ChevronRight,
  Plus,
  Check,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/Card';
import { Button } from '@/client/components/ui/Button';

// ============================================
// Types
// ============================================

interface EntityMapping {
  type: 'PROVINCE' | 'SCHOOL' | 'SUBJECT';
  value: string;
  match: { id: string | number; name: string } | null;
  suggestions: { id: string | number; name: string }[];
  action: 'MATCHED' | 'CREATE_NEW' | 'NEEDS_SELECTION';
}

interface AnalysisResult {
  status: 'READY' | 'NEEDS_ACTION' | 'ERROR';
  exam: {
    title: string;
    duration: number;
    year?: number;
    province?: string;
    school?: string;
    subject?: string;
    parts: { name: string; questions: unknown[] }[];
  } | null;
  mappings: EntityMapping[];
  questionCount: number;
  errors: string[];
  warnings: string[];
}

interface ResolvedMappings {
  provinceId?: number;
  schoolId?: string;
  subjectId?: string;
  createSchool?: { name: string; provinceId: number };
}

// ============================================
// Steps
// ============================================

type ImportStep = 'upload' | 'analyze' | 'import' | 'done';

// ============================================
// Component
// ============================================

export default function ImportExportPage() {
  // State
  const [step, setStep] = useState<ImportStep>('upload');
  const [importing, setImporting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [loadingExams, setLoadingExams] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [guideContent, setGuideContent] = useState('');

  // Analysis state
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileType, setFileType] = useState<'json' | 'xlsx' | 'docx'>('json');
  const [userMappings, setUserMappings] = useState<Record<string, string | number | 'CREATE_NEW'>>({});

  // Import result
  const [importResult, setImportResult] = useState<{ success: boolean; imported: number; examId?: string; errors?: string[] } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // Handlers
  // ============================================

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

  const loadGuide = async () => {
    try {
      const res = await fetch('/docs/import-guide.md');
      const text = await res.text();
      setGuideContent(text);
      setShowGuide(true);
    } catch (error) {
      console.error('Error loading guide:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setAnalysisResult(null);

    try {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isDocx = file.name.endsWith('.docx') || file.name.endsWith('.doc');
      setFileType(isExcel ? 'xlsx' : isDocx ? 'docx' : 'json');

      let content: string;
      if (isExcel || isDocx) {
        // Convert to base64
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        content = btoa(binary);
      } else {
        content = await file.text();
      }

      setFileContent(content);

      // Call analyze API
      const res = await fetch('/api/admin/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileType: isExcel ? 'xlsx' : isDocx ? 'docx' : 'json', content }),
      });

      const result: AnalysisResult = await res.json();
      setAnalysisResult(result);

      // Pre-fill user mappings with matched values
      const initialMappings: Record<string, string | number | 'CREATE_NEW'> = {};
      for (const mapping of result.mappings) {
        if (mapping.match) {
          initialMappings[mapping.type] = mapping.match.id;
        }
      }
      setUserMappings(initialMappings);

      setStep('analyze');
    } catch (error) {
      console.error('Error analyzing file:', error);
      setAnalysisResult({
        status: 'ERROR',
        exam: null,
        mappings: [],
        questionCount: 0,
        errors: ['Đã xảy ra lỗi khi phân tích file'],
        warnings: [],
      });
      setStep('analyze');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = async () => {
    if (!analysisResult?.exam) return;

    setImporting(true);
    setStep('import');

    try {
      // Build resolved mappings from user selections
      const resolvedMappings: ResolvedMappings = {};

      const provinceMapping = analysisResult.mappings.find(m => m.type === 'PROVINCE');
      const schoolMapping = analysisResult.mappings.find(m => m.type === 'SCHOOL');
      const subjectMapping = analysisResult.mappings.find(m => m.type === 'SUBJECT');

      if (provinceMapping && userMappings['PROVINCE']) {
        resolvedMappings.provinceId = Number(userMappings['PROVINCE']);
      }

      if (schoolMapping) {
        if (userMappings['SCHOOL'] === 'CREATE_NEW') {
          resolvedMappings.createSchool = {
            name: schoolMapping.value,
            provinceId: resolvedMappings.provinceId || 1,
          };
        } else if (userMappings['SCHOOL']) {
          resolvedMappings.schoolId = String(userMappings['SCHOOL']);
        }
      }

      if (subjectMapping && userMappings['SUBJECT']) {
        resolvedMappings.subjectId = String(userMappings['SUBJECT']);
      }

      // Parse exam data based on file type
      let examData;
      if (fileType === 'json') {
        const parsed = JSON.parse(fileContent);
        examData = parsed.exam;
      } else {
        examData = analysisResult.exam;
      }

      // Send import request
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exam: examData,
          resolvedMappings,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setImportResult({
          success: false,
          imported: 0,
          errors: [result.error || 'Import thất bại'],
        });
      } else {
        setImportResult({
          success: true,
          imported: result.imported,
          examId: result.examId,
          errors: result.errors,
        });
      }

      setStep('done');
    } catch (error) {
      console.error('Error importing:', error);
      setImportResult({
        success: false,
        imported: 0,
        errors: ['Đã xảy ra lỗi khi import'],
      });
      setStep('done');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'json' | 'xlsx' | 'docx') => {
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

  const resetImport = () => {
    setStep('upload');
    setAnalysisResult(null);
    setImportResult(null);
    setFileContent('');
    setUserMappings({});
  };

  const canProceed = () => {
    if (!analysisResult) return false;
    if (analysisResult.status === 'ERROR') return false;

    // Check all required mappings are resolved
    for (const mapping of analysisResult.mappings) {
      if (mapping.action === 'NEEDS_SELECTION' && !userMappings[mapping.type]) {
        return false;
      }
    }
    return true;
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Import / Export Dữ liệu
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Nhập hoặc xuất dữ liệu đề thi và câu hỏi
              </p>
            </div>
            <Button variant="outline" onClick={loadGuide} className="gap-2">
              <HelpCircle className="w-4 h-4" />
              Hướng dẫn
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        {step !== 'upload' && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              {['upload', 'analyze', 'import', 'done'].map((s, i) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                        ? 'bg-blue-600 text-white'
                        : ['analyze', 'import', 'done'].indexOf(step) > i - 1
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                      }`}
                  >
                    {['analyze', 'import', 'done'].indexOf(step) > i - 1 ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < 3 && (
                    <ChevronRight className="w-5 h-5 mx-2 text-gray-400" />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-16 mt-2 text-xs text-gray-500">
              <span>Upload</span>
              <span>Phân tích</span>
              <span>Import</span>
              <span>Hoàn tất</span>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import Dữ liệu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {step === 'upload' && (
                <>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hỗ trợ file <strong>JSON</strong>, <strong>Excel (.xlsx)</strong> hoặc <strong>Word (.docx)</strong>
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.xlsx,.xls,.docx,.doc"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={analyzing}
                    className="w-full gap-2"
                  >
                    {analyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Chọn file để import
                  </Button>

                  {/* Exam Editor Link */}
                  <div className="pt-4 border-t dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Hoặc sử dụng <strong>Exam Editor</strong> để nhập/chỉnh sửa đề thi trực tiếp
                    </p>
                    <Link href="/admin/import-export/editor">
                      <Button variant="outline" className="w-full gap-2">
                        <FileText className="w-4 h-4" />
                        Mở Exam Editor
                      </Button>
                    </Link>
                  </div>
                </>
              )}

              {step === 'analyze' && analysisResult && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className={`p-4 rounded-lg ${analysisResult.status === 'ERROR'
                      ? 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                      : analysisResult.status === 'NEEDS_ACTION'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200'
                        : 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                    }`}>
                    <div className="flex items-start gap-2">
                      {analysisResult.status === 'ERROR' ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : analysisResult.status === 'NEEDS_ACTION' ? (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {analysisResult.exam?.title || 'Không đọc được tiêu đề'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {analysisResult.questionCount} câu hỏi • {analysisResult.exam?.parts.length || 0} phần
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Errors */}
                  {analysisResult.errors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Lỗi:</p>
                      <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                        {analysisResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {analysisResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Cảnh báo:</p>
                      <ul className="text-sm text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                        {analysisResult.warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                        {analysisResult.warnings.length > 3 && (
                          <li>...và {analysisResult.warnings.length - 3} cảnh báo khác</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Mappings */}
                  {analysisResult.mappings.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Liên kết dữ liệu:
                      </p>
                      {analysisResult.mappings.map((mapping) => (
                        <div key={mapping.type} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {mapping.type === 'PROVINCE' ? 'Tỉnh/Thành phố' :
                                mapping.type === 'SCHOOL' ? 'Trường' : 'Môn học'}
                            </p>
                            <p className="text-sm font-medium">{mapping.value}</p>
                          </div>
                          <div className="w-48">
                            {mapping.action === 'MATCHED' ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-sm">{mapping.match?.name}</span>
                              </div>
                            ) : (
                              <select
                                value={userMappings[mapping.type] || ''}
                                onChange={(e) => setUserMappings(prev => ({
                                  ...prev,
                                  [mapping.type]: e.target.value === 'CREATE_NEW' ? 'CREATE_NEW' : e.target.value
                                }))}
                                className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                              >
                                <option value="">Chọn...</option>
                                {mapping.suggestions.map((s) => (
                                  <option key={String(s.id)} value={s.id}>{s.name}</option>
                                ))}
                                {mapping.type === 'SCHOOL' && (
                                  <option value="CREATE_NEW">
                                    ➕ Tạo mới: {mapping.value}
                                  </option>
                                )}
                              </select>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={resetImport} className="flex-1">
                      Hủy
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!canProceed()}
                      className="flex-1 gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Import
                    </Button>
                  </div>
                </div>
              )}

              {step === 'import' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Đang import dữ liệu...</p>
                </div>
              )}

              {step === 'done' && importResult && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${importResult.success
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                    }`}>
                    <div className="flex items-start gap-2">
                      {importResult.success ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className={`font-medium ${importResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                          }`}>
                          {importResult.success
                            ? `Import thành công ${importResult.imported} câu hỏi!`
                            : 'Import thất bại'}
                        </p>
                        {importResult.errors && importResult.errors.length > 0 && (
                          <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                            {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={resetImport} className="flex-1">
                      Import thêm
                    </Button>
                    {importResult.success && importResult.examId && (
                      <Link href={`/admin/exams/${importResult.examId}`} className="flex-1">
                        <Button className="w-full gap-2">
                          <ChevronRight className="w-4 h-4" />
                          Xem đề thi
                        </Button>
                      </Link>
                    )}
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
                Xuất đề thi ra file JSON, Excel hoặc Word.
              </p>

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

              <div className="grid grid-cols-3 gap-3">
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
                  JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('xlsx')}
                  disabled={exporting || !selectedExamId}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4" />
                  )}
                  Excel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('docx')}
                  disabled={exporting || !selectedExamId}
                  className="gap-2"
                >
                  {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileType className="w-4 h-4" />
                  )}
                  Word
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Hướng dẫn Import</h2>
              <button onClick={() => setShowGuide(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6 prose dark:prose-invert max-w-none">
              <ReactMarkdown>{guideContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
