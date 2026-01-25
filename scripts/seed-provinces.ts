import { prisma } from '../src/server/db/db';
import fs from 'fs';
import path from 'path';

async function main() {
    const filePath = path.join(process.cwd(), 'tinh.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split by line and remove empty lines
    const lines = fileContent.split('\n').filter(line => line.trim() !== '');

    console.log(`Found ${lines.length} lines. Processing...`);

    // Skip header if exists (starts with STT)
    const startIdx = lines[0].includes('STT') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        // Format: "1	Thủ đô Hà Nội" (Tab or Space separated)
        // Regex matches: Number at start, following by whitespace, then the rest is name
        const match = line.match(/^(\d+)\s+(.+)$/);

        if (match) {
            const id = parseInt(match[1]);
            const name = match[2].trim();

            console.log(`Upserting: [${id}] ${name}`);

            await prisma.province.upsert({
                where: { id: id },
                update: { name: name },
                create: {
                    id: id,
                    name: name,
                },
            });
        } else {
            console.warn(`Skipping invalid line: ${line}`);
        }
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
