/**
 * IMPORT NGÂN HÀNG ĐỀ THI TIN HỌC 2025
 * =====================================
 * 
 * Script chính để import đề thi từ folder 2025 vào database
 * 
 * Commands:
 *   node scripts/import-de-tin-2025.cjs scan [folder]    - Scan và hiển thị danh sách đề
 *   node scripts/import-de-tin-2025.cjs parse <file>     - Parse 1 file và output JSON
 *   node scripts/import-de-tin-2025.cjs parse -m <file>  - Parse với hình ảnh và công thức
 *   node scripts/import-de-tin-2025.cjs import <folder>  - Import tất cả đề vào DB
 *   node scripts/import-de-tin-2025.cjs stats            - Hiển thị thống kê ngân hàng đề
 * 
 * Examples:
 *   node scripts/import-de-tin-2025.cjs scan "C:\path\to\2025"
 *   node scripts/import-de-tin-2025.cjs parse "exam.docx"
 *   node scripts/import-de-tin-2025.cjs parse -m "exam.docx"  # với hình ảnh
 */

const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ========================
// CONSTANTS
// ========================

const PROVINCE_MAP = {
    "An Giang": 89, "Bắc Giang": 24, "Bạc Liêu": 95, "Bắc Ninh": 27,
    "Bến Tre": 83, "Bình Dương": 74, "Bình Phước": 70, "Bình Thuận": 60,
    "Cần Thơ": 92, "Đà Nẵng": 48, "Đăk Lăk": 66, "Đắk Lắk": 66,
    "Đăk Nông": 67, "Đắk Nông": 67, "Đồng Nai": 75, "Đồng Tháp": 87,
    "Gia Lai": 64, "Hà Nội": 1, "Hà Tĩnh": 42, "Hải Phòng": 31,
    "Hậu Giang": 93, "Hòa Bình": 17, "Hồ Chí Minh": 79, "Huế": 46,
    "Khánh Hoà": 56, "Khánh Hòa": 56, "Kiên Giang": 91, "Lâm Đồng": 68,
    "Lào Cai": 10, "Long An": 80, "Nam Định": 36, "Nghệ An": 40,
    "Ninh Bình": 37, "Quảng Bình": 44, "Quảng Nam": 49, "Quảng Ninh": 22,
    "Sóc Trăng": 94, "Thái Bình": 34, "Thái Nguyên": 19, "Thanh Hóa": 38,
    "Tiền Giang": 82, "Trà Vinh": 84, "Tuyên Quang": 8, "Vĩnh Long": 86,
    "Vĩnh Phúc": 26, "Vũng Tàu": 77, "Phú Thọ": 25, "Phú Yên": 54,
    "Quảng Ngãi": 51, "Bình Định": 52,
};

