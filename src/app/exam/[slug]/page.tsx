import { ExamDetailClient } from "@/client/components/exam/ExamDetailClient";
import { notFound } from "next/navigation";
import { getExamBySlug } from "@/server/repositories/exam.repository";

export default async function ExamDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const exam = await getExamBySlug(slug);

    if (!exam) {
        return notFound();
    }

    return <ExamDetailClient exam={exam} />;
}
