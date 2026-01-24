"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import {
    ChevronLeft,
    Download,
    FileText,
    Users,
    Activity,
    Calendar,
    BarChart3,
    Loader2,
    CheckCircle,
} from "lucide-react";

type ReportType = "users" | "exams" | "performance" | "system";

interface ReportConfig {
    id: ReportType;
    title: string;
    description: string;
    icon: typeof Users;
    color: string;
}

const reportTypes: ReportConfig[] = [
    {
        id: "users",
        title: "Báo cáo người dùng",
        description: "Thống kê đăng ký, hoạt động và phân bố vai trò",
        icon: Users,
        color: "blue",
    },
    {
        id: "exams",
        title: "Báo cáo đề thi",
        description: "Số lượng đề thi, câu hỏi theo môn học",
        icon: FileText,
        color: "green",
    },
    {
        id: "performance",
        title: "Báo cáo hiệu suất",
        description: "Điểm trung bình, tỷ lệ đậu, phân bố điểm",
        icon: BarChart3,
        color: "purple",
    },
    {
        id: "system",
        title: "Báo cáo hệ thống",
        description: "Lượt truy cập, tải trọng, lỗi hệ thống",
        icon: Activity,
        color: "orange",
    },
];

export default function AdminReportsPage() {
    const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
    const [dateRange, setDateRange] = useState({ from: "", to: "" });
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);

    const handleGenerate = async () => {
        if (!selectedReport) return;

        setGenerating(true);
        setGenerated(false);

        // Simulate report generation
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setGenerating(false);
        setGenerated(true);
    };

    const handleDownload = (format: "csv" | "pdf") => {
        // Mock download - in real implementation, this would call an API
        const filename = `report_${selectedReport}_${new Date().toISOString().split("T")[0]}.${format}`;
        alert(`Đang tải xuống: ${filename}`);
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; text: string; border: string }> = {
            blue: {
                bg: "bg-blue-50 dark:bg-blue-900/20",
                text: "text-blue-600 dark:text-blue-400",
                border: "border-blue-200 dark:border-blue-800",
            },
            green: {
                bg: "bg-green-50 dark:bg-green-900/20",
                text: "text-green-600 dark:text-green-400",
                border: "border-green-200 dark:border-green-800",
            },
            purple: {
                bg: "bg-purple-50 dark:bg-purple-900/20",
                text: "text-purple-600 dark:text-purple-400",
                border: "border-purple-200 dark:border-purple-800",
            },
            orange: {
                bg: "bg-orange-50 dark:bg-orange-900/20",
                text: "text-orange-600 dark:text-orange-400",
                border: "border-orange-200 dark:border-orange-800",
            },
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link
                        href="/admin"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Báo cáo thống kê
                        </h1>
                        <p className="text-gray-500">Tạo và tải xuống báo cáo hệ thống</p>
                    </div>
                </div>

                {/* Report Type Selection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Chọn loại báo cáo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {reportTypes.map((report) => {
                                const colors = getColorClasses(report.color);
                                const isSelected = selectedReport === report.id;
                                return (
                                    <button
                                        key={report.id}
                                        onClick={() => {
                                            setSelectedReport(report.id);
                                            setGenerated(false);
                                        }}
                                        className={`p-4 rounded-lg border-2 text-left transition-all ${isSelected
                                                ? `${colors.border} ${colors.bg}`
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`p-2 rounded-lg ${colors.bg}`}
                                            >
                                                <report.icon
                                                    className={`h-5 w-5 ${colors.text}`}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {report.title}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {report.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Date Range */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Khoảng thời gian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Từ ngày
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) =>
                                        setDateRange((prev) => ({ ...prev, from: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Đến ngày
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) =>
                                        setDateRange((prev) => ({ ...prev, to: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    setDateRange({
                                        from: weekAgo.toISOString().split("T")[0],
                                        to: today.toISOString().split("T")[0],
                                    });
                                }}
                            >
                                7 ngày qua
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                                    setDateRange({
                                        from: monthAgo.toISOString().split("T")[0],
                                        to: today.toISOString().split("T")[0],
                                    });
                                }}
                            >
                                30 ngày qua
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const today = new Date();
                                    const quarterAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                                    setDateRange({
                                        from: quarterAgo.toISOString().split("T")[0],
                                        to: today.toISOString().split("T")[0],
                                    });
                                }}
                            >
                                90 ngày qua
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Generate Button */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                {selectedReport ? (
                                    <p className="text-gray-600 dark:text-gray-400">
                                        Đã chọn:{" "}
                                        <Badge variant="primary">
                                            {reportTypes.find((r) => r.id === selectedReport)?.title}
                                        </Badge>
                                    </p>
                                ) : (
                                    <p className="text-gray-500">Vui lòng chọn loại báo cáo</p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                {generated && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDownload("csv")}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải CSV
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDownload("pdf")}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            Tải PDF
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={!selectedReport || generating}
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang tạo...
                                        </>
                                    ) : generated ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Tạo lại
                                        </>
                                    ) : (
                                        <>
                                            <BarChart3 className="h-4 w-4 mr-2" />
                                            Tạo báo cáo
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Success Message */}
                        {generated && (
                            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <CheckCircle className="h-5 w-5" />
                                    <p className="font-medium">Báo cáo đã được tạo thành công!</p>
                                </div>
                                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                                    Bạn có thể tải xuống báo cáo ở định dạng CSV hoặc PDF.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