const PROVINCE_ALIASES = {
    "Bắc Giang": ["BAC GIANG", "BẮC GIANG"],
    "Bắc Ninh": ["BAC NINH", "BẮC NINH"],
    "Bạc Liêu": ["BAC LIEU", "BẠC LIÊU"],
    "Bến Tre": ["BEN TRE", "BẾN TRE"],
    "Bình Thuận": ["BINH THUAN", "BÌNH THUẬN"],
    "Cần Thơ": ["CAN THO", "CẦN THƠ"],
    "Hà Nội": ["HA NOI", "HÀ NỘI", "SỞ HÀ NỘI"],
    "Hà Tĩnh": ["HA TINH", "HÀ TĨNH", "SỞ HÀ TĨNH"],
    "Hậu Giang": ["HAU GIANG", "HẬU GIANG"],
    "Hòa Bình": ["HOA BINH", "HÒA BÌNH", "HOÀ BÌNH"],
    "Huế": ["HUE", "HUẾ"],
    "Kiên Giang": ["KIEN GIANG", "KIÊN GIANG"],
    "Khánh Hòa": ["KHANH HOA", "KHÁNH HÒA", "KHÁNH HOÀ"],
    "Lâm Đồng": ["LAM DONG", "LÂM ĐỒNG"],
    "Nghệ An": ["NGHE AN", "NGHỆ AN"],
    "Quảng Bình": ["QUANG BINH", "QUẢNG BÌNH"],
    "Quảng Nam": ["QUANG NAM", "QUẢNG NAM"],
    "Quảng Ninh": ["QUANG NINH", "QUẢNG NINH"],
    "Thanh Hóa": ["THANH HOA", "THANH HÓA"],
    "Thái Nguyên": ["THAI NGUYEN", "THÁI NGUYÊN"],
    "Tiền Giang": ["TIEN GIANG", "TIỀN GIANG"],
    "Trà Vinh": ["TRA VINH", "TRÀ VINH"],
    "Tuyên Quang": ["TUYEN QUANG", "TUYÊN QUANG"],
    "Vũng Tàu": ["VUNG TAU", "VŨNG TÀU"],
    "Đồng Nai": ["DONG NAI", "ĐỒNG NAI", "NHƠN TRẠCH"],
    "Đồng Tháp": ["DONG THAP", "ĐỒNG THÁP"],
    "Đăk Lăk": ["DAK LAK", "ĐĂK LĂK", "ĐẮK LẮK"],
    "Vĩnh Long": ["VINH LONG", "VĨNH LONG"],
    "Long An": ["LONG AN"],
    "Gia Lai": ["GIA LAI"],
    "Thái Bình": ["THAI BINH", "THÁI BÌNH"],
    "Lào Cai": ["LAO CAI", "LÀO CAI"],
};

const SKIP_SUBJECTS = [
    "TIENG ANH", "TIẾNG ANH", "KTPL", "hóa", "HÓA", "lý", "LÝ",
    "toán", "TOÁN", "văn", "VĂN", "SINH", "sinh", "SỬ", "sử",
    "ĐỊA", "địa", "GDCD", "gdcd"
];

// ========================
// REGEX PATTERNS
// ========================

const PATTERNS = {
    question: /^C[âaà]u\s*(\d+)/iu,
    choice: /^([A-D])[.)\s]+(.+)/i,
    subQuestion: /^([a-d])[.)]\s*(.+)/i,
    partHeader: /PH[ẦAÀ]N\s*(I|II|1|2)/iu,
    inlineAnswer: /[đd][áa]p\s*[áa]n(?:\s*[đd][úu]ng)?[:\s]*([A-D])/iu,
    answerFile: /[-_]?\s*(ĐA|Đ[ÁA]P\s*[ÁA]N|DA\b)/iu,
    examCode: /m[ãa]\s*[đd][ềe][:\s]*(\d+)/iu,
    attempt: /L[ẦA]N\s*(\d+)/iu,
};

// ========================
// UTILITY FUNCTIONS
// ========================

function slugify(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function extractProvince(filePath) {
    const fileName = path.basename(filePath).toUpperCase();
    const normalizedPath = filePath.toUpperCase();

    // Check directory structure
    for (const province of Object.keys(PROVINCE_MAP)) {
        if (normalizedPath.includes(province.toUpperCase())) {
            return province;
        }
    }

    // Check filename with aliases
    for (const [province, aliases] of Object.entries(PROVINCE_ALIASES)) {
        for (const alias of aliases) {
            if (fileName.includes(alias.toUpperCase())) {
                return province;
            }
        }
    }

    // Extract from "SỞ ..." pattern
    const soMatch = fileName.match(/S[ỞO]\s+([^.]+)/iu);
    if (soMatch) {
        const soName = soMatch[1].trim();
        for (const province of Object.keys(PROVINCE_MAP)) {
            if (province.toUpperCase().includes(soName) ||
                soName.includes(province.toUpperCase())) {
                return province;
            }
        }
    }

    return "Unknown";
}

function isAnswerFile(fileName) {
    return PATTERNS.answerFile.test(fileName);
}

function shouldSkipFile(filePath) {
    const fileName = path.basename(filePath).toUpperCase();
    const dirPath = filePath.toUpperCase();

    for (const subject of SKIP_SUBJECTS) {
        if (fileName.includes(subject.toUpperCase()) ||
            dirPath.includes(`\\${subject.toUpperCase()}\\`)) {
            return true;
        }
    }
    return false;
}

// ========================
// SCAN FUNCTIONS
// ========================

function scanFolder(folderPath, files = []) {
    if (!fs.existsSync(folderPath)) return files;

    const items = fs.readdirSync(folderPath);

    for (const item of items) {
        if (item.startsWith(".") || item.startsWith("~$")) continue;

        const itemPath = path.join(folderPath, item);

        try {
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                scanFolder(itemPath, files);
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if ((ext === ".docx" || ext === ".doc") && !shouldSkipFile(itemPath)) {
                    files.push(itemPath);
                }
            }
        } catch (err) {
            // Skip inaccessible files
        }
    }

    return files;
}

