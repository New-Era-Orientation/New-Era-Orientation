"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Suspense } from "react";

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    const errorMessages: Record<string, { title: string; description: string }> = {
        Configuration: {
            title: "Lỗi cấu hình",
            description: "Có vấn đề với cấu hình server. Vui lòng liên hệ quản trị viên.",
        },
        AccessDenied: {
            title: "Truy cập bị từ chối",
            description: "Bạn không có quyền truy cập tài nguyên này.",
        },
        Verification: {
            title: "Lỗi xác thực",
            description: "Token đã hết hạn hoặc đã được sử dụng. Vui lòng thử lại.",
        },
        OAuthSignin: {
            title: "Lỗi đăng nhập OAuth",
            description: "Không thể bắt đầu quy trình đăng nhập. Vui lòng thử lại.",
        },
        OAuthCallback: {
            title: "Lỗi callback OAuth",
            description: "Có lỗi xảy ra khi xử lý đăng nhập. Vui lòng thử lại.",
        },
        OAuthCreateAccount: {
            title: "Lỗi tạo tài khoản",
            description: "Không thể tạo tài khoản từ provider. Email có thể đã được sử dụng.",
        },
        EmailCreateAccount: {
            title: "Lỗi tạo tài khoản",
            description: "Không thể tạo tài khoản với email này.",
        },
        Callback: {
            title: "Lỗi callback",
            description: "Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.",
        },
        OAuthAccountNotLinked: {
            title: "Tài khoản chưa liên kết",
            description: "Email này đã được đăng ký với phương thức đăng nhập khác. Vui lòng sử dụng phương thức ban đầu.",
        },
        SessionRequired: {
            title: "Yêu cầu đăng nhập",
            description: "Bạn cần đăng nhập để truy cập trang này.",
        },
        Default: {
            title: "Đã xảy ra lỗi",
            description: "Có lỗi không xác định. Vui lòng thử lại sau.",
        },
    };

    const { title, description } = errorMessages[error || "Default"] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10">
                    <AlertTriangle className="h-10 w-10 text-red-400" />
                </div>

                <h1 className="mb-2 text-2xl font-bold text-foreground">
                    {title}
                </h1>
                
                <p className="mb-8 text-muted-foreground">
                    {description}
                </p>

                {error && (
                    <p className="mb-6 text-sm font-mono px-4 py-2 rounded-lg bg-muted text-muted-foreground">
                        Mã lỗi: {error}
                    </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link
                        href="/auth/login"
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
