"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import { Input } from "@/client/components/ui/Input";
import {
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Clock,
    User,
    AlertCircle,
    AlertTriangle,
    Info,
    RefreshCw,
} from "lucide-react";

type LogLevel = "info" | "warning" | "error";

interface LogEntry {
    id: string;
    timestamp: string;
    level: LogLevel;
    actor: string;
    action: string;
    resource: string;
    ip: string;
}

// Mock data
const mockLogs: LogEntry[] = [
    {
        id: "1",
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        level: "info",
        actor: "admin@example.com",
        action: "Đăng nhập",
        resource: "Auth",
        ip: "192.168.1.1",
    },
    {
        id: "2",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        level: "info",
        actor: "teacher@example.com",
        action: "Tạo đề thi",
        resource: "Exams",
        ip: "192.168.1.2",
    },
    {
        id: "3",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        level: "warning",
        actor: "student@example.com",
        action: "Đăng nhập sai 3 lần",
        resource: "Auth",
        ip: "192.168.1.3",
    },
    {
        id: "4",
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        level: "error",
        actor: "system",
        action: "Lỗi kết nối database",
        resource: "Database",
        ip: "127.0.0.1",
    },
    {
        id: "5",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        level: "info",
        actor: "admin@example.com",
        action: "Cập nhật cài đặt",
        resource: "Settings",
        ip: "192.168.1.1",
    },
    {
        id: "6",
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        level: "info",
        actor: "teacher@example.com",
        action: "Xóa câu hỏi",
        resource: "Questions",
        ip: "192.168.1.2",
    },
    {
        id: "7",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        level: "warning",
        actor: "system",
        action: "CPU cao (85%)",
        resource: "System",
        ip: "127.0.0.1",
    },
];

export default function AdminLogsPage() {
    const [logs] = useState<LogEntry[]>(mockLogs);
    const [search, setSearch] = useState("");
    const [levelFilter, setLevelFilter] = useState<LogLevel | "">("");
    const [page, setPage] = useState(1);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch =
            log.actor.toLowerCase().includes(search.toLowerCase()) ||
            log.action.toLowerCase().includes(search.toLowerCase()) ||
            log.resource.toLowerCase().includes(search.toLowerCase());
        const matchesLevel = !levelFilter || log.level === levelFilter;
        return matchesSearch && matchesLevel;
    });

    const getLevelIcon = (level: LogLevel) => {
        switch (level) {
            case "info":
                return <Info className="h-4 w-4 text-blue-500" />;
            case "warning":
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case "error":
                return <AlertCircle className="h-4 w-4 text-red-500" />;
        }
    };

    const getLevelBadge = (level: LogLevel) => {
        switch (level) {
            case "info":
                return <Badge variant="info">Info</Badge>;
            case "warning":
                return <Badge variant="warning">Warning</Badge>;
            case "error":
                return <Badge variant="error">Error</Badge>;
        }
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin"
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Activity Logs
                            </h1>
                            <p className="text-gray-500">Theo dõi hoạt động hệ thống</p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm mới
                    </Button>
                </div>

                {/* Filters */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 flex gap-2">
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm kiếm theo người dùng, hành động..."
                                    className="flex-1"
                                />
                                <Button variant="outline">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex gap-2">
                                {(["", "info", "warning", "error"] as const).map((level) => (
                                    <Button
                                        key={level}
                                        variant={levelFilter === level ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setLevelFilter(level)}
                                    >
                                        {level === "" ? (
                                            "Tất cả"
                                        ) : level === "info" ? (
                                            <>
                                                <Info className="h-4 w-4 mr-1" />
                                                Info
                                            </>
                                        ) : level === "warning" ? (
                                            <>
                                                <AlertTriangle className="h-4 w-4 mr-1" />
                                                Warning
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="h-4 w-4 mr-1" />
                                                Error
                                            </>
                                        )}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logs Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                                    <tr>
                                        <th className="text-left p-4 font-medium">Thời gian</th>
                                        <th className="text-left p-4 font-medium">Level</th>
                                        <th className="text-left p-4 font-medium">Người dùng</th>
                                        <th className="text-left p-4 font-medium">Hành động</th>
                                        <th className="text-left p-4 font-medium">Resource</th>
                                        <th className="text-left p-4 font-medium">IP</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-8 text-center text-gray-500"
                                            >
                                                Không có log nào
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredLogs.map((log) => (
                                            <tr
                                                key={log.id}
                                                className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                            >
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Clock className="h-4 w-4" />
                                                        {formatTime(log.timestamp)}
                                                    </div>
                                                </td>
                                                <td className="p-4">{getLevelBadge(log.level)}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span className="text-sm font-medium">
                                                            {log.actor}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm">{log.action}</td>
                                                <td className="p-4">
                                                    <Badge variant="default">{log.resource}</Badge>
                                                </td>
                                                <td className="p-4 text-sm text-gray-500 font-mono">
                                                    {log.ip}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-500">
                        Hiển thị {filteredLogs.length} log
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page === 1}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