function matchExamsWithAnswers(files) {
    const examFiles = [];
    const answerFiles = [];

    for (const file of files) {
        const fileName = path.basename(file);
        if (isAnswerFile(fileName)) {
            answerFiles.push(file);
        } else {
            examFiles.push(file);
        }
    }

    return examFiles.map(examPath => {
        const fileName = path.basename(examPath);
        const province = extractProvince(examPath);
        const isSo = examPath.includes("ĐỀ CÁC SỞ");

        // Find matching answer
        const examDir = path.dirname(examPath);
        const examBaseName = fileName
            .replace(/\.(docx?|pdf)$/i, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();

        let answerPath = null;
        for (const answerFile of answerFiles) {
            if (path.dirname(answerFile) !== examDir) continue;

            const answerBaseName = path.basename(answerFile)
                .replace(/\.(docx?|pdf)$/i, "")
                .replace(/[-_]?\s*(ĐA|Đ[ÁA]P\s*[ÁA]N|DA)\s*/gi, "")
                .replace(/\s+/g, " ")
                .trim()
                .toUpperCase();

            if (examBaseName === answerBaseName ||
                answerBaseName.includes(examBaseName) ||
                examBaseName.includes(answerBaseName)) {
                answerPath = answerFile;
                break;
            }
        }

        return {
            examPath,
            answerPath,
            fileName,
            province,
            type: isSo ? "SỞ" : "TRƯỜNG",
        };
    });
}

// ========================
// PARSE FUNCTIONS
// ========================

/**
 * Tạo image ID unique từ content
 */
function generateImageId(contentType, data) {
    const hash = crypto.createHash("md5").update(data).digest("hex").slice(0, 8);
    const ext = contentType.split("/")[1] || "png";
    return `img_${hash}.${ext}`;
}

/**
 * Phát hiện và chuyển đổi các ký tự đặc biệt dạng text thành LaTeX
 */
function detectInlineFormulas(text) {
    const formulas = [];
    let processedText = text;
    
    const patterns = [
        // Logarithm: log2(n), log(n)
        { regex: /\blog_?(\d+)?\s*\(?([^)]+)\)?/gi, convert: (m, base, arg) => 
            base ? `$\\log_{${base}}(${arg})$` : `$\\log(${arg})$` },
        
        // Big-O notation: O(n), O(n²), O(n log n)
        { regex: /O\(([^)]+)\)/g, convert: (m, content) => `$O(${content})$` },
        
        // Exponents: 2^n, n^2, 2^10
        { regex: /(\d+|\w)\^(\d+|\w+)/g, convert: (m, base, exp) => `$${base}^{${exp}}$` },
        
        // Subscripts: a_i, A_n
        { regex: /([A-Za-z])_(\d+|[A-Za-z])/g, convert: (m, base, sub) => `$${base}_{${sub}}$` },
        
        // Fractions written as a/b
        { regex: /\b(\d+)\/(\d+)\b/g, convert: (m, num, den) => `$\\frac{${num}}{${den}}$` },
        
        // Special symbols
        { regex: /≤/g, convert: () => "$\\leq$" },
        { regex: /≥/g, convert: () => "$\\geq$" },
        { regex: /≠/g, convert: () => "$\\neq$" },
        { regex: /→/g, convert: () => "$\\rightarrow$" },
        { regex: /←/g, convert: () => "$\\leftarrow$" },
        { regex: /∈/g, convert: () => "$\\in$" },
        { regex: /∧/g, convert: () => "$\\land$" },
        { regex: /∨/g, convert: () => "$\\lor$" },
    ];
    
    for (const { regex, convert } of patterns) {
        processedText = processedText.replace(regex, (...args) => {
            const result = convert(...args);
            const formulaContent = result.replace(/^\$|\$$/g, "");
            formulas.push({
                type: "latex",
                content: formulaContent,
                raw: args[0]
            });
            return result;
        });
    }
    
    return { text: processedText, formulas };
}

