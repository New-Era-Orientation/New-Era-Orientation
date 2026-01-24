"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/Card";
import { Button } from "@/client/components/ui/Button";
import { Badge } from "@/client/components/ui/Badge";
import {
    ChevronLeft,
    Settings,
    Shield,
    Globe,
    Bell,
    Database,
    Save,
    Loader2,
    CheckCircle,
    ToggleLeft,
    ToggleRight,
} from "lucide-react";

interface SettingsState {
    general: {
        siteName: string;
        maintenanceMode: boolean;
    };
    security: {
        allowRegistration: boolean;
        requireEmailVerification: boolean;
        maxLoginAttempts: number;
    };
    limits: {
        maxUploadSize: number;
        defaultPageSize: number;
        sessionTimeout: number;
    };
}

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SettingsState>({
        general: {
            siteName: "NEO-EDU",
            maintenanceMode: false,
        },
        security: {
            allowRegistration: true,
            requireEmailVerification: true,
            maxLoginAttempts: 5,
        },
        limits: {
            maxUploadSize: 10,
            defaultPageSize: 20,
            sessionTimeout: 60,
        },
    });

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setSaving(false);
        setSaved(true);

        setTimeout(() => setSaved(false), 3000);
    };

    const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? "translate-x-6" : "translate-x-1"
                    }`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
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
                                Cài đặt hệ thống
                            </h1>
                            <p className="text-gray-500">Quản lý cấu hình chung</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang lưu...
                            </>
                        ) : saved ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Đã lưu
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Lưu thay đổi
                            </>
                        )}
                    </Button>
                </div>

                {/* General Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-blue-500" />
                            Cài đặt chung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Tên trang web
                            </label>
                            <input
                                type="text"
                                value={settings.general.siteName}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        general: { ...prev.general, siteName: e.target.value },
                                    }))
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Chế độ bảo trì
                                </p>
                                <p className="text-sm text-gray-500">
                                    Tạm ngưng truy cập cho người dùng thường
                                </p>
                            </div>
                            <Toggle
                                value={settings.general.maintenanceMode}
                                onChange={(v) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        general: { ...prev.general, maintenanceMode: v },
                                    }))
                                }
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-green-500" />
                            Bảo mật
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Cho phép đăng ký
                                </p>
                                <p className="text-sm text-gray-500">
                                    Người dùng mới có thể tự đăng ký tài khoản
                                </p>
                            </div>
                            <Toggle
                                value={settings.security.allowRegistration}
                                onChange={(v) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        security: { ...prev.security, allowRegistration: v },
                                    }))
                                }
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    Yêu cầu xác minh email
                                </p>
                                <p className="text-sm text-gray-500">
                                    Người dùng phải xác minh email trước khi sử dụng
                                </p>
                            </div>
                            <Toggle
                                value={settings.security.requireEmailVerification}
                                onChange={(v) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        security: { ...prev.security, requireEmailVerification: v },
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Số lần đăng nhập sai tối đa
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={settings.security.maxLoginAttempts}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        security: {
                                            ...prev.security,
                                            maxLoginAttempts: parseInt(e.target.value) || 5,
                                        },
                                    }))
                                }
                                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Limits Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-purple-500" />
                            Giới hạn hệ thống
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Kích thước upload tối đa (MB)
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.limits.maxUploadSize}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        limits: {
                                            ...prev.limits,
                                            maxUploadSize: parseInt(e.target.value) || 10,
                                        },
                                    }))
                                }
                                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Số mục hiển thị mỗi trang
                            </label>
                            <select
                                value={settings.limits.defaultPageSize}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        limits: {
                                            ...prev.limits,
                                            defaultPageSize: parseInt(e.target.value),
                                        },
                                    }))
                                }
                                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Thời gian hết phiên (phút)
                            </label>
                            <input
                                type="number"
                                min="15"
                                max="480"
                                value={settings.limits.sessionTimeout}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        limits: {
                                            ...prev.limits,
                                            sessionTimeout: parseInt(e.target.value) || 60,
                                        },
                                    }))
                                }
                                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
