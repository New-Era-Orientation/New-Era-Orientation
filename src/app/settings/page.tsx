"use client";

import { DashboardHeader } from "@/client/components/layout/DashboardHeader";
import { Bell, Palette, Globe, Lock, Save, Shield, Volume2, Eye } from "lucide-react";
import { Card } from "@/client/components/ui/Card";
import { useState } from "react";
import { Button } from "@/client/components/ui/Button";

export default function SettingsPage() {
    const [notifications, setNotifications] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [theme, setTheme] = useState("dark");
    const [language, setLanguage] = useState("vi");

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
            className={`relative h-6 w-11 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                checked ? "bg-primary" : "bg-muted"
            }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    checked ? "translate-x-5" : "translate-x-0.5"
                }`}
            />
        </button>
    );

    return (
        <div className="min-h-screen bg-background">
            <DashboardHeader />
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
                                    checked={notifications} 
                                    onChange={() => setNotifications(!notifications)}
                                    label="Bật/tắt thông báo push"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between py-2 border-t border-border">
                                <div>
                                    <h3 className="font-semibold text-foreground">Email thông báo</h3>
                                    <p className="text-sm text-muted-foreground">Nhận email về các cập nhật quan trọng</p>
                                </div>
                                <Toggle 
                                    checked={emailNotifications} 
                                    onChange={() => setEmailNotifications(!emailNotifications)}
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
                                    checked={soundEnabled} 
                                    onChange={() => setSoundEnabled(!soundEnabled)}
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
                                    onClick={() => setTheme("dark")}
                                    className={`rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                                        theme === "dark"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/30"
                                    }`}
                                    aria-pressed={theme === "dark"}
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
                                    onClick={() => setTheme("light")}
                                    className={`rounded-xl border-2 p-4 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${
                                        theme === "light"
                                            ? "border-primary bg-primary/10"
                                            : "border-border hover:border-primary/30"
                                    }`}
                                    aria-pressed={theme === "light"}
                                    disabled
                                >
                                    <div className="mb-3 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <div className="w-3/4 space-y-1">
                                            <div className="h-2 bg-slate-300 rounded" />
                                            <div className="h-2 bg-slate-300 rounded w-2/3" />
                                        </div>
                                    </div>
                                    <p className="font-semibold text-foreground">Sáng (Light)</p>
                                    <p className="text-xs text-muted-foreground">Sắp ra mắt</p>
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
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full max-w-xs appearance-none rounded-xl border border-border bg-secondary px-4 py-3 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="vi">🇻🇳 Tiếng Việt</option>
                                <option value="en">🇺🇸 English</option>
                            </select>
                        </div>
                    </Card>

                    {/* Security */}
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
                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors group">
                                <div className="flex items-center gap-3">
                                    <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    <span className="font-medium text-foreground">Đổi mật khẩu</span>
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground">→</span>
                            </button>
                            
                            <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors group">
                                <div className="flex items-center gap-3">
                                    <Eye className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                    <span className="font-medium text-foreground">Lịch sử đăng nhập</span>
                                </div>
                                <span className="text-muted-foreground group-hover:text-foreground">→</span>
                            </button>
                        </div>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button variant="default" className="group">
                            <Save className="h-5 w-5" aria-hidden="true" />
                            Lưu thay đổi
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}