/**
 * Custom image converter cho mammoth
 */
function createImageConverter(images) {
    return mammoth.images.imgElement(async (image) => {
        const buffer = await image.readAsBuffer();
        const base64 = buffer.toString("base64");
        const imageId = generateImageId(image.contentType, buffer);
        
        images.set(imageId, {
            id: imageId,
            contentType: image.contentType,
            data: base64,
        });
        
        return {
            src: `data:${image.contentType};base64,${base64}`,
            "data-image-id": imageId
        };
    });
}

async function parseExamFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);

    const questions = [];
    let currentQuestion = null;
    let currentPart = 1;

    for (const line of lines) {
        // Check part header
        const partMatch = line.match(PATTERNS.partHeader);
        if (partMatch) {
            if (partMatch[1] === "II" || partMatch[1] === "2") {
                if (currentQuestion) questions.push(currentQuestion);
                currentPart = 2;
                currentQuestion = null;
            }
            continue;
        }

        // Check inline answer
        const answerMatch = line.match(PATTERNS.inlineAnswer);
        if (answerMatch && currentQuestion) {
            currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
            continue;
        }

        // Check new question
        const questionMatch = line.match(PATTERNS.question);
        if (questionMatch) {
            if (currentQuestion) questions.push(currentQuestion);

            const num = parseInt(questionMatch[1]);
            const content = line.substring(line.indexOf(num.toString()) + num.toString().length).trim();

            currentQuestion = {
                order: num,
                part: currentPart,
                content: content.replace(/^[.:]\s*/, ""),
                type: currentPart === 1 ? "MULTIPLE_CHOICE" : "TRUE_FALSE_GROUP",
                choices: [],
                correctAnswer: null,
            };
            continue;
        }

        // Check choice
        const choiceMatch = line.match(PATTERNS.choice);
        if (choiceMatch && currentQuestion && currentPart === 1) {
            currentQuestion.choices.push({
                letter: choiceMatch[1],
                content: choiceMatch[2],
            });
            continue;
        }

        // Append to content if needed
        if (currentQuestion && !line.match(/^[A-Da-d][.)]/)) {
            currentQuestion.content += " " + line;
        }
    }

    if (currentQuestion) questions.push(currentQuestion);

    // Extract metadata
    const fileName = path.basename(filePath);
    const province = extractProvince(filePath);
    const codeMatch = fileName.match(PATTERNS.examCode);
    const attemptMatch = fileName.match(PATTERNS.attempt);

    return {
        filePath,
        fileName,
        province,
        examCode: codeMatch ? codeMatch[1] : null,
        attempt: attemptMatch ? parseInt(attemptMatch[1]) : null,
        textLength: text.length,
        questionCount: questions.length,
        part1Count: questions.filter(q => q.part === 1).length,
        part2Count: questions.filter(q => q.part === 2).length,
        withAnswers: questions.filter(q => q.correctAnswer).length,
        questions,
    };
}

/**
 * Parse exam với hình ảnh và công thức
 */
