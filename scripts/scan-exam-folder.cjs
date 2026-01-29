/**
 * Script Scan ngân hàng đề thi - Không cần database
 * 
 * Sử dụng: node scripts/scan-exam-folder.cjs <folder-path>
 */

const fs = require("fs");
const path = require("path");

// Province mapping
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

// Non-Tin-học subjects to skip
const SKIP_SUBJECTS = [
    "TIENG ANH", "TIẾNG ANH", "KTPL", "hóa", "HÓA", "lý", "LÝ", 
    "toán", "TOÁN", "văn", "VĂN", "SINH", "sinh", "SỬ", "sử", 
    "ĐỊA", "địa", "GDCD", "gdcd"
];

/**
 * Check if file should be skipped (not Tin học)
 */
function shouldSkip(filePath) {
    const fileName = path.basename(filePath).toUpperCase();
    const dirPath = filePath.toUpperCase();
    
    for (const subject of SKIP_SUBJECTS) {
        if (fileName.includes(subject.toUpperCase()) || 
            dirPath.includes(`\\${subject.toUpperCase()}\\`)) {
            return true;
        }
    }
    
    // Check if it's in a Tin học folder
    if (dirPath.includes("TIN HOC") || dirPath.includes("TIN HỌC") || 
        dirPath.includes("TINHOC")) {
        return false;
    }
    
    // If in root level (ĐỀ CÁC SỞ/Province/file.docx), include it
    return false;
}

/**
 * Scan folder recursively
 */
function scanFolder(folderPath, files = []) {
    if (!fs.existsSync(folderPath)) {
        console.error(`Folder not found: ${folderPath}`);
        return files;
    }
    
    const items = fs.readdirSync(folderPath);
    
    for (const item of items) {
        // Skip hidden files and temp files
        if (item.startsWith(".") || item.startsWith("~$")) continue;
        
        const itemPath = path.join(folderPath, item);
        
        try {
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                scanFolder(itemPath, files);
            } else if (stat.isFile()) {
                const ext = path.extname(item).toLowerCase();
                if ((ext === ".docx" || ext === ".doc") && !shouldSkip(itemPath)) {
                    files.push(itemPath);
                }
            }
        } catch (err) {
            console.warn(`Warning: Cannot access ${itemPath}`);
        }
    }
    
    return files;
}

/**
 * Extract province from path - cải thiện nhận diện
 */
function extractProvince(filePath) {
    const fileName = path.basename(filePath).toUpperCase();
    const normalizedPath = filePath.toUpperCase();
    
    // Additional province name mappings (from filename)
    const PROVINCE_ALIASES = {
        "BẮC GIANG": ["BAC GIANG", "BẮC GIANG"],
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
    };
    
    // First check directory structure for province name
    for (const province of Object.keys(PROVINCE_MAP)) {
        if (normalizedPath.includes(province.toUpperCase())) {
            return province;
        }
    }
    
    // Then check filename for province aliases
    for (const [province, aliases] of Object.entries(PROVINCE_ALIASES)) {
        for (const alias of aliases) {
            if (fileName.includes(alias.toUpperCase())) {
                return province;
            }
        }
    }
    
    // Extract from common filename patterns
    // "SỞ HÀ NỘI.docx" -> "Hà Nội"
    const soMatch = fileName.match(/SỞ\s+([^.]+)/);
    if (soMatch) {
        const soProvince = soMatch[1].trim();
        for (const province of Object.keys(PROVINCE_MAP)) {
            if (province.toUpperCase().includes(soProvince) || 
                soProvince.includes(province.toUpperCase())) {
                return province;
            }
        }
    }
    
    return "Unknown";
}

/**
 * Check if file is answer key
 */
function isAnswerKey(fileName) {
    return /[-_]?\s*(ĐA|ĐÁP\s*ÁN|DA\b)/i.test(fileName);
}

/**
 * Match exam files with answer keys
 */
function matchExamsWithAnswers(files) {
    const examFiles = [];
    const answerFiles = [];
    
    for (const file of files) {
        const fileName = path.basename(file);
        if (isAnswerKey(fileName)) {
            answerFiles.push(file);
        } else {
            examFiles.push(file);
        }
    }
    
    // Create exam entries
    const exams = examFiles.map(examPath => {
        const fileName = path.basename(examPath);
        const province = extractProvince(examPath);
        const isSo = examPath.includes("ĐỀ CÁC SỞ");
        
        // Try to find matching answer file
        const examBaseName = fileName
            .replace(/\.(docx?|pdf)$/i, "")
            .replace(/\s+/g, " ")
            .trim()
            .toUpperCase();
        
        let answerPath = null;
        for (const answerFile of answerFiles) {
            const answerDir = path.dirname(answerFile);
            const examDir = path.dirname(examPath);
            
            // Must be in same directory
            if (answerDir !== examDir) continue;
            
            const answerBaseName = path.basename(answerFile)
                .replace(/\.(docx?|pdf)$/i, "")
                .replace(/[-_]?\s*(ĐA|ĐÁP\s*ÁN|DA)\s*/gi, "")
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
    
    return exams;
}

// Main
function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log("Usage: node scripts/scan-exam-folder.cjs <folder-path>");
        process.exit(1);
    }
    
    const folderPath = path.resolve(args[0]);
    console.log(`\n🔍 Scanning: ${folderPath}\n`);
    
    const files = scanFolder(folderPath);
    const exams = matchExamsWithAnswers(files);
    
    // Group by province
    const byProvince = {};
    for (const exam of exams) {
        if (!byProvince[exam.province]) {
            byProvince[exam.province] = [];
        }
        byProvince[exam.province].push(exam);
    }
    
    // Print results
    console.log("=".repeat(80));
    console.log("📊 EXAM FILES FOUND:");
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
    const withoutAnswer = exams.filter(e => !e.answerPath).length;
    
    console.log("\n" + "=".repeat(80));
    console.log("📈 SUMMARY:");
    console.log("=".repeat(80));
    console.log(`   Tổng số đề thi: ${exams.length}`);
    console.log(`   Có đáp án: ${withAnswer}`);
    console.log(`   Không có đáp án: ${withoutAnswer}`);
    console.log(`   Số tỉnh/thành: ${provinces.length}`);
    
    // Generate JSON output
    const output = {
        scannedAt: new Date().toISOString(),
        folderPath,
        summary: {
            total: exams.length,
            withAnswer,
            withoutAnswer,
            provinces: provinces.length,
        },
        exams: exams.map(e => ({
            examPath: e.examPath,
            answerPath: e.answerPath,
            province: e.province,
            type: e.type,
        })),
    };
    
    const outputPath = path.join(process.cwd(), "data", "exam-bank-scan.json");
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`\n💾 Scan result saved to: ${outputPath}`);
}

main();
