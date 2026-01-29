/**
 * Test script để parse 1 file đề thi docx
 * 
 * Sử dụng: node scripts/test-parse-exam.cjs <docx-file>
 */

const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function testParse(filePath) {
    console.log(`\n📄 Testing parse: ${filePath}\n`);
    console.log("=".repeat(80));
    
    // Read docx file
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log("📝 RAW TEXT (first 3000 chars):");
    console.log("-".repeat(80));
    console.log(text.substring(0, 3000));
    console.log("-".repeat(80));
    console.log(`\n📊 Total text length: ${text.length} characters`);
    
    // Parse questions
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    let questionCount = 0;
    let currentPart = 1;
    const questions = [];
    
    // Regex patterns - cải thiện để khớp nhiều định dạng
    // "Câu 1", "Câu 1:", "Câu 1.", "Câu 1 "
    // Sử dụng Unicode flag và các variations
    const questionPattern = /^C[âaà]u\s*(\d+)/iu;
    const choicePattern = /^([A-D])[.)\s]+/i;
    const subQuestionPattern = /^([a-d])[.)]\s*/i;
    const partPattern = /PH[ẦAÀ]N\s*(I|II|1|2)|PART\s*(I|II|1|2)/iu;
    
    // Debug first few lines
    console.log("\n🔍 DEBUG - First 20 lines:");
    for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i];
        const match = line.match(questionPattern);
        console.log(`  ${i}: ${match ? '✅ Q' + match[1] : '  '} "${line.substring(0, 60)}..."`);
    }
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for part headers
        const partMatch = line.match(partPattern);
        if (partMatch) {
            const partNum = partMatch[1] || partMatch[2];
            if (partNum === "II" || partNum === "2") {
                currentPart = 2;
                console.log(`\n📋 Found Part 2 header at line ${i}`);
            }
            continue;
        }
        
        // Check for questions
        const questionMatch = line.match(questionPattern);
        if (questionMatch) {
            questionCount++;
            const qNum = parseInt(questionMatch[1]);
            
            questions.push({
                num: qNum,
                part: currentPart,
                line: i,
                text: line.substring(0, 100) + "..."
            });
        }
    }
    
    console.log(`\n📊 ANALYSIS:`);
    console.log("-".repeat(80));
    console.log(`Total lines: ${lines.length}`);
    console.log(`Questions found: ${questionCount}`);
    
    // Show question breakdown by part
    const part1Qs = questions.filter(q => q.part === 1);
    const part2Qs = questions.filter(q => q.part === 2);
    
    console.log(`\nPart 1 questions: ${part1Qs.length}`);
    console.log(`Part 2 questions: ${part2Qs.length}`);
    
    console.log("\n📝 QUESTIONS FOUND:");
    console.log("-".repeat(80));
    
    for (const q of questions.slice(0, 10)) {
        console.log(`[Part ${q.part}] Câu ${q.num}: ${q.text}`);
    }
    
    if (questions.length > 10) {
        console.log(`... and ${questions.length - 10} more questions`);
    }
    
    // Output to JSON
    const output = {
        filePath,
        textLength: text.length,
        lineCount: lines.length,
        questionCount,
        part1Count: part1Qs.length,
        part2Count: part2Qs.length,
        questions: questions.map(q => ({
            num: q.num,
            part: q.part,
            preview: q.text
        }))
    };
    
    const outputPath = filePath.replace(/\.(docx?|pdf)$/i, "-analysis.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`\n💾 Analysis saved to: ${outputPath}`);
}

// Main
const args = process.argv.slice(2);
if (args.length === 0) {
    console.log("Usage: node scripts/test-parse-exam.cjs <docx-file>");
    process.exit(1);
}

testParse(path.resolve(args[0])).catch(console.error);
