"use client";

import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Bell, Palette, Globe, Lock, Save, Shield, Volume2, Eye, Loader2, X, Check, BookOpen, ChevronDown, ChevronRight, Pin } from "lucide-react";
import { useSubject } from "@/client/contexts/SubjectContext";
import { useSession } from "next-auth/react";
import { Card } from "@/client/components/ui/Card";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import { useTheme } from "@/client/contexts/ThemeContext";

interface Settings {
    notifications: boolean;
    emailNotifications: boolean;
    soundEnabled: boolean;
    theme: string;
    language: string;
    selectedSubjectId?: string;
}

interface SubjectData {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    school: { id: string; name: string; code: string | null } | null;
}

export default function SettingsPage() {
    const { theme: currentTheme, setTheme: setAppTheme } = useTheme();
    const { selectedSubjectId, setSelectedSubjectId } = useSubject();
    const { data: session } = useSession();
    const [settings, setSettings] = useState<Settings>({
        notifications: true,
        emailNotifications: false,
        soundEnabled: true,
        theme: "system",
        language: "vi",
        selectedSubjectId: selectedSubjectId || undefined,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

    // Password change modal
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    // Login history modal
    const [showLoginHistory, setShowLoginHistory] = useState(false);

    // Subject selection
    const [subjects, setSubjects] = useState<SubjectData[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ "THPT": true });

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, [session]);

    const fetchSettings = async () => {
        try {
            const promises: Promise<Response>[] = [fetch("/api/subjects")];

            // Only fetch settings if user is logged in
            if (session?.user) {
                promises.push(fetch("/api/settings"));
            }

            const responses = await Promise.all(promises);
            const subjectsRes = responses[0];
            const settingsRes = session?.user ? responses[1] : null;

            if (subjectsRes.ok) {
                const data = await subjectsRes.json();
                setSubjects(data.data || []);
            }

            if (settingsRes && settingsRes.ok) {
                const data = await settingsRes.json();
                setSettings(data.settings);
            }
        } catch (error) {
            console.error("Failed to fetch settings:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);

        // Apply theme immediately
        if (key === "theme") {
            setAppTheme(value as "dark" | "light");
            // Save to localStorage for guest
            if (!session?.user) {
                localStorage.setItem("theme", value as string);
            }
        }

        // For guest users, apply subject change immediately via context
        if (key === "selectedSubjectId" && !session?.user) {
            setSelectedSubjectId(value as string);
        }
    }, [setAppTheme, session?.user, setSelectedSubjectId]);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            // Update subject in context (this handles localStorage for guest)
            if (settings.selectedSubjectId && settings.selectedSubjectId !== selectedSubjectId) {
                setSelectedSubjectId(settings.selectedSubjectId);
            }

            // For guest users, only save to localStorage
            if (!session?.user) {
                // Save theme preference to localStorage
                if (settings.theme) {
                    localStorage.setItem("theme", settings.theme);
                }
                setNotification({ type: "success", message: "Đã lưu cài đặt thành công!" });
                setHasChanges(false);
                return;
            }

            // For logged-in users, save to API
            const res = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });

            if (res.ok) {
                setNotification({ type: "success", message: "Đã lưu cài đặt thành công!" });
                setHasChanges(false);
            } else {
                const data = await res.json();
                setNotification({ type: "error", message: data.error || "Không thể lưu cài đặt" });
            }
        } catch (error) {
            setNotification({ type: "error", message: "Đã xảy ra lỗi khi lưu cài đặt" });
        } finally {
            setIsSaving(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError("");
        setIsChangingPassword(true);

        try {
            const res = await fetch("/api/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(passwordForm),
            });

            const data = await res.json();

            if (res.ok) {
                setNotification({ type: "success", message: "Đã đổi mật khẩu thành công!" });
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setPasswordError(data.error || "Không thể đổi mật khẩu");
            }
        } catch (error) {
            setPasswordError("Đã xảy ra lỗi khi đổi mật khẩu");
        } finally {
            setIsChangingPassword(false);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const Toggle = ({
        checked,
        onChange,
        label
    }: {
        checked: boolean;
        onChange: () => void;
        label: string;
    }) => (
        <button
            onClick={onChange}
            role="switch"
            aria-checked={checked}
            aria-label={label}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${checked ? "bg-primary" : "bg-muted"
                }`}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${checked ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <DashboardHeader />
                <main className="container mx-auto p-6 lg:p-10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${notification.type === "success"
                    ? "bg-emerald-500 text-white"
                    : "bg-destructive text-destructive-foreground"
                    }`}>
                    {notification.type === "success" ? (
                        <Check className="h-5 w-5" />
                    ) : (
                        <X className="h-5 w-5" />
                    )}
                    {notification.message}
                </div>
            )}

            <main className="container mx-auto p-6 lg:p-10">
                <section className="mb-10" aria-labelledby="settings-heading">
                    <h1 id="settings-heading" className="text-3xl font-bold text-foreground">Cài đặt</h1>
                    <p className="mt-2 text-muted-foreground">Quản lý tài khoản và tùy chỉnh trải nghiệm</p>
                </section>

                <div className="space-y-6 max-w-3xl">
                    {/* Notifications */}
                    <Card className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-primary/10 p-3 text-primary">
                                <Bell className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Thông báo</h2>
                                <p className="text-sm text-muted-foreground">Quản lý cách bạn nhận thông báo</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <h3 className="font-semibold text-foreground">Thông báo push</h3>
                                    <p className="text-sm text-muted-foreground">Nhận thông báo về tiến độ học tập</p>
                                </div>
                                <Toggle
                                    checked={settings.notifications}
                                    onChange={() => updateSetting("notifications", !settings.notifications)}
                                    label="Bật/tắt thông báo push"
                                />
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-border">
                                <div>
                                    <h3 className="font-semibold text-foreground">Email thông báo</h3>
                                    <p className="text-sm text-muted-foreground">Nhận email về các cập nhật quan trọng</p>
                                </div>
                                <Toggle
                                    checked={settings.emailNotifications}
                                    onChange={() => updateSetting("emailNotifications", !settings.emailNotifications)}
                                    label="Bật/tắt email thông báo"
                                />
                            </div>

                            <div className="flex items-center justify-between py-2 border-t border-border">
                                <div className="flex items-center gap-3">
                                    <Volume2 className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    <div>
                                        <h3 className="font-semibold text-foreground">Âm thanh</h3>
                                        <p className="text-sm text-muted-foreground">Phát âm thanh khi có thông báo</p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={settings.soundEnabled}
                                    onChange={() => updateSetting("soundEnabled", !settings.soundEnabled)}
                                    label="Bật/tắt âm thanh thông báo"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Appearance */}
                    <Card className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-purple-500/10 p-3 text-purple-400">
                                <Palette className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Giao diện</h2>
                                <p className="text-sm text-muted-foreground">Tùy chỉnh giao diện ứng dụng</p>
                            </div>
                        </div>

                        <fieldset>
                            <legend className="sr-only">Chọn giao diện</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => updateSetting("theme", "dark")}
                                    className={`rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${settings.theme === "dark"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/30"
                                        }`}
                                    aria-pressed={settings.theme === "dark"}
                                >
                                    <div className="mb-3 h-20 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                                        <div className="w-3/4 space-y-1">
                                            <div className="h-2 bg-zinc-700 rounded" />
                                            <div className="h-2 bg-zinc-700 rounded w-2/3" />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-foreground">Tối (Dark)</p>
                                    <p className="text-xs text-muted-foreground">Dễ chịu cho mắt</p>
                                </button>

                                <button
                                    onClick={() => updateSetting("theme", "light")}
                                    className={`rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${settings.theme === "light"
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/30"
                                        }`}
                                    aria-pressed={settings.theme === "light"}
                                >
                                    <div className="mb-3 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <div className="w-3/4 space-y-1">
                                            <div className="h-2 bg-slate-300 rounded" />
                                            <div className="h-2 bg-slate-300 rounded w-2/3" />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-foreground">Sáng (Light)</p>
                                    <p className="text-xs text-muted-foreground">Chế độ sáng</p>
                                </button>
                            </div>
                        </fieldset>
                    </Card>

                    {/* Language */}
                    <Card className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                                <Globe className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Ngôn ngữ</h2>
                                <p className="text-sm text-muted-foreground">Chọn ngôn ngữ hiển thị</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="language-select" className="sr-only">Chọn ngôn ngữ</label>
                            <select
                                id="language-select"
                                value={settings.language}
                                onChange={(e) => updateSetting("language", e.target.value)}
                                className="w-full max-w-xs appearance-none rounded-xl border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                <option value="en">🇺🇸 English</option>
                            </select>
                        </div>
                    </Card>

                    {/* Subject Selection */}
                    <Card className="p-6">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-cyan-500/10 p-3 text-cyan-400">
                                <BookOpen className="h-6 w-6" aria-hidden="true" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Chương trình học</h2>
                                <p className="text-sm text-muted-foreground">Chọn môn học để hiển thị trên các tab</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {/* Pinned: Tin học THPT */}
                            {subjects.filter(s => s.slug === "tin-hoc-thpt").map(subject => (
                                <label
                                    key={subject.id}
                                    className={`relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group ${settings.selectedSubjectId === subject.id
                                        ? "border-primary bg-primary/10"
                                        : "border-primary/30 bg-primary/5 hover:border-primary/50"
                                        }`}
                                >
                                    <div className={`absolute inset-0 rounded-xl border-2 pointer-events-none transition-colors ${settings.selectedSubjectId === subject.id
                                        ? "border-primary"
                                        : "border-transparent group-hover:border-primary/50"
                                        }`} />
                                    <input
                                        type="radio"
                                        name="selectedSubject"
                                        value={subject.id}
                                        onChange={() => updateSetting("selectedSubjectId", subject.id)}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.selectedSubjectId === subject.id
                                        ? "border-primary"
                                        : "border-muted-foreground"
                                        }`}>
                                        {settings.selectedSubjectId === subject.id && (
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        )}
                                    </div>
                                    <Pin className="h-4 w-4 text-primary shrink-0" />
                                    <span className="text-lg">{subject.icon}</span>
                                    <div className="flex-1">
                                        <span className="font-semibold text-foreground">{subject.name}</span>
                                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">Ưu tiên</span>
                                    </div>
                                </label>
                            ))}

                            {/* THPT Group */}
                            {(() => {
                                const thptSubjects = subjects.filter(s => !s.school && s.slug !== "tin-hoc-thpt");
                                if (thptSubjects.length === 0) return null;
                                return (
                                    <div className="border border-border rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedGroups(prev => ({ ...prev, "THPT": !prev["THPT"] }))}
                                            className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary transition-colors"
                                        >
                                            <span className="font-semibold text-foreground">THPT</span>
                                            {expandedGroups["THPT"] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </button>
                                        {expandedGroups["THPT"] && (
                                            <div className="divide-y divide-border">
                                                {thptSubjects.map(subject => (
                                                    <label
                                                        key={subject.id}
                                                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${settings.selectedSubjectId === subject.id
                                                            ? "bg-primary/10"
                                                            : "hover:bg-secondary/50"
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="selectedSubject"
                                                            value={subject.id}
                                                            checked={settings.selectedSubjectId === subject.id}
                                                            onChange={() => updateSetting("selectedSubjectId", subject.id)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.selectedSubjectId === subject.id
                                                            ? "border-primary bg-primary"
                                                            : "border-muted-foreground"
                                                            }`}>
                                                            {settings.selectedSubjectId === subject.id && (
                                                                <div className="w-2 h-2 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        <span className="text-lg">{subject.icon || "📘"}</span>
                                                        <span className="font-medium text-foreground">{subject.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* School Groups */}
                            {(() => {
                                const schoolGroups = subjects.filter(s => s.school).reduce((acc, subject) => {
                                    const schoolName = subject.school!.name;
                                    if (!acc[schoolName]) acc[schoolName] = [];
                                    acc[schoolName].push(subject);
                                    return acc;
                                }, {} as Record<string, SubjectData[]>);

                                return Object.entries(schoolGroups).map(([schoolName, schoolSubjects]) => (
                                    <div key={schoolName} className="border border-border rounded-xl overflow-hidden">
                                        <button
                                            onClick={() => setExpandedGroups(prev => ({ ...prev, [schoolName]: !prev[schoolName] }))}
                                            className="w-full flex items-center justify-between p-4 bg-secondary/50 hover:bg-secondary transition-colors"
                                        >
                                            <span className="font-semibold text-foreground">{schoolName}</span>
                                            {expandedGroups[schoolName] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </button>
                                        {expandedGroups[schoolName] && (
                                            <div className="divide-y divide-border">
                                                {schoolSubjects.map(subject => (
                                                    <label
                                                        key={subject.id}
                                                        className={`flex items-center gap-4 p-4 cursor-pointer transition-all ${settings.selectedSubjectId === subject.id
                                                            ? "bg-primary/10"
                                                            : "hover:bg-secondary/50"
                                                            }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="selectedSubject"
                                                            value={subject.id}
                                                            checked={settings.selectedSubjectId === subject.id}
                                                            onChange={() => updateSetting("selectedSubjectId", subject.id)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${settings.selectedSubjectId === subject.id
                                                            ? "border-primary bg-primary"
                                                            : "border-muted-foreground"
                                                            }`}>
                                                            {settings.selectedSubjectId === subject.id && (
                                                                <div className="w-2 h-2 rounded-full bg-white" />
                                                            )}
                                                        </div>
                                                        <span className="text-lg">{subject.icon || "📘"}</span>
                                                        <span className="font-medium text-foreground">{subject.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    </Card>

                    {/* Security - Only for logged in users */}
                    {session?.user && (
                        <Card className="p-6">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-xl bg-red-500/10 p-3 text-red-400">
                                    <Shield className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Bảo mật</h2>
                                    <p className="text-sm text-muted-foreground">Quản lý bảo mật tài khoản</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                        <span className="font-medium text-foreground">Đổi mật khẩu</span>
                                    </div>
                                    <span className="text-muted-foreground group-hover:text-foreground">→</span>
                                </button>

                                <button
                                    onClick={() => setShowLoginHistory(true)}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                        <span className="font-medium text-foreground">Lịch sử đăng nhập</span>
                                    </div>
                                    <span className="text-muted-foreground group-hover:text-foreground">→</span>
                                </button>
                            </div>
                        </Card>
                    )}

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            variant="default"
                            className="group"
                            onClick={saveSettings}
                            disabled={isSaving || !hasChanges}
                        >
                            {isSaving ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Save className="h-5 w-5" aria-hidden="true" />
                            )}
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </Button>
                    </div>
                </div>
            </main>

            {/* Password Change Modal - Only render if session exists */}
            {session?.user && showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Đổi mật khẩu</h2>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setPasswordError("");
                                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                }}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            {passwordError && (
                                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
                                    {passwordError}
                                </div>
                            )}

                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-2">
                                    Mật khẩu hiện tại
                                </label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-2">
                                    Mật khẩu mới
                                </label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                    Xác nhận mật khẩu mới
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setPasswordError("");
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={isChangingPassword}
                                >
                                    {isChangingPassword ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        "Đổi mật khẩu"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* Login History Modal - Only render if session exists */}
            {session?.user && showLoginHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-foreground">Lịch sử đăng nhập</h2>
                            <button
                                onClick={() => setShowLoginHistory(false)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-foreground">Thiết bị hiện tại</p>
                                        <p className="text-sm text-muted-foreground">Windows • Chrome</p>
                                    </div>
                                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                                        Đang hoạt động
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                    Đăng nhập lúc: {new Date().toLocaleString("vi-VN")}
                                </p>
                            </div>

                            <p className="text-sm text-muted-foreground text-center py-4">
                                Không có lịch sử đăng nhập khác
                            </p>
                        </div>

                        <div className="mt-6">
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={() => setShowLoginHistory(false)}
                            >
                                Đóng
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
