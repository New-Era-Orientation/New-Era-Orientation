"use client";

import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/client/components/ui/Button";
import { Card, CardContent } from "@/client/components/ui/Card";
import Link from "next/link";

interface ErrorDisplayProps {
    title?: string;
    message?: string;
    showRetry?: boolean;
    showHome?: boolean;
    showBack?: boolean;
    onRetry?: () => void;
}

export function ErrorDisplay({
    title = "Đã xảy ra lỗi",
    message = "Không thể tải dữ liệu. Vui lòng thử lại sau.",
    showRetry = true,
    showHome = true,
    showBack = false,
    onRetry,
}: ErrorDisplayProps) {
    return (
        <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-destructive/10 p-3">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                
                <h3 className="mb-2 text-lg font-semibold text-destructive">{title}</h3>
                <p className="mb-6 max-w-md text-muted-foreground">{message}</p>
                
                <div className="flex gap-2">
                    {showBack && (
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại
                        </Button>
                    )}
                    
                    {showRetry && onRetry && (
                        <Button variant="outline" onClick={onRetry}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Thử lại
                        </Button>
                    )}
                    
                    {showHome && (
                        <Button asChild>
                            <Link href="/dashboard">
                                <Home className="mr-2 h-4 w-4" />
                                Trang chủ
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

interface ErrorPageProps {
    title?: string;
    message?: string;
    showRetry?: boolean;
    onRetry?: () => void;
}

export function ErrorPage({
    title = "Đã xảy ra lỗi",
    message = "Không thể tải trang. Vui lòng thử lại sau.",
    showRetry = true,
    onRetry,
}: ErrorPageProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <ErrorDisplay
                title={title}
                message={message}
                showRetry={showRetry}
                showHome={true}
                showBack={true}
                onRetry={onRetry}
            />
        </div>
    );
}

interface NotFoundDisplayProps {
    title?: string;
    message?: string;
    backLink?: string;
    backLabel?: string;
}

export function NotFoundDisplay({
    title = "Không tìm thấy",
    message = "Nội dung bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.",
    backLink = "/dashboard",
    backLabel = "Về trang chủ",
}: NotFoundDisplayProps) {
    return (
        <div className="flex min-h-[60vh] items-center justify-center p-4">
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="mb-4 text-6xl">🔍</div>
                    
                    <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                    <p className="mb-6 max-w-md text-muted-foreground">{message}</p>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại
                        </Button>
                        
                        <Button asChild>
                            <Link href={backLink}>
                                <Home className="mr-2 h-4 w-4" />
                                {backLabel}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    message: string;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                {icon && <div className="mb-4 text-4xl text-muted-foreground">{icon}</div>}
                
                <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                <p className="mb-6 max-w-md text-muted-foreground">{message}</p>
                
                {action && (
                    action.href ? (
                        <Button asChild>
                            <Link href={action.href}>{action.label}</Link>
                        </Button>
                    ) : (
                        <Button onClick={action.onClick}>{action.label}</Button>
                    )
                )}
            </CardContent>
        </Card>
    );
}