async function parseExamFileWithMedia(filePath) {
    const buffer = fs.readFileSync(filePath);
    const images = new Map();
    
    // Convert to HTML with images
    const htmlResult = await mammoth.convertToHtml(
        { buffer },
        {
            convertImage: createImageConverter(images),
        }
    );
    
    // Also get raw text
    const textResult = await mammoth.extractRawText({ buffer });
    const text = textResult.value;
    const html = htmlResult.value;
    
    // Parse questions from text
    const basicResult = await parseExamFile(filePath);
    
    // Process formulas in questions
    for (const q of basicResult.questions) {
        const { text: processedContent, formulas } = detectInlineFormulas(q.content);
        if (formulas.length > 0) {
            q.content = processedContent;
            q.formulas = formulas;
        }
        
        // Process choices
        for (const choice of q.choices) {
            const { text: processedChoice, formulas: choiceFormulas } = detectInlineFormulas(choice.content);
            if (choiceFormulas.length > 0) {
                choice.content = processedChoice;
                choice.formulas = choiceFormulas;
            }
        }
    }
    
    // Extract image references from HTML
    const questionImages = {};
    const imgPattern = /<img[^>]*data-image-id="([^"]+)"[^>]*>/g;
    let match;
    let htmlLower = html.toLowerCase();
    
    // Simple approach: assign images to nearest question
    const htmlParts = html.split(/<p[^>]*>/i);
    let currentQNum = 0;
    
    for (const part of htmlParts) {
        const qMatch = part.match(/C[âaà]u\s*(\d+)/iu);
        if (qMatch) {
            currentQNum = parseInt(qMatch[1]);
        }
        
        while ((match = imgPattern.exec(part)) !== null) {
            if (currentQNum > 0) {
                if (!questionImages[currentQNum]) questionImages[currentQNum] = [];
                questionImages[currentQNum].push(match[1]);
            }
        }
    }
    
    // Assign images to questions
    for (const q of basicResult.questions) {
        if (questionImages[q.order]) {
            q.images = questionImages[q.order];
        }
    }
    
    // Convert images Map to array
    const imagesArray = Array.from(images.values());
    
    return {
        ...basicResult,
        html,
        images: imagesArray,
        totalImages: imagesArray.length,
        questionsWithImages: Object.keys(questionImages).length,
        questionsWithFormulas: basicResult.questions.filter(q => q.formulas && q.formulas.length > 0).length,
    };
}

// ========================
// CLI COMMANDS
// ========================

