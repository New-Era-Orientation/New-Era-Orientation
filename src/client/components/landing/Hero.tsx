"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
    return (
        <section 
            className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32" 
            aria-labelledby="hero-title"
        >
            {/* Background Gradients */}
            <div 
                className="absolute top-0 left-1/2 -z-10 h-[50rem] w-[90rem] -translate-x-1/2 bg-gradient-to-b from-primary/20 to-transparent blur-3xl" 
                aria-hidden="true"
            />

            <div className="container mx-auto px-4 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                >
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    <span>Phiên bản mới: AI Tutor 2.0</span>
                </motion.div>

                <motion.h1
                    id="hero-title"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="mx-auto mb-6 max-w-4xl text-5xl font-bold tracking-tight text-foreground md:text-7xl lg:text-8xl"
                >
                    Chinh phục <br />
                    <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                        Kiến thức
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl"
                >
                    Nền tảng ôn thi trắc nghiệm thông minh với sự hỗ trợ của AI.
                    Học tập hiệu quả hơn với Flashcard, Đề thi thử và Phòng thi giả lập.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center justify-center gap-4 sm:flex-row"
                    role="group"
                    aria-label="Hành động chính"
                >
                    <Link
                        href="/study"
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        aria-label="Bắt đầu học ngay"
                    >
                        Bắt đầu ngay
                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Link>
                    <Link
                        href="/exam"
                        className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-6 py-3 font-medium text-foreground transition-colors hover:bg-accent"
                        aria-label="Khám phá kho đề thi"
                    >
                        Khám phá đề thi
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}
