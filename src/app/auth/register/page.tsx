"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Github, Check, X } from "lucide-react";
import { Button } from "@/client/components/ui/Button";
import { Input } from "@/client/components/ui/Input";
import { Card, CardContent } from "@/client/components/ui/Card";
import { cn } from "@/client/lib/utils";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const passwordRequirements = [
        { label: "Ít nhất 8 ký tự", met: formData.password.length >= 8 },
        { label: "Có chữ hoa", met: /[A-Z]/.test(formData.password) },
        { label: "Có chữ số", met: /[0-9]/.test(formData.password) },
    ];

    const allRequirementsMet = passwordRequirements.every(r => r.met);
    const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!allRequirementsMet) {
            setError("Mật khẩu chưa đáp ứng yêu cầu");
            return;
        }

        if (!passwordsMatch) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Đăng ký thất bại");
                return;
            }

            router.push("/auth/login?registered=true");
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
            <div className="w-full max-w-md space-y-8">
                {/* Logo */}
                <div className="text-center">
                    <Link href="/" className="inline-flex items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-purple-600">
                            <span className="text-xl font-bold text-white">N</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">NEO Edu</span>
                    </Link>
                    <h1 className="mt-6 text-3xl font-bold text-foreground">
                        Tạo tài khoản
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        Đăng ký miễn phí và bắt đầu hành trình học tập.
                    </p>
                </div>

                <Card>
                    <CardContent className="p-8">
                        {error && (
                            <div className="mb-6 rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm font-medium animate-shake">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                id="name"
                                label="Họ và tên"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nguyễn Văn A"
                                leftIcon={<User className="h-4 w-4" />}
                            />

                            <Input
                                id="email"
                                type="email"
                                label="Email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="email@example.com"
                                leftIcon={<Mail className="h-4 w-4" />}
                            />

                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        label="Mật khẩu"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                        leftIcon={<Lock className="h-4 w-4" />}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                        className="absolute right-3 top-[34px] p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>

                                {formData.password && (
                                    <ul className="space-y-1 mt-2">
                                        {passwordRequirements.map((req, i) => (
                                            <li key={i} className="flex items-center gap-2 text-xs">
                                                {req.met ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <X className="h-3.5 w-3.5 text-destructive" />
                                                )}
                                                <span className={req.met ? "text-emerald-500" : "text-muted-foreground"}>
                                                    {req.label}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        label="Xác nhận mật khẩu"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        leftIcon={<Lock className="h-4 w-4" />}
                                        error={formData.confirmPassword && !passwordsMatch ? "Mật khẩu không khớp" : undefined}
                                        className={cn(
                                            formData.confirmPassword && passwordsMatch && "border-emerald-500 focus-visible:ring-emerald-500"
                                        )}
                                    />
                                    {formData.confirmPassword && passwordsMatch && (
                                        <div className="absolute right-3 top-[34px]">
                                            <Check className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={isLoading || !allRequirementsMet}
                                className="w-full"
                                size="lg"
                            >
                                {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-card text-muted-foreground">
                                    hoặc đăng ký với
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" className="w-full">
                                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>
                            <Button variant="outline" className="w-full">
                                <Github className="mr-2 h-4 w-4" />
                                GitHub
                            </Button>
                        </div>

                        <p className="mt-6 text-center text-xs text-muted-foreground">
                            Bằng việc đăng ký, bạn đồng ý với{" "}
                            <Link href="/terms" className="text-primary hover:underline">Điều khoản dịch vụ</Link>
                            {" "}và{" "}
                            <Link href="/privacy" className="text-primary hover:underline">Chính sách bảo mật</Link>
                        </p>

                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            Đã có tài khoản?{" "}
                            <Link href="/auth/login" className="text-primary hover:underline font-medium">
                                Đăng nhập
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
