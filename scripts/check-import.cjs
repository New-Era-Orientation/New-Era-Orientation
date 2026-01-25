require('dotenv').config();
const { Pool } = require('pg');

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    try {
        // Check subjects with schools
        const result = await pool.query(`
            SELECT s.name as "Subject", sc.name as "School", COUNT(q.id) as "Questions"
            FROM subjects s
            LEFT JOIN schools sc ON s."schoolId" = sc.id
            LEFT JOIN questions q ON s.id = q."subjectId"
            WHERE s."schoolId" IS NOT NULL
            GROUP BY s.id, sc.name
            ORDER BY sc.name, s.name
        `);
        
        console.log('\n📊 Môn học đại học đã import:\n');
        console.table(result.rows);
        
        // Check chapters
        const chaptersResult = await pool.query(`
            SELECT s.name as "Subject", COUNT(c.id) as "Chapters"
            FROM subjects s
            JOIN chapters c ON s.id = c."subjectId"
            WHERE s."schoolId" IS NOT NULL
            GROUP BY s.id
            ORDER BY s.name
        `);
        
        console.log('\n📖 Chapters theo môn:\n');
        console.table(chaptersResult.rows);
        
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
