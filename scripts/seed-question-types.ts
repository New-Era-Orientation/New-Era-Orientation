import { prisma } from '../src/server/db/db';

async function main() {
    const types = [
        {
            id: 'MULTIPLE_CHOICE',
            name: 'Trắc nghiệm',
            description: 'Chọn 1 đáp án đúng trong các lựa chọn',
            scoringConfig: { correct: 1, wrong: 0 },
        },
        {
            id: 'TRUE_FALSE',
            name: 'Đúng/Sai',
            description: 'Mỗi ý có 2 lựa chọn đúng hoặc sai, bắt buộc 4 ý',
            scoringConfig: { "1": 0.1, "2": 0.25, "3": 0.5, "4": 1.0 },
        },
        {
            id: 'SHORT_ANSWER',
            name: 'Trả lời ngắn',
            description: 'Điền số hoặc chuỗi ngắn (tối đa 4 ký tự)',
            scoringConfig: { maxLength: 4, allowFloat: true },
        },
    ];

    for (const type of types) {
        await prisma.questionType.upsert({
            where: { id: type.id },
            update: {
                name: type.name,
                description: type.description,
                scoringConfig: type.scoringConfig,
            },
            create: type,
        });
        console.log(`✅ Upserted QuestionType: ${type.id}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