async function cmdScan(folderPath) {
    console.log(`\n🔍 Scanning: ${folderPath}\n`);

    const files = scanFolder(folderPath);
    const exams = matchExamsWithAnswers(files);

    // Group by province
    const byProvince = {};
    for (const exam of exams) {
        if (!byProvince[exam.province]) byProvince[exam.province] = [];
        byProvince[exam.province].push(exam);
    }

    console.log("=".repeat(80));
    console.log("📊 KẾT QUẢ SCAN NGÂN HÀNG ĐỀ TIN HỌC 2025:");
    console.log("=".repeat(80));

    const provinces = Object.keys(byProvince).sort();
    for (const province of provinces) {
        const provinceExams = byProvince[province];
        console.log(`\n📍 ${province} (${provinceExams.length} đề):`);

        for (const exam of provinceExams) {
            const hasAnswer = exam.answerPath ? "✅" : "⚠️";
            const type = exam.type === "SỞ" ? "[SỞ]" : "[TRƯỜNG]";
            console.log(`   ${hasAnswer} ${type} ${exam.fileName}`);
            if (exam.answerPath) {
                console.log(`      └─ Đáp án: ${path.basename(exam.answerPath)}`);
            }
        }
    }

    // Summary
    const withAnswer = exams.filter(e => e.answerPath).length;
    const soCount = exams.filter(e => e.type === "SỞ").length;
    const truongCount = exams.filter(e => e.type === "TRƯỜNG").length;

    console.log("\n" + "=".repeat(80));
    console.log("📈 THỐNG KÊ:");
    console.log("=".repeat(80));
    console.log(`   Tổng số đề: ${exams.length}`);
    console.log(`   Đề Sở GD&ĐT: ${soCount}`);
    console.log(`   Đề các trường: ${truongCount}`);
    console.log(`   Có đáp án: ${withAnswer}`);
    console.log(`   Không có đáp án: ${exams.length - withAnswer}`);
    console.log(`   Số tỉnh/thành: ${provinces.length}`);

    // Save to JSON
    const output = {
        scannedAt: new Date().toISOString(),
        folderPath,
        stats: {
            total: exams.length,
            so: soCount,
            truong: truongCount,
            withAnswer,
            withoutAnswer: exams.length - withAnswer,
            provinces: provinces.length,
        },
        exams: exams.map(e => ({
            examPath: e.examPath,
            answerPath: e.answerPath,
            province: e.province,
            type: e.type,
        })),
    };

    const outputPath = path.join(process.cwd(), "data", "de-tin-2025-scan.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`\n💾 Saved to: ${outputPath}`);
}

async function cmdParse(filePath, withMedia = false) {
    console.log(`\n📄 Parsing: ${filePath}`);
    if (withMedia) {
        console.log(`   📷 Image extraction: enabled`);
        console.log(`   📐 Formula detection: enabled`);
    }
    console.log("");

    const result = withMedia 
        ? await parseExamFileWithMedia(filePath)
        : await parseExamFile(filePath);

    console.log("=".repeat(80));
    console.log("📊 KẾT QUẢ PARSE:");
    console.log("=".repeat(80));
    console.log(`   File: ${result.fileName}`);
    console.log(`   Province: ${result.province}`);
    console.log(`   Exam Code: ${result.examCode || "N/A"}`);
    console.log(`   Attempt: ${result.attempt || "N/A"}`);
    console.log(`   Text Length: ${result.textLength} chars`);
    console.log(`   Total Questions: ${result.questionCount}`);
    console.log(`   Part 1 (MC): ${result.part1Count}`);
    console.log(`   Part 2 (TF): ${result.part2Count}`);
    console.log(`   With Answers: ${result.withAnswers}`);
    
    if (withMedia) {
        console.log(`   🖼️  Images found: ${result.totalImages}`);
        console.log(`   📐 Questions with formulas: ${result.questionsWithFormulas}`);
        console.log(`   📷 Questions with images: ${result.questionsWithImages}`);
    }

    console.log("\n📝 CÂU HỎI MẪU:");
    console.log("-".repeat(80));

    for (const q of result.questions.slice(0, 5)) {
        console.log(`\nCâu ${q.order} [Part ${q.part}]:`);
        console.log(`   ${q.content.substring(0, 100)}...`);
        
        if (q.formulas && q.formulas.length > 0) {
            console.log(`   📐 Formulas: ${q.formulas.map(f => f.raw).join(", ")}`);
        }
        if (q.images && q.images.length > 0) {
            console.log(`   🖼️  Images: ${q.images.join(", ")}`);
        }
        
        if (q.choices.length > 0) {
            for (const c of q.choices) {
                const mark = c.letter === q.correctAnswer ? "✓" : " ";
                console.log(`   ${mark} ${c.letter}. ${c.content.substring(0, 50)}...`);
            }
        }
        if (q.correctAnswer) {
            console.log(`   → Đáp án: ${q.correctAnswer}`);
        }
    }
    
    // Show images summary if media mode
    if (withMedia && result.images && result.images.length > 0) {
        console.log("\n🖼️  HÌNH ẢNH TRÍCH XUẤT:");
        console.log("-".repeat(80));
        for (const img of result.images) {
            const sizeKB = Math.round(img.data.length * 0.75 / 1024);
            console.log(`   ${img.id} (${img.contentType}, ~${sizeKB}KB)`);
        }
    }

    // Save JSON
    const suffix = withMedia ? "-parsed-media" : "-parsed";
    const outputPath = filePath.replace(/\.(docx?|pdf)$/i, `${suffix}.json`);
    
    // For media version, also save images to separate folder
    if (withMedia && result.images && result.images.length > 0) {
        const imagesDir = path.join(path.dirname(filePath), "images");
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }
        
        for (const img of result.images) {
            const imagePath = path.join(imagesDir, img.id);
            const buffer = Buffer.from(img.data, "base64");
            fs.writeFileSync(imagePath, buffer);
        }
        console.log(`\n💾 Images saved to: ${imagesDir}`);
        
        // Remove base64 data from JSON output (too large)
        result.images = result.images.map(img => ({
            id: img.id,
            contentType: img.contentType,
            path: path.join("images", img.id),
        }));
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`💾 JSON saved to: ${outputPath}`);
}

