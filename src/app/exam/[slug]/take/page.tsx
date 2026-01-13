import { ExamEngine } from "@/client/components/exam/ExamEngine";
import { notFound } from "next/navigation";
import { getExamBySlug } from "@/server/repositories/exam.repository";

export default async function ExamTakePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const exam = await getExamBySlug(slug);

    if (!exam) {
        return notFound();
    }

    return <ExamEngine exam={exam} />;
}
