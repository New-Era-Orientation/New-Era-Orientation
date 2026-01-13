"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BookOpen, PenTool, Target, ArrowRight } from "lucide-react";

const features = [
    {
        title: "Học tập thông minh",
        description: "Ôn luyện kiến thức với sự hỗ trợ của AI, Video bài giảng và Flashcard.",
        icon: BookOpen,
        color: "from-primary/20 to-cyan-500/20",
        iconColor: "text-primary bg-primary/10",
        href: "/study",
        colSpan: "md:col-span-2",
    },
    {
        title: "Thi thử",
        description: "Kho đề thi phong phú bám sát cấu trúc đề thật.",
        icon: PenTool,
        color: "from-purple-500/20 to-pink-500/20",
        iconColor: "text-purple-400 bg-purple-500/10",
        href: "/exam",
        colSpan: "md:col-span-1",
    },
    {
        title: "Luyện tập",
        description: "Trải nghiệm áp lực phòng thi thực tế.",
        icon: Target,
        color: "from-emerald-500/20 to-green-500/20",
        iconColor: "text-emerald-400 bg-emerald-500/10",
        href: "/simulation",
        colSpan: "md:col-span-1",
    },
];

export function FeatureGrid() {
    return (
        <section 
            className="container mx-auto px-4 py-20" 
            aria-labelledby="features-section-title"
        >
            <h2 id="features-section-title" className="sr-only">Các tính năng chính</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {features.map((feature, index) => (
                    <motion.div
                        key={feature.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={feature.colSpan}
                    >
                        <Link
                            href={feature.href}
                            className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-secondary/50 p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                            aria-label={`${feature.title} - ${feature.description}`}
                        >
                            <div 
                                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} 
                                aria-hidden="true" 
                            />

                            <div className="relative z-10 flex-1">
                                <div 
                                    className={`mb-4 inline-flex rounded-2xl p-3 transition-colors duration-200 ${feature.iconColor}`}
                                >
                                    <feature.icon className="h-8 w-8" aria-hidden="true" />
                                </div>
                                <h3 className="mb-2 text-2xl font-bold text-foreground">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>

                            <div className="relative z-10 mt-6 flex items-center gap-2 text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <span className="font-medium">Khám phá</span>
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
