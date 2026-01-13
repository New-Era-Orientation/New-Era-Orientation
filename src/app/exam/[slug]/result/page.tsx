import { notFound } from "next/navigation";
import { getExamBySlug } from "@/server/repositories/exam.repository";
import ExamResultPageClient from "./ExamResultPageClient";

export default async function ExamResultPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const exam = await getExamBySlug(slug);

    if (!exam) {
        return notFound();
    }

    return <ExamResultPageClient exam={exam} />;
}