async function cmdStats() {
    const scanFile = path.join(process.cwd(), "data", "de-tin-2025-scan.json");

    if (!fs.existsSync(scanFile)) {
        console.log("❌ Chưa có dữ liệu scan. Hãy chạy 'scan' trước.");
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(scanFile, "utf-8"));

    console.log("\n" + "=".repeat(80));
    console.log("📊 THỐNG KÊ NGÂN HÀNG ĐỀ TIN HỌC 2025:");
    console.log("=".repeat(80));
    console.log(`\n📅 Scan lần cuối: ${new Date(data.scannedAt).toLocaleString("vi-VN")}`);
    console.log(`📁 Folder: ${data.folderPath}`);
    console.log(`\n📈 Tổng quan:`);
    console.log(`   • Tổng số đề: ${data.stats.total}`);
    console.log(`   • Đề Sở GD&ĐT: ${data.stats.so}`);
    console.log(`   • Đề các trường: ${data.stats.truong}`);
    console.log(`   • Có đáp án: ${data.stats.withAnswer} (${Math.round(data.stats.withAnswer / data.stats.total * 100)}%)`);
    console.log(`   • Số tỉnh/thành: ${data.stats.provinces}`);

    // Group by province for detailed stats
    const byProvince = {};
    for (const exam of data.exams) {
        if (!byProvince[exam.province]) byProvince[exam.province] = { total: 0, withAnswer: 0 };
        byProvince[exam.province].total++;
        if (exam.answerPath) byProvince[exam.province].withAnswer++;
    }

    console.log(`\n📍 Chi tiết theo tỉnh/thành:`);
    const sortedProvinces = Object.entries(byProvince)
        .sort((a, b) => b[1].total - a[1].total);

    for (const [province, stats] of sortedProvinces) {
        const pct = stats.withAnswer > 0 ? Math.round(stats.withAnswer / stats.total * 100) : 0;
        console.log(`   ${province}: ${stats.total} đề (${stats.withAnswer} có đáp án - ${pct}%)`);
    }
}

// ========================
// MAIN
// ========================

async function main() {
    const args = process.argv.slice(2);
    
    // Parse flags
    const withMedia = args.includes("-m") || args.includes("--with-media");
    const filteredArgs = args.filter(a => !a.startsWith("-"));

    if (filteredArgs.length === 0) {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║           IMPORT NGÂN HÀNG ĐỀ TIN HỌC 2025                   ║
╠══════════════════════════════════════════════════════════════╣
║  Commands:                                                    ║
║    scan <folder>      Scan folder và hiển thị danh sách đề    ║
║    parse <file>       Parse 1 file docx và output JSON        ║
║    parse -m <file>    Parse với hình ảnh và công thức LaTeX   ║
║    stats              Hiển thị thống kê ngân hàng đề          ║
╠══════════════════════════════════════════════════════════════╣
║  Options:                                                     ║
║    -m, --with-media   Trích xuất hình ảnh và công thức        ║
╠══════════════════════════════════════════════════════════════╣
║  Examples:                                                    ║
║    node scripts/import-de-tin-2025.cjs scan "C:\\path\\2025"  ║
║    node scripts/import-de-tin-2025.cjs parse "exam.docx"      ║
║    node scripts/import-de-tin-2025.cjs parse -m "exam.docx"   ║
║    node scripts/import-de-tin-2025.cjs stats                  ║
╚══════════════════════════════════════════════════════════════╝
`);
        process.exit(0);
    }

    const command = filteredArgs[0].toLowerCase();

    switch (command) {
        case "scan":
            if (!filteredArgs[1]) {
                console.log("❌ Cần chỉ định folder path");
                process.exit(1);
            }
            await cmdScan(path.resolve(filteredArgs[1]));
            break;

        case "parse":
            if (!filteredArgs[1]) {
                console.log("❌ Cần chỉ định file path");
                process.exit(1);
            }
            await cmdParse(path.resolve(filteredArgs[1]), withMedia);
            break;

        case "stats":
            await cmdStats();
            break;

        default:
            console.log(`❌ Unknown command: ${command}`);
            process.exit(1);
    }
}

main().catch(console.error);
