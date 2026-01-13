/**
 * Seed achievements vào database
 */
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false }
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

const achievements = [
    // LEARNING category
    {
        name: "Người mới bắt đầu",
        slug: "first-topic",
        description: "Hoàn thành bài học đầu tiên",
        icon: "📚",
        category: "LEARNING",
        requirement: { type: "topics_completed", value: 1 },
        points: 10,
        rarity: "COMMON",
        secret: false
    },
    {
        name: "Học viên chăm chỉ",
        slug: "topics-10",
        description: "Hoàn thành 10 bài học",
        icon: "📖",
        category: "LEARNING",
        requirement: { type: "topics_completed", value: 10 },
        points: 50,
        rarity: "UNCOMMON",
        secret: false
    },
    {
        name: "Người ham học",
        slug: "topics-50",
        description: "Hoàn thành 50 bài học",
        icon: "🎓",
        category: "LEARNING",
        requirement: { type: "topics_completed", value: 50 },
        points: 200,
        rarity: "RARE",
        secret: false
    },
    {
        name: "Bậc thầy kiến thức",
        slug: "topics-100",
        description: "Hoàn thành 100 bài học",
        icon: "🏆",
        category: "LEARNING",
        requirement: { type: "topics_completed", value: 100 },
        points: 500,
        rarity: "LEGENDARY",
        secret: false
    },
    
    // EXAM category
    {
        name: "Thử thách đầu tiên",
        slug: "first-exam",
        description: "Hoàn thành bài thi đầu tiên",
        icon: "✏️",
        category: "EXAM",
        requirement: { type: "exams_completed", value: 1 },
        points: 15,
        rarity: "COMMON",
        secret: false
    },
    {
        name: "Chiến binh thi cử",
        slug: "exams-10",
        description: "Hoàn thành 10 bài thi",
        icon: "⚔️",
        category: "EXAM",
        requirement: { type: "exams_completed", value: 10 },
        points: 100,
        rarity: "UNCOMMON",
        secret: false
    },
    {
        name: "Điểm tuyệt đối",
        slug: "perfect-score",
        description: "Đạt điểm 10 trong một bài thi",
        icon: "💯",
        category: "EXAM",
        requirement: { type: "perfect_score", value: 1 },
        points: 100,
        rarity: "RARE",
        secret: false
    },
    {
        name: "Siêu sao",
        slug: "perfect-5",
        description: "Đạt điểm 10 trong 5 bài thi",
        icon: "⭐",
        category: "EXAM",
        requirement: { type: "perfect_score", value: 5 },
        points: 300,
        rarity: "EPIC",
        secret: false
    },
    {
        name: "Huyền thoại",
        slug: "perfect-10",
        description: "Đạt điểm 10 trong 10 bài thi",
        icon: "👑",
        category: "EXAM",
        requirement: { type: "perfect_score", value: 10 },
        points: 1000,
        rarity: "LEGENDARY",
        secret: true
    },
    
    // STREAK category
    {
        name: "Khởi đầu tốt lành",
        slug: "streak-3",
        description: "Duy trì streak 3 ngày liên tiếp",
        icon: "🔥",
        category: "STREAK",
        requirement: { type: "streak_days", value: 3 },
        points: 30,
        rarity: "COMMON",
        secret: false
    },
    {
        name: "Tuần lễ hoàn hảo",
        slug: "streak-7",
        description: "Duy trì streak 7 ngày liên tiếp",
        icon: "🌟",
        category: "STREAK",
        requirement: { type: "streak_days", value: 7 },
        points: 70,
        rarity: "UNCOMMON",
        secret: false
    },
    {
        name: "Nửa tháng kiên trì",
        slug: "streak-15",
        description: "Duy trì streak 15 ngày liên tiếp",
        icon: "💪",
        category: "STREAK",
        requirement: { type: "streak_days", value: 15 },
        points: 150,
        rarity: "RARE",
        secret: false
    },
    {
        name: "Một tháng bền bỉ",
        slug: "streak-30",
        description: "Duy trì streak 30 ngày liên tiếp",
        icon: "🏅",
        category: "STREAK",
        requirement: { type: "streak_days", value: 30 },
        points: 500,
        rarity: "EPIC",
        secret: false
    },
    {
        name: "Kỷ lục 100 ngày",
        slug: "streak-100",
        description: "Duy trì streak 100 ngày liên tiếp",
        icon: "🎖️",
        category: "STREAK",
        requirement: { type: "streak_days", value: 100 },
        points: 2000,
        rarity: "LEGENDARY",
        secret: true
    },
    
    // SPECIAL category
    {
        name: "Người tiên phong",
        slug: "early-adopter",
        description: "Là một trong những người dùng đầu tiên",
        icon: "🚀",
        category: "SPECIAL",
        requirement: { type: "special", value: 0 },
        points: 100,
        rarity: "EPIC",
        secret: false
    },
    {
        name: "Marathon học tập",
        slug: "study-marathon",
        description: "Dành 10 giờ học tập trên nền tảng",
        icon: "🏃",
        category: "SPECIAL",
        requirement: { type: "total_time", value: 600 },
        points: 200,
        rarity: "RARE",
        secret: false
    },
];

async function main() {
    console.log("🏆 Seeding achievements...");
    
    for (const achievement of achievements) {
        await prisma.achievement.upsert({
            where: { slug: achievement.slug },
            update: {},
            create: {
                name: achievement.name,
                slug: achievement.slug,
                description: achievement.description,
                icon: achievement.icon,
                category: achievement.category as "LEARNING" | "EXAM" | "STREAK" | "SOCIAL" | "SPECIAL",
                requirement: achievement.requirement,
                points: achievement.points,
                rarity: achievement.rarity as "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY",
                secret: achievement.secret
            }
        });
        console.log(`  ✅ ${achievement.icon} ${achievement.name}`);
    }
    
    console.log(`\n✨ Seeded ${achievements.length} achievements!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
