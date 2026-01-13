import Link from "next/link";
import { ArrowRight, BookOpen, Target, Zap, Award, Users, TrendingUp, CheckCircle, Star, Quote } from "lucide-react";
import { buttonVariants } from "@/client/lib/button-variants";
import { cn } from "@/client/lib/utils";

export default function HomePage() {
    const features = [
        {
            icon: BookOpen,
            title: "Học tập thông minh",
            description: "Nội dung học tập đầy đủ với video và lý thuyết chi tiết. Hệ thống AI gợi ý lộ trình học phù hợp.",
            color: "from-blue-500/20 to-cyan-500/20",
            iconColor: "text-blue-400 bg-blue-500/10",
        },
        {
            icon: Target,
            title: "Luyện thi hiệu quả",
            description: "Đề thi thực tế với hệ thống chấm điểm tự động. Phản hồi chi tiết giúp bạn tiến bộ nhanh chóng.",
            color: "from-purple-500/20 to-pink-500/20",
            iconColor: "text-purple-400 bg-purple-500/10",
        },
        {
            icon: Award,
            title: "Theo dõi tiến độ",
            description: "Thống kê chi tiết và phân tích kết quả học tập. Biểu đồ trực quan giúp bạn nắm rõ điểm mạnh, yếu.",
            color: "from-green-500/20 to-emerald-500/20",
            iconColor: "text-green-400 bg-green-500/10",
        },
    ];

    const stats = [
        { value: "10,000+", label: "Học viên", icon: Users },
        { value: "500+", label: "Đề thi", icon: BookOpen },
        { value: "95%", label: "Hài lòng", icon: Star },
        { value: "24/7", label: "Hỗ trợ", icon: Zap },
    ];

    const testimonials = [
        {
            name: "Nguyễn Văn A",
            role: "Học sinh THPT",
            content: "NEO Edu đã giúp tôi đạt điểm cao trong kỳ thi HSG. Hệ thống đề thi rất sát với thực tế!",
            avatar: "A",
        },
        {
            name: "Trần Thị B",
            role: "Sinh viên Đại học",
            content: "Giao diện đẹp, dễ sử dụng. Tôi có thể học bất cứ lúc nào, ở đâu với NEO Edu.",
            avatar: "B",
        },
        {
            name: "Lê Văn C",
            role: "Học sinh THPT",
            content: "Chế độ luyện tập với gợi ý thông minh giúp tôi hiểu sâu hơn về từng dạng bài.",
            avatar: "C",
        },
    ];

    const steps = [
        { step: "01", title: "Đăng ký tài khoản", description: "Tạo tài khoản miễn phí chỉ trong 30 giây" },
        { step: "02", title: "Chọn môn học", description: "Lựa chọn môn học và cấp độ phù hợp" },
        { step: "03", title: "Bắt đầu học", description: "Học tập và luyện thi với hệ thống thông minh" },
        { step: "04", title: "Đạt mục tiêu", description: "Theo dõi tiến độ và đạt kết quả mong muốn" },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Skip Link for Accessibility */}
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-50 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                Bỏ qua đến nội dung chính
            </a>

            {/* Hero Section */}
            <section className="relative px-6 py-24 lg:px-8 lg:py-32" aria-labelledby="hero-heading">
                {/* Background gradient */}
                <div className="absolute inset-0 -z-10" aria-hidden="true">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
                    <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl opacity-50" />
                    <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-secondary/20 blur-3xl opacity-50" />
                </div>

                <div className="mx-auto max-w-4xl text-center fade-in-up" id="main-content">
                    {/* Badge */}
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm animate-accordion-down">
                        <Zap className="h-4 w-4" aria-hidden="true" />
                        <span>Nền tảng học tập thông minh #1 Việt Nam</span>
                    </div>

                    {/* Heading */}
                    <h1 id="hero-heading" className="mb-6 text-5xl font-bold tracking-tight text-foreground lg:text-7xl">
                        Chinh phục{" "}
                        <span className="text-gradient">
                            Tri thức
                        </span>
                        <br />
                        cùng NEO Edu
                    </h1>

                    {/* Description */}
                    <p className="mb-10 text-xl text-muted-foreground lg:text-2xl max-w-2xl mx-auto">
                        Học tập hiệu quả với hệ thống luyện thi thông minh, đề thi thực tế
                        và phản hồi chi tiết giúp bạn đạt điểm cao.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center items-center">
                        <Link
                            href="/dashboard"
                            className={cn(buttonVariants({ variant: "default", size: "lg" }), "group gap-2")}
                            aria-label="Bắt đầu học ngay - Miễn phí"
                        >
                            Bắt đầu miễn phí
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                        </Link>
                        <Link
                            href="/exam"
                            className={buttonVariants({ variant: "outline", size: "lg" })}
                            aria-label="Xem danh sách đề thi"
                        >
                            Khám phá đề thi
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                            <span>Miễn phí đăng ký</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                            <span>Không cần thẻ tín dụng</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
                            <span>Hủy bất cứ lúc nào</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="border-y border-border bg-secondary/30 px-6 py-16 backdrop-blur-sm" aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="sr-only">Thống kê NEO Edu</h2>
                <div className="mx-auto max-w-6xl">
                    <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="group text-center cursor-pointer transition-colors duration-200"
                            >
                                <div className="mx-auto mb-3 inline-flex rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary/20 transition-colors">
                                    <stat.icon className="h-6 w-6" aria-hidden="true" />
                                </div>
                                <div className="mb-1 text-4xl font-bold text-foreground">{stat.value}</div>
                                <div className="text-sm text-muted-foreground">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-20 lg:px-8 lg:py-28" aria-labelledby="features-heading">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 id="features-heading" className="mb-4 text-4xl font-bold text-foreground">
                            Tính năng nổi bật
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Mọi thứ bạn cần để chinh phục kỳ thi
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {features.map((feature, index) => (
                            <article
                                key={index}
                                className="glass-panel group relative overflow-hidden rounded-2xl p-8 cursor-pointer hover:shadow-xl hover:border-primary/30 transition-all duration-200"
                            >
                                <div
                                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                                    aria-hidden="true"
                                />

                                <div className={cn("mb-6 inline-flex rounded-xl p-4 transition-colors duration-200", feature.iconColor)}>
                                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                                </div>

                                <h3 className="mb-3 text-2xl font-bold text-foreground">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it works Section */}
            <section className="bg-secondary/20 px-6 py-20 lg:px-8 lg:py-28" aria-labelledby="how-it-works-heading">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 id="how-it-works-heading" className="mb-4 text-4xl font-bold text-foreground">
                            Cách thức hoạt động
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Chỉ 4 bước đơn giản để bắt đầu
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-4">
                        {steps.map((item, index) => (
                            <div key={index} className="relative text-center group">
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div
                                        className="absolute left-1/2 top-8 hidden h-0.5 w-full bg-muted md:block"
                                        aria-hidden="true"
                                    />
                                )}

                                <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card border border-border text-2xl font-bold text-primary shadow-lg transition-colors z-10">
                                    {item.step}
                                </div>
                                <h3 className="mb-2 text-xl font-bold text-foreground">{item.title}</h3>
                                <p className="text-muted-foreground">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="px-6 py-20 lg:px-8 lg:py-28" aria-labelledby="testimonials-heading">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 id="testimonials-heading" className="mb-4 text-4xl font-bold text-foreground">
                            Học viên nói gì về chúng tôi
                        </h2>
                        <p className="text-xl text-muted-foreground">
                            Hàng ngàn học viên đã thành công cùng NEO Edu
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {testimonials.map((testimonial, index) => (
                            <blockquote
                                key={index}
                                className="glass-panel relative rounded-2xl p-8"
                            >
                                <Quote className="absolute right-6 top-6 h-8 w-8 text-primary/20" aria-hidden="true" />

                                <p className="mb-6 text-muted-foreground leading-relaxed italic">
                                    "{testimonial.content}"
                                </p>

                                <footer className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-primary">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <cite className="not-italic font-semibold text-foreground">
                                            {testimonial.name}
                                        </cite>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </footer>
                            </blockquote>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-6 py-20 lg:px-8" aria-labelledby="cta-heading">
                <div className="mx-auto max-w-4xl">
                    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/5 p-12 text-center backdrop-blur-xl lg:p-16">
                        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 to-transparent" aria-hidden="true" />

                        <h2 id="cta-heading" className="mb-4 text-4xl font-bold text-foreground lg:text-5xl">
                            Sẵn sàng bắt đầu?
                        </h2>
                        <p className="mb-8 text-xl text-muted-foreground">
                            Tham gia cùng hàng ngàn học viên đang học tập hiệu quả mỗi ngày
                        </p>

                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                            <Link
                                href="/dashboard"
                                className={cn(buttonVariants({ variant: "default", size: "lg" }), "group gap-2")}
                                aria-label="Bắt đầu học miễn phí ngay hôm nay"
                            >
                                Bắt đầu ngay - Miễn phí
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </Link>
                        </div>

                        <p className="mt-6 text-sm text-muted-foreground">
                            Không cần thẻ tín dụng • Thiết lập trong 30 giây
                        </p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border bg-card/50 px-6 py-12">
                <div className="mx-auto max-w-6xl text-center">
                    <div className="mb-4 text-2xl font-bold text-foreground">
                        NEO <span className="text-primary">Edu</span>
                    </div>
                    <p className="text-muted-foreground">
                        © 2026 NEO Edu. Nền tảng học tập thông minh.
                    </p>
                </div>
            </footer>
        </div>
    );
}
