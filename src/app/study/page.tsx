import { BookOpen, ArrowRight, Sparkles, Clock, Target } from "lucide-react";
import Link from "next/link";

export default function StudyPage() {
    const studyTips = [
        {
            icon: Clock,
            title: "Học đều đặn",
            description: "Dành 30 phút mỗi ngày để duy trì thói quen học",
        },
        {
            icon: Target,
            title: "Đặt mục tiêu",
            description: "Hoàn thành 1 chương mỗi tuần để tiến bộ ổn định",
        },
        {
            icon: Sparkles,
            title: "Ôn tập thường xuyên",
            description: "Làm lại các bài tập để nhớ lâu hơn",
        },
    ];

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
            <div className="max-w-2xl text-center">
                {/* Icon */}
                <div className="mx-auto mb-8 inline-flex rounded-full bg-primary/10 p-8 text-primary motion-safe:animate-pulse">
                    <BookOpen className="h-16 w-16" aria-hidden="true" />
                </div>
                
                {/* Heading */}
                <h1 className="mb-4 text-3xl font-bold text-foreground">
                    Chọn bài học để bắt đầu
                </h1>
                <p className="mb-8 text-lg text-muted-foreground">
                    Sử dụng thanh điều hướng bên trái để chọn bài học.
                    Mỗi bài bao gồm lý thuyết chi tiết và ví dụ thực hành.
                </p>

                {/* Study Tips */}
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    {studyTips.map((tip, index) => (
                        <div 
                            key={index}
                            className="rounded-xl border border-border bg-secondary/50 p-4 text-left"
                        >
                            <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary">
                                <tip.icon className="h-5 w-5" aria-hidden="true" />
                            </div>
                            <h3 className="mb-1 font-semibold text-foreground">{tip.title}</h3>
                            <p className="text-sm text-muted-foreground">{tip.description}</p>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <Link
                    href="/study/khoa-hoc-may-tinh-la-gi"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                    Bắt đầu với bài đầu tiên
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
            </div>
        </div>
    );
}
