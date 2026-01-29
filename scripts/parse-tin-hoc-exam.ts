/**
 * Script Parse đề thi Tin học THPT từ file DOCX
 * 
 * Cấu trúc đề thi THPT Tin học 2025:
 * - Phần 1: 24 câu trắc nghiệm (0.25đ/câu = 6đ)
 * - Phần 2: 6 câu Đúng/Sai (mỗi câu 4 ý a,b,c,d)
 *   - 2 câu chung (bắt buộc)
 *   - 2 câu KHMT hoặc 2 câu THUD (chọn 1)
 * 
 * Sử dụng: npx tsx scripts/parse-tin-hoc-exam.ts <path-to-docx>
 */

import * as mammoth from "mammoth";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ========================
// TYPE DEFINITIONS
// ========================

/**
 * Hình ảnh được trích xuất từ DOCX
 */
interface ExtractedImage {
    id: string;
    contentType: string;
    data: string; // base64
    altText?: string;
}

/**
 * Công thức toán học
 */
interface MathFormula {
    type: "latex" | "mathml" | "text";
    content: string;
    raw?: string;
}

interface SubQuestion {
    label: string;
    content: string;
    contentHtml?: string; // HTML với hình ảnh inline
    isCorrect: boolean | null;
    images?: string[]; // Image IDs
    formulas?: MathFormula[];
}

/**
 * Các loại câu hỏi hỗ trợ
 * - MULTIPLE_CHOICE: Trắc nghiệm nhiều lựa chọn (thường 4 đáp án A,B,C,D)
 * - TRUE_FALSE: Đúng/Sai (2 đáp án)
 * - TRUE_FALSE_GROUP: Nhóm câu đúng/sai (4 mệnh đề a,b,c,d)
 * - FILL_BLANK: Điền khuyết
 * - MATCHING: Ghép đôi
 * - SHORT_ANSWER: Trả lời ngắn
 */
type QuestionType = 
    | "MULTIPLE_CHOICE" 
    | "TRUE_FALSE" 
    | "TRUE_FALSE_GROUP" 
    | "FILL_BLANK"
    | "MATCHING"
    | "SHORT_ANSWER";

interface ParseWarning {
    questionId: string;
    questionOrder: number;
    type: "MISSING_CHOICES" | "INCOMPLETE_CHOICES" | "EXTRA_CHOICES" | "NO_ANSWER" | "UNUSUAL_FORMAT" | "DETECTION_FAILED";
    message: string;
    suggestion?: string;
}

interface ParsedQuestion {
    id: string;
    order: number;
    content: string;
    contentHtml?: string; // HTML với hình ảnh/công thức inline
    type: QuestionType;
    track: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS";
    choices?: string[];
    choicesHtml?: string[]; // Choices với HTML
    correctAnswer?: string;
    expectedChoiceCount?: number; // Số đáp án mong đợi (thường là 4)
    actualChoiceCount?: number; // Số đáp án thực tế tìm được
    subQuestions?: SubQuestion[];
    points: number;
    images?: string[]; // Image IDs referenced in this question
    formulas?: MathFormula[];
    warnings?: ParseWarning[];
    rawContent?: string; // Nội dung gốc để debug
}

interface ParsedExam {
    title: string;
    slug: string;
    source: string;
    province?: string;
    school?: string;
    year: number;
    type: "STANDARD" | "MOCK" | "HSG";
    duration: number;
    rawText: string;
    rawHtml?: string; // HTML với hình ảnh và công thức
    part1Questions: ParsedQuestion[];
    part2CommonQuestions: ParsedQuestion[];
    part2CSQuestions: ParsedQuestion[];
    part2AIQuestions: ParsedQuestion[];
    images: Map<string, ExtractedImage>; // All images in the document
    warnings: ParseWarning[]; // Tổng hợp warnings từ tất cả câu hỏi
    subject?: string; // Môn học (tin-hoc, toan, vat-ly, etc.)
    expectedChoicesPerQuestion?: number; // Số đáp án mong đợi mỗi câu
}

interface ExamMetadata {
    province: string;
    school?: string;
    examCode?: string;
    attempt?: number; // Lần 1, Lần 2...
}

// ========================
// REGEX PATTERNS
// ========================

const PATTERNS = {
    // === TÌM CÂU HỎI - NHIỀU ĐỊNH DẠNG ===
    
    // Câu hỏi ở đầu dòng: "Câu 1:", "Câu 1.", "Câu 1", "Câu 1 "
    multipleChoice: /^C[âaà]u\s*(\d+)[\s.:]*(.+)?/iu,
    
    // Câu hỏi ở bất kỳ đâu (dùng để split text)
    questionSplit: /C[âaà]u\s*(\d+)[\s.:]*/giu,
    
    // Các định dạng câu hỏi khác
    questionAlt1: /^(\d+)[.)]\s*(.+)/,           // "1. Nội dung", "1) Nội dung"
    questionAlt2: /^Question\s*(\d+)[\s.:]*(.+)?/i,  // "Question 1:", "Question 1."
    questionAlt3: /^Q(\d+)[\s.:]*(.+)?/i,        // "Q1:", "Q1."
    questionAlt4: /^Bài\s*(\d+)[\s.:]*(.+)?/iu,  // "Bài 1:", "Bài 1."
    
    // === ĐÁNH SỐ ĐÁP ÁN - HỖ TRỢ NHIỀU ĐỊNH DẠNG ===
    
    // Đáp án A, B, C, D (chuẩn Tin học)
    choiceOption: /^([A-D])[.)\s]+(.+)/i,
    
    // Đáp án A-H (cho câu hỏi có nhiều hơn 4 đáp án)
    choiceOptionExtended: /^([A-H])[.)\s]+(.+)/i,
    
    // Đáp án 1, 2, 3, 4 (số)
    choiceOptionNumeric: /^(\d)[.)\s]+(.+)/i,
    
    // Đáp án Đ/S hoặc Đúng/Sai (True/False)
    choiceOptionTrueFalse: /^(Đ|S|Đúng|Sai|True|False)[.)\s]*(.*)/i,
    
    // Đáp án dạng (a), (b), (c), (d) với ngoặc
    choiceOptionParenthesis: /^\(([A-Da-d])\)\s*(.+)/i,
    
    // Đáp án trên cùng 1 dòng: "A. xxx   B. xxx   C. xxx   D. xxx"
    choiceInline: /([A-D])[.)\s]+([^A-D]+?)(?=\s+[A-D][.)]|$)/gi,
    
    // Câu hỏi đúng sai nhóm
    trueFalseGroup: /^C[âaà]u\s*(\d+)[\s.:]*(.+)?/iu,
    
    // Mệnh đề a), b), c), d) cho True/False group
    subQuestion: /^([a-d])[.)]\s*(.+)/i,
    
    // Mệnh đề với số La Mã: i), ii), iii), iv)
    subQuestionRoman: /^(i{1,3}|iv|v|vi{0,3})[.)\s]+(.+)/i,
    
    // Phần 1, Phần 2, PHẦN I, PHẦN II
    partHeader: /PH[ẦAÀ]N\s*(I|II|1|2)/iu,
    
    // Khoa học máy tính / Tin học ứng dụng
    csTrack: /khoa\s*h[ọo]c\s*m[áa]y\s*t[íi]nh|KHMT|[đd][ịi]nh\s*h[ướư]ng\s*1/iu,
    aiTrack: /tin\s*h[ọo]c\s*[ứu]ng\s*d[ụu]ng|THUD|[đd][ịi]nh\s*h[ướư]ng\s*2/iu,
    
    // === CÁC MÔN KHÁC (không chỉ Tin học) ===
    
    // Môn Sinh học, Hóa học thường có định dạng khác
    choiceOptionBiology: /^(I{1,4}|V|VI{0,3})[.)\s]+(.+)/i, // Roman numerals
    
    // Môn Toán - điền số
    fillBlank: /_{2,}|\.\.\./g,
    
    // === PHÁT HIỆN LOẠI CÂU HỎI ===
    
    // Câu hỏi Đúng/Sai đơn giản (không phải nhóm)
    simpleTrueFalse: /\b(đúng hay sai|true or false|chọn đúng|chọn sai)\b/iu,
    
    // Câu hỏi điền khuyết
    fillBlankQuestion: /\b(điền vào|điền số|điền từ|fill in|hoàn thành)\b/iu,
    
    // Câu hỏi ghép đôi
    matchingQuestion: /\b(ghép|nối|matching|pair)\b/iu,
    
    // Đáp án từ tên file: "-ĐA", "-ĐÁP ÁN"
    answerFile: /[-_]?(ĐA|Đ[ÁA]P\s*[ÁA]N)/iu,
    
    // Đáp án inline: "Đáp án đúng: A", "Đáp án: B"
    inlineAnswer: /[đd][áa]p\s*[áa]n(?:\s*[đd][úu]ng)?[:\s]*([A-H]|\d)/iu,
    
    // Mã đề: "MĐỀ 1234", "Mã đề: 123"
    examCode: /m[ãa]\s*[đd][ềe][:\s]*(\d+)/iu,
    
    // Province from path
    province: /(An Giang|Bắc Giang|Bạc Liêu|Bắc Ninh|Bến Tre|Bình Dương|Bình Phước|Bình Thuận|Cần Thơ|Đà Nẵng|Đăk Lăk|Đăk Nông|Đồng Nai|Đồng Tháp|Gia Lai|Hà Nội|Hà Tĩnh|Hải Phòng|Hậu Giang|Hòa Bình|Huế|Khánh Hoà|Kiên Giang|Lâm Đồng|Lào Cai|Long An|Nam Định|Nghệ An|Ninh Bình|Quảng Bình|Quảng Nam|Quảng Ninh|Sóc Trăng|Thái Bình|Thái Nguyên|Thanh Hóa|Tiền Giang|Trà Vinh|Tuyên Quang|Vĩnh Long|Vũng Tàu|Hồ Chí Minh)/iu,
};

// ========================
// ANSWER DETECTION & VALIDATION
// ========================

/**
 * Số đáp án mong đợi theo môn học
 */
const EXPECTED_CHOICES_BY_SUBJECT: Record<string, number> = {
    "tin-hoc": 4,
    "toan": 4,
    "vat-ly": 4,
    "hoa-hoc": 4,
    "sinh-hoc": 4,
    "ngu-van": 4,
    "tieng-anh": 4,
    "lich-su": 4,
    "dia-ly": 4,
    "gdcd": 4,
    "default": 4,
};

/**
 * Phát hiện loại câu hỏi dựa trên nội dung
 */
function detectQuestionType(content: string, choices: string[]): QuestionType {
    const lowerContent = content.toLowerCase();
    
    // Kiểm tra câu Đúng/Sai đơn giản
    if (PATTERNS.simpleTrueFalse.test(lowerContent)) {
        return "TRUE_FALSE";
    }
    
    // Kiểm tra câu điền khuyết
    if (PATTERNS.fillBlankQuestion.test(lowerContent) || PATTERNS.fillBlank.test(content)) {
        return "FILL_BLANK";
    }
    
    // Kiểm tra câu ghép đôi
    if (PATTERNS.matchingQuestion.test(lowerContent)) {
        return "MATCHING";
    }
    
    // Mặc định là trắc nghiệm nhiều lựa chọn
    return "MULTIPLE_CHOICE";
}

/**
 * Thử parse đáp án với nhiều định dạng khác nhau
 */
function tryParseChoices(lines: string[], startIndex: number): {
    choices: string[];
    nextIndex: number;
    format: "standard" | "numeric" | "extended" | "parenthesis" | "inline" | "true_false" | "unknown";
} {
    const choices: string[] = [];
    let i = startIndex;
    let format: "standard" | "numeric" | "extended" | "parenthesis" | "inline" | "true_false" | "unknown" = "unknown";
    
    // Thử định dạng inline trước (A. xxx B. xxx C. xxx D. xxx trên cùng 1 dòng)
    if (i < lines.length) {
        const inlineMatches = [...lines[i].matchAll(PATTERNS.choiceInline)];
        if (inlineMatches.length >= 2) {
            format = "inline";
            for (const match of inlineMatches) {
                choices.push(`${match[1]}. ${match[2].trim()}`);
            }
            return { choices, nextIndex: i + 1, format };
        }
    }
    
    // Thử các định dạng theo dòng
    while (i < lines.length) {
        const line = lines[i];
        
        // Standard A, B, C, D
        let match = line.match(PATTERNS.choiceOption);
        if (match) {
            format = format === "unknown" ? "standard" : format;
            choices.push(`${match[1]}. ${match[2]}`);
            i++;
            continue;
        }
        
        // Extended A-H
        match = line.match(PATTERNS.choiceOptionExtended);
        if (match && !PATTERNS.choiceOption.test(line)) {
            format = "extended";
            choices.push(`${match[1]}. ${match[2]}`);
            i++;
            continue;
        }
        
        // Numeric 1, 2, 3, 4
        match = line.match(PATTERNS.choiceOptionNumeric);
        if (match) {
            format = format === "unknown" ? "numeric" : format;
            choices.push(`${match[1]}. ${match[2]}`);
            i++;
            continue;
        }
        
        // Parenthesis (a), (b), (c), (d)
        match = line.match(PATTERNS.choiceOptionParenthesis);
        if (match) {
            format = format === "unknown" ? "parenthesis" : format;
            choices.push(`${match[1].toUpperCase()}. ${match[2]}`);
            i++;
            continue;
        }
        
        // True/False
        match = line.match(PATTERNS.choiceOptionTrueFalse);
        if (match) {
            format = "true_false";
            choices.push(`${match[1]}. ${match[2] || ""}`);
            i++;
            continue;
        }
        
        // Không match - dừng lại
        break;
    }
    
    return { choices, nextIndex: i, format };
}

/**
 * Validate và tạo warning cho câu hỏi
 */
function validateQuestion(
    question: ParsedQuestion,
    expectedChoices: number = 4,
    subject: string = "tin-hoc"
): ParseWarning[] {
    const warnings: ParseWarning[] = [];
    
    if (question.type === "MULTIPLE_CHOICE") {
        const actualCount = question.choices?.length || 0;
        question.expectedChoiceCount = expectedChoices;
        question.actualChoiceCount = actualCount;
        
        if (actualCount === 0) {
            warnings.push({
                questionId: question.id,
                questionOrder: question.order,
                type: "MISSING_CHOICES",
                message: `Câu ${question.order}: Không tìm thấy đáp án nào`,
                suggestion: "Kiểm tra định dạng file hoặc thêm đáp án thủ công"
            });
        } else if (actualCount < expectedChoices) {
            warnings.push({
                questionId: question.id,
                questionOrder: question.order,
                type: "INCOMPLETE_CHOICES",
                message: `Câu ${question.order}: Chỉ có ${actualCount}/${expectedChoices} đáp án`,
                suggestion: `Cần thêm ${expectedChoices - actualCount} đáp án hoặc kiểm tra lại cấu trúc`
            });
        } else if (actualCount > expectedChoices) {
            warnings.push({
                questionId: question.id,
                questionOrder: question.order,
                type: "EXTRA_CHOICES",
                message: `Câu ${question.order}: Có ${actualCount} đáp án (nhiều hơn ${expectedChoices} mong đợi)`,
                suggestion: "Có thể là dạng câu hỏi đặc biệt hoặc lỗi parse"
            });
        }
    }
    
    if (question.type === "TRUE_FALSE_GROUP") {
        const subCount = question.subQuestions?.length || 0;
        if (subCount !== 4) {
            warnings.push({
                questionId: question.id,
                questionOrder: question.order,
                type: "INCOMPLETE_CHOICES",
                message: `Câu ${question.order}: Có ${subCount}/4 mệnh đề con`,
                suggestion: "Kiểm tra lại cấu trúc câu hỏi đúng/sai"
            });
        }
    }
    
    return warnings;
}

// ========================
// IMAGE & FORMULA EXTRACTION
// ========================

/**
 * Tạo image ID unique từ content
 */
function generateImageId(contentType: string, data: Buffer): string {
    const hash = crypto.createHash("md5").update(data).digest("hex").slice(0, 8);
    const ext = contentType.split("/")[1] || "png";
    return `img_${hash}.${ext}`;
}

/**
 * Chuyển đổi OMML (Office Math Markup Language) sang LaTeX
 * Hỗ trợ một số pattern phổ biến
 */
function convertOmmlToLatex(omml: string): string {
    // Simplified OMML to LaTeX conversion
    let latex = omml;
    
    // Fractions: <m:f><m:num>...</m:num><m:den>...</m:den></m:f>
    latex = latex.replace(/<m:f[^>]*>.*?<m:num[^>]*>(.*?)<\/m:num>.*?<m:den[^>]*>(.*?)<\/m:den>.*?<\/m:f>/gs, 
        (_, num, den) => `\\frac{${cleanMathText(num)}}{${cleanMathText(den)}}`);
    
    // Superscript: <m:sup>
    latex = latex.replace(/<m:sSup[^>]*>.*?<m:e[^>]*>(.*?)<\/m:e>.*?<m:sup[^>]*>(.*?)<\/m:sup>.*?<\/m:sSup>/gs,
        (_, base, sup) => `${cleanMathText(base)}^{${cleanMathText(sup)}}`);
    
    // Subscript: <m:sub>
    latex = latex.replace(/<m:sSub[^>]*>.*?<m:e[^>]*>(.*?)<\/m:e>.*?<m:sub[^>]*>(.*?)<\/m:sub>.*?<\/m:sSub>/gs,
        (_, base, sub) => `${cleanMathText(base)}_{${cleanMathText(sub)}}`);
    
    // Square root: <m:rad>
    latex = latex.replace(/<m:rad[^>]*>.*?<m:e[^>]*>(.*?)<\/m:e>.*?<\/m:rad>/gs,
        (_, content) => `\\sqrt{${cleanMathText(content)}}`);
    
    // Summation, Product: <m:nary>
    latex = latex.replace(/<m:nary[^>]*>.*?<m:chr[^>]*m:val="∑".*?<m:sub[^>]*>(.*?)<\/m:sub>.*?<m:sup[^>]*>(.*?)<\/m:sup>.*?<m:e[^>]*>(.*?)<\/m:e>.*?<\/m:nary>/gs,
        (_, sub, sup, content) => `\\sum_{${cleanMathText(sub)}}^{${cleanMathText(sup)}} ${cleanMathText(content)}`);
    
    // Greek letters
    const greekMap: Record<string, string> = {
        "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta",
        "ε": "\\epsilon", "θ": "\\theta", "λ": "\\lambda", "μ": "\\mu",
        "π": "\\pi", "σ": "\\sigma", "τ": "\\tau", "φ": "\\phi",
        "ω": "\\omega", "Σ": "\\Sigma", "Π": "\\Pi", "Ω": "\\Omega"
    };
    for (const [greek, tex] of Object.entries(greekMap)) {
        latex = latex.replace(new RegExp(greek, "g"), tex);
    }
    
    // Operators
    latex = latex.replace(/×/g, "\\times");
    latex = latex.replace(/÷/g, "\\div");
    latex = latex.replace(/±/g, "\\pm");
    latex = latex.replace(/≤/g, "\\leq");
    latex = latex.replace(/≥/g, "\\geq");
    latex = latex.replace(/≠/g, "\\neq");
    latex = latex.replace(/∞/g, "\\infty");
    
    return cleanMathText(latex);
}

function cleanMathText(text: string): string {
    // Remove XML tags but keep text content
    return text
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Phát hiện và chuyển đổi các ký tự đặc biệt dạng text thành LaTeX
 */
function detectInlineFormulas(text: string): { text: string; formulas: MathFormula[] } {
    const formulas: MathFormula[] = [];
    let processedText = text;
    
    // Pattern cho các công thức phổ biến trong Tin học
    const patterns = [
        // Logarithm: log2(n), log(n), lg(n)
        { regex: /\blog_?(\d+)?\s*\(?([^)]+)\)?/gi, convert: (m: string, base: string, arg: string) => 
            base ? `$\\log_{${base}}(${arg})$` : `$\\log(${arg})$` },
        
        // Big-O notation: O(n), O(n²), O(n log n)
        { regex: /O\(([^)]+)\)/g, convert: (m: string, content: string) => `$O(${content})$` },
        
        // Exponents: 2^n, n^2, 2^10
        { regex: /(\d+|\w)\^(\d+|\w+)/g, convert: (m: string, base: string, exp: string) => `$${base}^{${exp}}$` },
        
        // Subscripts: a_i, A_n
        { regex: /([A-Za-z])_(\d+|[A-Za-z])/g, convert: (m: string, base: string, sub: string) => `$${base}_{${sub}}$` },
        
        // Fractions written as a/b
        { regex: /\b(\d+)\/(\d+)\b/g, convert: (m: string, num: string, den: string) => `$\\frac{${num}}{${den}}$` },
        
        // Special symbols already in Unicode
        { regex: /≤/g, convert: () => "$\\leq$" },
        { regex: /≥/g, convert: () => "$\\geq$" },
        { regex: /≠/g, convert: () => "$\\neq$" },
        { regex: /→/g, convert: () => "$\\rightarrow$" },
        { regex: /←/g, convert: () => "$\\leftarrow$" },
        { regex: /↔/g, convert: () => "$\\leftrightarrow$" },
        { regex: /∈/g, convert: () => "$\\in$" },
        { regex: /∉/g, convert: () => "$\\notin$" },
        { regex: /⊂/g, convert: () => "$\\subset$" },
        { regex: /∪/g, convert: () => "$\\cup$" },
        { regex: /∩/g, convert: () => "$\\cap$" },
        { regex: /∀/g, convert: () => "$\\forall$" },
        { regex: /∃/g, convert: () => "$\\exists$" },
        { regex: /¬/g, convert: () => "$\\neg$" },
        { regex: /∧/g, convert: () => "$\\land$" },
        { regex: /∨/g, convert: () => "$\\lor$" },
    ];
    
    for (const { regex, convert } of patterns) {
        processedText = processedText.replace(regex, (...args) => {
            const result = convert(...args);
            // Extract formula content without $ delimiters
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
function createImageConverter(images: Map<string, ExtractedImage>) {
    return mammoth.images.imgElement(async (image) => {
        const buffer = await image.readAsBuffer();
        const base64 = buffer.toString("base64");
        const imageId = generateImageId(image.contentType, buffer);
        
        // Store image data
        images.set(imageId, {
            id: imageId,
            contentType: image.contentType,
            data: base64,
            altText: undefined // Will be extracted from HTML if available
        });
        
        // Return img tag with data-id for later reference
        return {
            src: `data:${image.contentType};base64,${base64}`,
            "data-image-id": imageId
        };
    });
}

// ========================
// MAIN PARSE FUNCTIONS
// ========================

/**
 * Đọc file DOCX và trả về text (simple version)
 */
export async function readDocxFile(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
}

/**
 * Đọc file DOCX với hình ảnh và công thức
 * Returns: { text, html, images }
 */
export async function readDocxFileWithMedia(filePath: string): Promise<{
    text: string;
    html: string;
    images: Map<string, ExtractedImage>;
}> {
    const buffer = fs.readFileSync(filePath);
    const images = new Map<string, ExtractedImage>();
    
    // Convert to HTML with images
    const htmlResult = await mammoth.convertToHtml(
        { buffer },
        {
            convertImage: createImageConverter(images),
            // Style mapping for better structure
            styleMap: [
                "p[style-name='Heading 1'] => h1:fresh",
                "p[style-name='Heading 2'] => h2:fresh",
                "b => strong",
                "i => em",
                "u => u",
            ]
        }
    );
    
    // Also get raw text
    const textResult = await mammoth.extractRawText({ buffer });
    
    return {
        text: textResult.value,
        html: htmlResult.value,
        images
    };
}

/**
 * Extract metadata từ tên file và đường dẫn
 */
export function extractMetadata(filePath: string): ExamMetadata {
    const fileName = path.basename(filePath, path.extname(filePath));
    const dirPath = path.dirname(filePath);
    
    // Extract province from path
    const provinceMatch = dirPath.match(PATTERNS.province);
    const province = provinceMatch ? provinceMatch[1] : "Unknown";
    
    // Extract exam code
    const codeMatch = fileName.match(PATTERNS.examCode);
    const examCode = codeMatch ? codeMatch[1] : undefined;
    
    // Check if this is a school-level exam
    const isSchoolExam = dirPath.includes("ĐỀ CÁC TRƯỜNG");
    
    // Extract attempt number (Lần 1, Lần 2)
    const attemptMatch = fileName.match(/LẦN\s*(\d+)/i);
    const attempt = attemptMatch ? parseInt(attemptMatch[1]) : undefined;
    
    return {
        province,
        school: isSchoolExam ? extractSchoolName(dirPath) : undefined,
        examCode,
        attempt,
    };
}

function extractSchoolName(dirPath: string): string | undefined {
    // Try to extract school name from path
    const parts = dirPath.split(path.sep);
    const trườngIndex = parts.findIndex(p => p.includes("TRƯỜNG"));
    if (trườngIndex !== -1 && trườngIndex < parts.length - 1) {
        return parts[trườngIndex + 1];
    }
    return undefined;
}

/**
 * Thử khôi phục đáp án từ các dòng xung quanh câu hỏi
 * Sử dụng khi parse ban đầu không tìm thấy đủ đáp án
 */
function tryRecoverChoices(
    lines: string[], 
    questionStartLine: number,
    question: ParsedQuestion
): { choices: string[]; format: string } {
    const recoveredChoices: string[] = [];
    let format = "unknown";
    
    // Tìm trong 20 dòng tiếp theo sau câu hỏi
    const searchEnd = Math.min(questionStartLine + 20, lines.length);
    
    for (let i = questionStartLine + 1; i < searchEnd; i++) {
        const line = lines[i];
        
        // Dừng nếu gặp câu hỏi mới
        if (PATTERNS.multipleChoice.test(line)) {
            break;
        }
        
        // Thử các định dạng khác nhau
        const result = tryParseChoices([line], 0);
        if (result.choices.length > 0) {
            recoveredChoices.push(...result.choices);
            if (format === "unknown") {
                format = result.format;
            }
        }
        
        // Nếu đã có đủ 4 đáp án thì dừng
        if (recoveredChoices.length >= 4) {
            break;
        }
    }
    
    // Loại bỏ duplicates
    const uniqueChoices = [...new Set(recoveredChoices)];
    
    return { choices: uniqueChoices, format };
}

// ========================
// SPLIT TEXT BY QUESTIONS
// ========================

interface QuestionBlock {
    questionNum: number;
    rawText: string;
    startIndex: number;
}

/**
 * Tìm tất cả "Câu N" trong text và trả về vị trí + số câu
 */
function findAllQuestionMarkers(text: string): Array<{ num: number; index: number; match: string }> {
    const markers: Array<{ num: number; index: number; match: string }> = [];
    
    // Pattern 1: "Câu N" (tiếng Việt)
    const vietPattern = /C[âaà]u\s*(\d+)/gi;
    let match;
    while ((match = vietPattern.exec(text)) !== null) {
        markers.push({
            num: parseInt(match[1]),
            index: match.index,
            match: match[0]
        });
    }
    
    // Pattern 2: "N." hoặc "N)" ở đầu dòng (fallback)
    if (markers.length === 0) {
        const numPattern = /(?:^|\n)\s*(\d+)[.)]\s/g;
        while ((match = numPattern.exec(text)) !== null) {
            markers.push({
                num: parseInt(match[1]),
                index: match.index,
                match: match[0]
            });
        }
    }
    
    // Pattern 3: "Question N" (tiếng Anh)
    if (markers.length === 0) {
        const engPattern = /Question\s*(\d+)/gi;
        while ((match = engPattern.exec(text)) !== null) {
            markers.push({
                num: parseInt(match[1]),
                index: match.index,
                match: match[0]
            });
        }
    }
    
    // Sort theo vị trí
    markers.sort((a, b) => a.index - b.index);
    
    return markers;
}

/**
 * Split text thành các blocks theo "Câu N"
 * Mỗi block chứa: số câu, nội dung raw từ Câu N đến Câu N+1
 */
function splitTextByQuestions(text: string): QuestionBlock[] {
    const markers = findAllQuestionMarkers(text);
    
    if (markers.length === 0) {
        console.warn("⚠️  Không tìm thấy pattern 'Câu N' nào trong text");
        return [];
    }
    
    console.log(`📌 Tìm thấy ${markers.length} câu hỏi: Câu ${markers.map(m => m.num).join(", ")}`);
    
    const blocks: QuestionBlock[] = [];
    
    for (let i = 0; i < markers.length; i++) {
        const current = markers[i];
        const next = markers[i + 1];
        
        // Extract text từ câu hiện tại đến câu tiếp theo (hoặc cuối file)
        const endIndex = next ? next.index : text.length;
        const rawText = text.substring(current.index, endIndex).trim();
        
        blocks.push({
            questionNum: current.num,
            rawText,
            startIndex: current.index
        });
    }
    
    return blocks;
}

/**
 * Parse 1 block câu hỏi đơn lẻ (đã được split sẵn)
 */
function parseQuestionBlock(
    block: QuestionBlock,
    expectedChoices: number = 4
): ParsedQuestion {
    const lines = block.rawText.split("\n").map(l => l.trim()).filter(l => l);
    
    // Dòng đầu tiên là câu hỏi
    let content = "";
    const choices: string[] = [];
    let correctAnswer: string | undefined;
    
    let isReadingContent = true;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Bỏ qua dòng "Câu N" ở đầu
        if (i === 0) {
            const match = line.match(/C[âaà]u\s*\d+[\s.:]*(.+)?/iu);
            if (match && match[1]) {
                content = match[1].trim();
            }
            continue;
        }
        
        // Thử parse đáp án A, B, C, D
        let choiceMatch = line.match(PATTERNS.choiceOption);
        if (!choiceMatch) {
            choiceMatch = line.match(PATTERNS.choiceOptionExtended);
        }
        
        if (choiceMatch) {
            isReadingContent = false;
            const letter = choiceMatch[1].toUpperCase();
            const choiceContent = choiceMatch[2];
            choices.push(`${letter}. ${choiceContent}`);
            continue;
        }
        
        // Thử parse đáp án dạng số 1, 2, 3, 4
        const numMatch = line.match(PATTERNS.choiceOptionNumeric);
        if (numMatch && parseInt(numMatch[1]) <= 8) {
            isReadingContent = false;
            const num = parseInt(numMatch[1]);
            const letter = String.fromCharCode(64 + num); // 1->A, 2->B
            choices.push(`${letter}. ${numMatch[2]}`);
            continue;
        }
        
        // Thử parse đáp án trên cùng 1 dòng
        const inlineMatches = [...line.matchAll(PATTERNS.choiceInline)];
        if (inlineMatches.length >= 2) {
            isReadingContent = false;
            for (const m of inlineMatches) {
                choices.push(`${m[1].toUpperCase()}. ${m[2].trim()}`);
            }
            continue;
        }
        
        // Kiểm tra đáp án inline
        const answerMatch = line.match(PATTERNS.inlineAnswer);
        if (answerMatch) {
            correctAnswer = answerMatch[1].toUpperCase();
            continue;
        }
        
        // Nếu vẫn đang đọc nội dung câu hỏi
        if (isReadingContent) {
            content += " " + line;
        }
    }
    
    // ========================================
    // VALIDATION - BÁO LỖI NGAY KHI KHÔNG ĐỦ HOẶC QUÁ 4 ĐÁP ÁN
    // ========================================
    const warnings: ParseWarning[] = [];
    const hasError = choices.length !== expectedChoices;
    
    if (choices.length > expectedChoices) {
        // 🚨 LỖI NGHIÊM TRỌNG: Quá nhiều đáp án - có thể 2 câu bị gộp!
        console.error("\n" + "=".repeat(80));
        console.error("🚨 LỖI: CÂU HỎI CÓ QUÁ NHIỀU ĐÁP ÁN!");
        console.error("=".repeat(80));
        console.error(`📍 Câu ${block.questionNum}: Phát hiện ${choices.length} đáp án (mong đợi: ${expectedChoices})`);
        console.error("");
        console.error("📋 CÁC ĐÁP ÁN ĐÃ TÌM THẤY:");
        choices.forEach((c, i) => {
            console.error(`   ${i + 1}. ${c}`);
        });
        console.error("");
        console.error("📄 VĂN BẢN THÔ CỦA CÂU HỎI NÀY:");
        console.error("-".repeat(80));
        console.error(block.rawText);
        console.error("-".repeat(80));
        console.error("");
        console.error("💡 GỢI Ý SỬA LỖI:");
        console.error("   - Có thể 2 câu hỏi bị gộp thành 1");
        console.error("   - Kiểm tra file gốc và thêm dấu xuống dòng giữa các câu");
        console.error("   - Đảm bảo mỗi 'Câu N' bắt đầu ở dòng riêng");
        console.error("=".repeat(80) + "\n");
        
        warnings.push({
            questionId: `q${String(block.questionNum).padStart(2, "0")}`,
            questionOrder: block.questionNum,
            type: "EXTRA_CHOICES",
            message: `Câu ${block.questionNum}: Có ${choices.length} đáp án (QUÁ NHIỀU - có thể 2 câu bị gộp!)`,
            suggestion: "Kiểm tra file gốc, có thể 2 câu hỏi bị gộp thành 1"
        });
    } else if (choices.length === 0) {
        // 🚨 LỖI: Không có đáp án nào
        console.error("\n" + "=".repeat(80));
        console.error("🚨 LỖI: CÂU HỎI KHÔNG CÓ ĐÁP ÁN!");
        console.error("=".repeat(80));
        console.error(`📍 Câu ${block.questionNum}: Không tìm thấy đáp án nào (mong đợi: ${expectedChoices})`);
        console.error("");
        console.error("📄 VĂN BẢN THÔ CỦA CÂU HỎI NÀY:");
        console.error("-".repeat(80));
        console.error(block.rawText);
        console.error("-".repeat(80));
        console.error("");
        console.error("💡 GỢI Ý SỬA LỖI:");
        console.error("   - Kiểm tra định dạng đáp án (A. B. C. D. hoặc A) B) C) D))");
        console.error("   - Đảm bảo mỗi đáp án bắt đầu bằng chữ cái + dấu chấm/ngoặc");
        console.error("   - Có thể đáp án nằm trên cùng 1 dòng với câu hỏi");
        console.error("=".repeat(80) + "\n");
        
        warnings.push({
            questionId: `q${String(block.questionNum).padStart(2, "0")}`,
            questionOrder: block.questionNum,
            type: "MISSING_CHOICES",
            message: `Câu ${block.questionNum}: Không tìm thấy đáp án nào`,
            suggestion: "Kiểm tra định dạng file hoặc thêm đáp án thủ công"
        });
    } else if (choices.length < expectedChoices) {
        // 🚨 LỖI: Thiếu đáp án
        console.error("\n" + "=".repeat(80));
        console.error("🚨 LỖI: CÂU HỎI THIẾU ĐÁP ÁN!");
        console.error("=".repeat(80));
        console.error(`📍 Câu ${block.questionNum}: Chỉ có ${choices.length}/${expectedChoices} đáp án`);
        console.error("");
        console.error("📋 CÁC ĐÁP ÁN ĐÃ TÌM THẤY:");
        choices.forEach((c, i) => {
            console.error(`   ${i + 1}. ${c}`);
        });
        console.error("");
        console.error("📄 VĂN BẢN THÔ CỦA CÂU HỎI NÀY:");
        console.error("-".repeat(80));
        console.error(block.rawText);
        console.error("-".repeat(80));
        console.error("");
        console.error("💡 GỢI Ý SỬA LỖI:");
        console.error(`   - Cần thêm ${expectedChoices - choices.length} đáp án`);
        console.error("   - Kiểm tra định dạng đáp án còn thiếu");
        console.error("   - Có thể đáp án bị lẫn vào nội dung câu hỏi");
        console.error("=".repeat(80) + "\n");
        
        warnings.push({
            questionId: `q${String(block.questionNum).padStart(2, "0")}`,
            questionOrder: block.questionNum,
            type: "INCOMPLETE_CHOICES",
            message: `Câu ${block.questionNum}: Chỉ có ${choices.length}/${expectedChoices} đáp án`,
            suggestion: `Cần thêm ${expectedChoices - choices.length} đáp án`
        });
    }
    
    // ========================================
    // WARNING: KHÔNG CÓ ĐÁP ÁN ĐÚNG
    // ========================================
    if (!correctAnswer && choices.length > 0) {
        console.warn(`⚠️  Câu ${block.questionNum}: Không tìm thấy đáp án đúng`);
        warnings.push({
            questionId: `q${String(block.questionNum).padStart(2, "0")}`,
            questionOrder: block.questionNum,
            type: "NO_ANSWER",
            message: `Câu ${block.questionNum}: Không có đáp án đúng`,
            suggestion: "Cần bổ sung đáp án đúng từ file đáp án hoặc thủ công"
        });
    }
    
    return {
        id: `q${String(block.questionNum).padStart(2, "0")}`,
        order: block.questionNum,
        content: content.trim(),
        type: "MULTIPLE_CHOICE",
        track: "COMMON",
        choices,
        correctAnswer,
        points: 0.25,
        expectedChoiceCount: expectedChoices,
        actualChoiceCount: choices.length,
        warnings,
        rawContent: hasError ? block.rawText : block.rawText.substring(0, 200) // Lưu full nếu có lỗi
    };
}

/**
 * Parse exam bằng cách split theo "Câu N" trước
 * Đây là phương pháp chính xác hơn, không phụ thuộc vào dòng
 */
export function parseExamBySplitting(
    text: string,
    metadata: ExamMetadata,
    options: {
        subject?: string;
        expectedChoices?: number;
    } = {}
): ParsedExam {
    const {
        subject = "tin-hoc",
        expectedChoices = EXPECTED_CHOICES_BY_SUBJECT[subject] || 4
    } = options;
    
    console.log(`\n🔍 Parsing bằng phương pháp split theo "Câu N"...`);
    
    // Split text thành các blocks
    const blocks = splitTextByQuestions(text);
    
    if (blocks.length === 0) {
        console.warn("⚠️  Không split được câu hỏi, fallback sang phương pháp line-by-line");
        return parseExamText(text, metadata, options);
    }
    
    const allWarnings: ParseWarning[] = [];
    const criticalErrors: Array<{ questionNum: number; choiceCount: number; rawText: string }> = [];
    const part1Questions: ParsedQuestion[] = [];
    const part2CommonQuestions: ParsedQuestion[] = [];
    const part2CSQuestions: ParsedQuestion[] = [];
    const part2AIQuestions: ParsedQuestion[] = [];
    
    // Tìm điểm chia Part 1 / Part 2
    const part2StartMatch = text.match(/PH[ẦAÀ]N\s*(II|2)/iu);
    const part2StartIndex = part2StartMatch ? text.indexOf(part2StartMatch[0]) : -1;
    
    // Tìm track CS / AI
    const csMatch = text.match(PATTERNS.csTrack);
    const aiMatch = text.match(PATTERNS.aiTrack);
    const csStartIndex = csMatch ? text.indexOf(csMatch[0]) : -1;
    const aiStartIndex = aiMatch ? text.indexOf(aiMatch[0]) : -1;
    
    for (const block of blocks) {
        const question = parseQuestionBlock(block, expectedChoices);
        
        // Thu thập warnings
        if (question.warnings) {
            allWarnings.push(...question.warnings);
            
            // Kiểm tra lỗi nghiêm trọng (quá nhiều hoặc thiếu đáp án)
            const choiceError = question.warnings.find(w => 
                w.type === "EXTRA_CHOICES" || 
                w.type === "INCOMPLETE_CHOICES" || 
                w.type === "MISSING_CHOICES"
            );
            if (choiceError) {
                criticalErrors.push({
                    questionNum: question.order,
                    choiceCount: question.actualChoiceCount || 0,
                    rawText: block.rawText
                });
            }
        }
        
        // Phân loại vào part/track
        if (part2StartIndex === -1 || block.startIndex < part2StartIndex) {
            // Part 1
            part1Questions.push(question);
        } else {
            // Part 2 - xác định track
            question.type = "TRUE_FALSE_GROUP";
            question.points = 1.0;
            
            if (csStartIndex !== -1 && block.startIndex >= csStartIndex && 
                (aiStartIndex === -1 || block.startIndex < aiStartIndex)) {
                question.track = "COMPUTER_SCIENCE";
                part2CSQuestions.push(question);
            } else if (aiStartIndex !== -1 && block.startIndex >= aiStartIndex) {
                question.track = "APPLIED_INFORMATICS";
                part2AIQuestions.push(question);
            } else {
                question.track = "COMMON";
                part2CommonQuestions.push(question);
            }
        }
    }
    
    // Log summary
    console.log(`\n📊 Kết quả split:`);
    console.log(`   Part 1: ${part1Questions.length} câu`);
    console.log(`   Part 2 Common: ${part2CommonQuestions.length} câu`);
    console.log(`   Part 2 CS: ${part2CSQuestions.length} câu`);
    console.log(`   Part 2 AI: ${part2AIQuestions.length} câu`);
    
    if (allWarnings.length > 0) {
        console.log(`   ⚠️  ${allWarnings.length} warnings`);
    }
    
    // ========================================
    // HIỂN THỊ TẤT CẢ LỖI NGHIÊM TRỌNG Ở CUỐI
    // ========================================
    
    // Tách lỗi theo loại
    const extraChoicesErrors = criticalErrors.filter(e => e.choiceCount > expectedChoices);
    const missingChoicesErrors = criticalErrors.filter(e => e.choiceCount < expectedChoices);
    
    if (criticalErrors.length > 0) {
        console.error("\n" + "█".repeat(80));
        console.error("█  🚨 PHÁT HIỆN " + criticalErrors.length + " CÂU HỎI CÓ LỖI VỀ SỐ LƯỢNG ĐÁP ÁN");
        console.error("█".repeat(80));
        
        if (extraChoicesErrors.length > 0) {
            console.error(`\n📛 QUÁ NHIỀU ĐÁP ÁN (${extraChoicesErrors.length} câu):`);
            for (const err of extraChoicesErrors) {
                console.error(`\n${"─".repeat(80)}`);
                console.error(`📍 CÂU ${err.questionNum}: ${err.choiceCount} đáp án (thừa ${err.choiceCount - expectedChoices})`);
                console.error(`${"─".repeat(80)}`);
                console.error("📄 VĂN BẢN THÔ:");
                console.error(err.rawText);
            }
        }
        
        if (missingChoicesErrors.length > 0) {
            console.error(`\n📛 THIẾU ĐÁP ÁN (${missingChoicesErrors.length} câu):`);
            for (const err of missingChoicesErrors) {
                console.error(`\n${"─".repeat(80)}`);
                console.error(`📍 CÂU ${err.questionNum}: ${err.choiceCount} đáp án (thiếu ${expectedChoices - err.choiceCount})`);
                console.error(`${"─".repeat(80)}`);
                console.error("📄 VĂN BẢN THÔ:");
                console.error(err.rawText);
            }
        }
        
        console.error(`\n${"─".repeat(80)}`);
        console.error("💡 HƯỚNG DẪN SỬA:");
        console.error("   1. Mở file DOCX gốc");
        console.error("   2. Tìm các câu hỏi bị lỗi ở trên");
        if (extraChoicesErrors.length > 0) {
            console.error("   📛 Quá nhiều đáp án: Có thể 2 câu hỏi bị gộp thành 1");
        }
        if (missingChoicesErrors.length > 0) {
            console.error("   📛 Thiếu đáp án: Kiểm tra định dạng A. B. C. D.");
        }
        console.error("   3. Sửa file và chạy lại script");
        console.error("█".repeat(80) + "\n");
    }
    
    const slug = generateSlug(metadata);

    
    return {
        title: generateTitle(metadata),
        slug,
        source: metadata.school || `Sở GD&ĐT ${metadata.province}`,
        province: metadata.province,
        school: metadata.school,
        year: 2025,
        type: "STANDARD",
        duration: 50,
        rawText: text,
        part1Questions,
        part2CommonQuestions,
        part2CSQuestions,
        part2AIQuestions,
        images: new Map(),
        warnings: allWarnings,
        subject,
        expectedChoicesPerQuestion: expectedChoices,
    };
}

/**
 * Parse raw text thành các câu hỏi (phương pháp line-by-line cũ)
 */
export function parseExamText(
    text: string, 
    metadata: ExamMetadata,
    options: {
        subject?: string;
        expectedChoices?: number;
        strictMode?: boolean; // Nếu true, sẽ dừng khi gặp lỗi nghiêm trọng
    } = {}
): ParsedExam {
    const { 
        subject = "tin-hoc", 
        expectedChoices = EXPECTED_CHOICES_BY_SUBJECT[subject] || 4,
        strictMode = false
    } = options;
    
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    const part1Questions: ParsedQuestion[] = [];
    const part2CommonQuestions: ParsedQuestion[] = [];
    const part2CSQuestions: ParsedQuestion[] = [];
    const part2AIQuestions: ParsedQuestion[] = [];
    const allWarnings: ParseWarning[] = [];
    
    let currentPart: 1 | 2 = 1;
    let currentTrack: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS" = "COMMON";
    let currentQuestion: ParsedQuestion | null = null;
    let currentQuestionStartLine = 0;
    
    /**
     * Validate và save question với warnings
     */
    const validateAndSave = (question: ParsedQuestion) => {
        // Validate question và thu thập warnings
        const warnings = validateQuestion(question, expectedChoices, subject);
        question.warnings = warnings;
        allWarnings.push(...warnings);
        
        // Log warnings nếu có
        if (warnings.length > 0) {
            console.warn(`⚠️  Câu ${question.order}:`, warnings.map(w => w.message).join("; "));
            
            // Thử recovery nếu thiếu đáp án
            if (question.type === "MULTIPLE_CHOICE" && (!question.choices || question.choices.length < expectedChoices)) {
                const recovered = tryRecoverChoices(lines, currentQuestionStartLine, question);
                if (recovered.choices.length > (question.choices?.length || 0)) {
                    console.log(`   🔧 Recovered ${recovered.choices.length} choices using format: ${recovered.format}`);
                    question.choices = recovered.choices;
                    // Re-validate after recovery
                    question.warnings = validateQuestion(question, expectedChoices, subject);
                }
            }
        }
        
        saveQuestion(question, currentPart, currentTrack,
            part1Questions, part2CommonQuestions, part2CSQuestions, part2AIQuestions);
    };
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for part headers
        const partMatch = line.match(PATTERNS.partHeader);
        if (partMatch) {
            const partNum = partMatch[1];
            if (partNum === "II" || partNum === "2") {
                // Save current question if exists
                if (currentQuestion) {
                    validateAndSave(currentQuestion);
                }
                currentPart = 2;
                currentQuestion = null;
            }
            continue;
        }
        
        // Check for track changes in Part 2
        if (currentPart === 2) {
            if (PATTERNS.csTrack.test(line)) {
                if (currentQuestion) {
                    validateAndSave(currentQuestion);
                }
                currentTrack = "COMPUTER_SCIENCE";
                currentQuestion = null;
                continue;
            }
            if (PATTERNS.aiTrack.test(line)) {
                if (currentQuestion) {
                    validateAndSave(currentQuestion);
                }
                currentTrack = "APPLIED_INFORMATICS";
                currentQuestion = null;
                continue;
            }
        }
        
        // Check for inline answer (e.g., "Đáp án đúng: A")
        const inlineAnswerMatch = line.match(PATTERNS.inlineAnswer);
        if (inlineAnswerMatch && currentQuestion) {
            currentQuestion.correctAnswer = inlineAnswerMatch[1].toUpperCase();
            continue;
        }
        
        // Check for new question
        const questionMatch = line.match(PATTERNS.multipleChoice);
        if (questionMatch) {
            // Save previous question
            if (currentQuestion) {
                validateAndSave(currentQuestion);
            }
            
            const questionNum = parseInt(questionMatch[1]);
            const questionContent = questionMatch[2] || "";
            
            currentQuestionStartLine = i;
            
            // Phát hiện loại câu hỏi dựa trên nội dung
            let detectedType: QuestionType = currentPart === 1 ? "MULTIPLE_CHOICE" : "TRUE_FALSE_GROUP";
            
            // Kiểm tra xem có phải câu Đúng/Sai đơn giản không (trong Part 1)
            if (currentPart === 1 && PATTERNS.simpleTrueFalse.test(questionContent)) {
                detectedType = "TRUE_FALSE";
            }
            
            // Kiểm tra xem có phải câu điền khuyết không
            if (PATTERNS.fillBlankQuestion.test(questionContent)) {
                detectedType = "FILL_BLANK";
            }
            
            currentQuestion = {
                id: `q${String(questionNum).padStart(2, "0")}`,
                order: questionNum,
                content: questionContent.trim(),
                type: detectedType,
                track: currentTrack,
                choices: detectedType === "MULTIPLE_CHOICE" || detectedType === "TRUE_FALSE" ? [] : undefined,
                subQuestions: detectedType === "TRUE_FALSE_GROUP" ? [] : undefined,
                points: currentPart === 1 ? 0.25 : 1.0,
                rawContent: line,
                expectedChoiceCount: detectedType === "MULTIPLE_CHOICE" ? expectedChoices : undefined,
            };
            continue;
        }
        
        // Parse choices for Part 1 (Multiple Choice) - Thử nhiều định dạng
        if (currentQuestion && currentPart === 1 && currentQuestion.type === "MULTIPLE_CHOICE") {
            // Thử định dạng chuẩn A, B, C, D
            let choiceMatch = line.match(PATTERNS.choiceOption);
            if (choiceMatch) {
                const choiceLetter = choiceMatch[1].toUpperCase();
                const choiceContent = choiceMatch[2];
                currentQuestion.choices = currentQuestion.choices || [];
                currentQuestion.choices.push(`${choiceLetter}. ${choiceContent}`);
                continue;
            }
            
            // Thử định dạng mở rộng (A-H)
            choiceMatch = line.match(PATTERNS.choiceOptionExtended);
            if (choiceMatch) {
                const choiceLetter = choiceMatch[1].toUpperCase();
                const choiceContent = choiceMatch[2];
                currentQuestion.choices = currentQuestion.choices || [];
                currentQuestion.choices.push(`${choiceLetter}. ${choiceContent}`);
                continue;
            }
            
            // Thử định dạng số (1, 2, 3, 4)
            choiceMatch = line.match(PATTERNS.choiceOptionNumeric);
            if (choiceMatch) {
                const choiceNum = choiceMatch[1];
                const choiceContent = choiceMatch[2];
                currentQuestion.choices = currentQuestion.choices || [];
                // Chuyển số thành chữ cái: 1->A, 2->B, etc.
                const choiceLetter = String.fromCharCode(64 + parseInt(choiceNum));
                currentQuestion.choices.push(`${choiceLetter}. ${choiceContent}`);
                continue;
            }
            
            // Thử định dạng ngoặc (a), (b), (c), (d)
            choiceMatch = line.match(PATTERNS.choiceOptionParenthesis);
            if (choiceMatch) {
                const choiceLetter = choiceMatch[1].toUpperCase();
                const choiceContent = choiceMatch[2];
                currentQuestion.choices = currentQuestion.choices || [];
                currentQuestion.choices.push(`${choiceLetter}. ${choiceContent}`);
                continue;
            }
            
            // Thử đáp án trên cùng 1 dòng
            const inlineMatches = [...line.matchAll(PATTERNS.choiceInline)];
            if (inlineMatches.length >= 2) {
                currentQuestion.choices = currentQuestion.choices || [];
                for (const match of inlineMatches) {
                    currentQuestion.choices.push(`${match[1]}. ${match[2].trim()}`);
                }
                continue;
            }
        }
        
        // Parse True/False cho câu Đúng/Sai đơn giản
        if (currentQuestion && currentQuestion.type === "TRUE_FALSE") {
            const tfMatch = line.match(PATTERNS.choiceOptionTrueFalse);
            if (tfMatch) {
                currentQuestion.choices = currentQuestion.choices || [];
                const label = tfMatch[1];
                currentQuestion.choices.push(`${label}. ${tfMatch[2] || ""}`);
                continue;
            }
        }
        
        // Parse sub-questions for Part 2 (True/False Group)
        if (currentQuestion && currentPart === 2) {
            const subMatch = line.match(PATTERNS.subQuestion);
            if (subMatch) {
                const label = subMatch[1];
                const subContent = subMatch[2];
                currentQuestion.subQuestions = currentQuestion.subQuestions || [];
                currentQuestion.subQuestions.push({
                    label: label + ")",
                    content: subContent,
                    isCorrect: null, // Will be filled from answer key
                });
                continue;
            }
            
            // Thử Roman numerals
            const romanMatch = line.match(PATTERNS.subQuestionRoman);
            if (romanMatch) {
                const label = romanMatch[1];
                const subContent = romanMatch[2];
                currentQuestion.subQuestions = currentQuestion.subQuestions || [];
                currentQuestion.subQuestions.push({
                    label: label + ")",
                    content: subContent,
                    isCorrect: null,
                });
                continue;
            }
        }
        
        // Append to current question content if not a choice/sub-question
        if (currentQuestion && !line.match(PATTERNS.choiceOption) && !line.match(PATTERNS.subQuestion)) {
            // Could be continuation of question content
            if (!line.match(/^(A|B|C|D|a|b|c|d)[.)]/)) {
                currentQuestion.content += " " + line;
            }
        }
    }
    
    // Save last question
    if (currentQuestion) {
        validateAndSave(currentQuestion);
    }
    
    // Tổng kết warnings
    if (allWarnings.length > 0) {
        console.log(`\n📊 Tổng kết parse:`);
        console.log(`   ⚠️  ${allWarnings.length} warnings`);
        const byType = allWarnings.reduce((acc, w) => {
            acc[w.type] = (acc[w.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        for (const [type, count] of Object.entries(byType)) {
            console.log(`      - ${type}: ${count}`);
        }
    }
    
    // Generate slug
    const slug = generateSlug(metadata);
    
    return {
        title: generateTitle(metadata),
        slug,
        source: metadata.school || `Sở GD&ĐT ${metadata.province}`,
        province: metadata.province,
        school: metadata.school,
        year: 2025,
        type: "STANDARD",
        duration: 50,
        rawText: text,
        part1Questions,
        part2CommonQuestions,
        part2CSQuestions,
        part2AIQuestions,
        images: new Map(), // No images in simple text parse
        warnings: allWarnings,
        subject,
        expectedChoicesPerQuestion: expectedChoices,
    };
}

/**
 * Parse exam với hỗ trợ hình ảnh và công thức
 */
export function parseExamTextWithMedia(
    text: string, 
    html: string,
    images: Map<string, ExtractedImage>,
    metadata: ExamMetadata
): ParsedExam {
    // First do basic text parsing
    const exam = parseExamText(text, metadata);
    exam.rawHtml = html;
    exam.images = images;
    
    // Extract image references from HTML for each question
    const htmlParagraphs = html.split(/<\/?p[^>]*>/);
    let currentQuestionHtml = "";
    let currentQuestionNum = 0;
    
    for (const para of htmlParagraphs) {
        const trimmed = para.trim();
        if (!trimmed) continue;
        
        // Check if this is a question start
        const qMatch = trimmed.match(/C[âaà]u\s*(\d+)/iu);
        if (qMatch) {
            // Save previous question's HTML
            if (currentQuestionNum > 0) {
                assignHtmlToQuestion(exam, currentQuestionNum, currentQuestionHtml);
            }
            currentQuestionNum = parseInt(qMatch[1]);
            currentQuestionHtml = trimmed;
        } else if (currentQuestionNum > 0) {
            currentQuestionHtml += "\n" + trimmed;
        }
    }
    // Assign last question
    if (currentQuestionNum > 0) {
        assignHtmlToQuestion(exam, currentQuestionNum, currentQuestionHtml);
    }
    
    // Process formulas in all questions
    processFormulasInExam(exam);
    
    return exam;
}

/**
 * Gán HTML content vào câu hỏi tương ứng
 */
function assignHtmlToQuestion(exam: ParsedExam, questionNum: number, html: string): void {
    // Extract image IDs from HTML
    const imageIds = extractImageIdsFromHtml(html);
    
    // Find the question
    let question = exam.part1Questions.find(q => q.order === questionNum);
    if (!question) {
        question = exam.part2CommonQuestions.find(q => q.order === questionNum);
    }
    if (!question) {
        question = exam.part2CSQuestions.find(q => q.order === questionNum);
    }
    if (!question) {
        question = exam.part2AIQuestions.find(q => q.order === questionNum);
    }
    
    if (question) {
        question.contentHtml = html;
        question.images = imageIds;
        
        // Also process choices HTML for multiple choice
        if (question.type === "MULTIPLE_CHOICE" && question.choices) {
            question.choicesHtml = [];
            for (let i = 0; i < question.choices.length; i++) {
                const choiceLetter = String.fromCharCode(65 + i); // A, B, C, D
                const choicePattern = new RegExp(`${choiceLetter}[.)]\\s*(.+?)(?=[A-D][.)]|$)`, "is");
                const match = html.match(choicePattern);
                if (match) {
                    question.choicesHtml.push(`${choiceLetter}. ${match[1].trim()}`);
                }
            }
        }
    }
}

/**
 * Trích xuất image IDs từ HTML
 */
function extractImageIdsFromHtml(html: string): string[] {
    const ids: string[] = [];
    const imgPattern = /data-image-id="([^"]+)"/g;
    let match;
    while ((match = imgPattern.exec(html)) !== null) {
        ids.push(match[1]);
    }
    return ids;
}

/**
 * Xử lý công thức trong toàn bộ đề thi
 */
function processFormulasInExam(exam: ParsedExam): void {
    const allQuestions = [
        ...exam.part1Questions,
        ...exam.part2CommonQuestions,
        ...exam.part2CSQuestions,
        ...exam.part2AIQuestions,
    ];
    
    for (const q of allQuestions) {
        // Process question content
        const { text: processedContent, formulas } = detectInlineFormulas(q.content);
        if (formulas.length > 0) {
            q.content = processedContent;
            q.formulas = formulas;
        }
        
        // Process choices
        if (q.choices) {
            q.choices = q.choices.map(choice => {
                const { text } = detectInlineFormulas(choice);
                return text;
            });
        }
        
        // Process sub-questions
        if (q.subQuestions) {
            for (const sub of q.subQuestions) {
                const { text: processedSub, formulas: subFormulas } = detectInlineFormulas(sub.content);
                if (subFormulas.length > 0) {
                    sub.content = processedSub;
                    sub.formulas = subFormulas;
                }
            }
        }
    }
}

function saveQuestion(
    question: ParsedQuestion,
    part: 1 | 2,
    track: "COMMON" | "COMPUTER_SCIENCE" | "APPLIED_INFORMATICS",
    part1: ParsedQuestion[],
    part2Common: ParsedQuestion[],
    part2CS: ParsedQuestion[],
    part2AI: ParsedQuestion[]
) {
    if (part === 1) {
        part1.push(question);
    } else {
        // Part 2 - check question order to determine track
        const order = question.order;
        if (order <= 2) {
            question.track = "COMMON";
            part2Common.push(question);
        } else if (order <= 4) {
            if (track === "COMPUTER_SCIENCE") {
                question.track = "COMPUTER_SCIENCE";
                part2CS.push(question);
            } else {
                question.track = "APPLIED_INFORMATICS";
                part2AI.push(question);
            }
        } else {
            question.track = "APPLIED_INFORMATICS";
            part2AI.push(question);
        }
    }
}

function generateSlug(metadata: ExamMetadata): string {
    const parts = ["thpt-tin-hoc-2025"];
    
    if (metadata.province) {
        parts.push(slugify(metadata.province));
    }
    
    if (metadata.school) {
        parts.push(slugify(metadata.school));
    }
    
    if (metadata.examCode) {
        parts.push(`mde-${metadata.examCode}`);
    }
    
    if (metadata.attempt) {
        parts.push(`lan-${metadata.attempt}`);
    }
    
    return parts.join("-");
}

function generateTitle(metadata: ExamMetadata): string {
    let title = "Đề thi THPT Tin học 2025";
    
    if (metadata.province) {
        title += ` - ${metadata.province}`;
    }
    
    if (metadata.school) {
        title += ` - ${metadata.school}`;
    }
    
    if (metadata.examCode) {
        title += ` (Mã đề ${metadata.examCode})`;
    }
    
    if (metadata.attempt) {
        title += ` - Lần ${metadata.attempt}`;
    }
    
    return title;
}

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// ========================
// ANSWER KEY PARSING
// ========================

interface AnswerKey {
    part1: Record<number, string>; // Question num -> A/B/C/D
    part2: Record<number, Record<string, boolean>>; // Question num -> {a: true, b: false, ...}
}

/**
 * Parse file đáp án
 */
export function parseAnswerKey(text: string): AnswerKey {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    const answerKey: AnswerKey = {
        part1: {},
        part2: {},
    };
    
    // Pattern: "1. A", "1-A", "1: A", "Câu 1: A"
    const answerPattern = /^(?:Câu\s*)?(\d+)[.:\-\s]+([A-D])/i;
    
    // Pattern for true/false: "Câu 1: a-Đ, b-S, c-Đ, d-S"
    const tfPattern = /^(?:Câu\s*)?(\d+)[.:\-\s]+([a-d][.:\-\s]*[ĐS],?\s*)+/i;
    const tfItemPattern = /([a-d])[.:\-\s]*([ĐS])/gi;
    
    for (const line of lines) {
        // Try multiple choice answer
        const mcMatch = line.match(answerPattern);
        if (mcMatch) {
            const qNum = parseInt(mcMatch[1]);
            const answer = mcMatch[2].toUpperCase();
            if (qNum <= 24) {
                answerKey.part1[qNum] = answer;
            }
            continue;
        }
        
        // Try true/false answer
        if (tfPattern.test(line)) {
            const qNumMatch = line.match(/^(?:Câu\s*)?(\d+)/);
            if (qNumMatch) {
                const qNum = parseInt(qNumMatch[1]);
                answerKey.part2[qNum] = {};
                
                let match;
                while ((match = tfItemPattern.exec(line)) !== null) {
                    const label = match[1].toLowerCase();
                    const isCorrect = match[2] === "Đ";
                    answerKey.part2[qNum][label] = isCorrect;
                }
            }
        }
    }
    
    return answerKey;
}

/**
 * Apply answer key to parsed exam
 */
export function applyAnswerKey(exam: ParsedExam, answerKey: AnswerKey): void {
    // Apply Part 1 answers
    for (const q of exam.part1Questions) {
        if (answerKey.part1[q.order]) {
            q.correctAnswer = answerKey.part1[q.order];
        }
    }
    
    // Apply Part 2 answers
    const allPart2 = [
        ...exam.part2CommonQuestions,
        ...exam.part2CSQuestions,
        ...exam.part2AIQuestions,
    ];
    
    for (const q of allPart2) {
        if (answerKey.part2[q.order] && q.subQuestions) {
            for (const sub of q.subQuestions) {
                const label = sub.label.replace(")", "").toLowerCase();
                if (answerKey.part2[q.order][label] !== undefined) {
                    sub.isCorrect = answerKey.part2[q.order][label];
                }
            }
        }
    }
}

// ========================
// OUTPUT CONVERSION
// ========================

/**
 * Helper để chuyển đổi question sang JSON format
 */
function questionToJson(q: ParsedQuestion) {
    return {
        id: q.id,
        order: q.order,
        content: q.content,
        contentHtml: q.contentHtml,
        type: q.type,
        track: q.track,
        choices: q.choices,
        choicesHtml: q.choicesHtml,
        choiceCount: q.choices?.length || 0,
        expectedChoiceCount: q.expectedChoiceCount,
        correctAnswer: q.correctAnswer,
        points: q.points,
        images: q.images,
        formulas: q.formulas,
        warnings: q.warnings,
        hasIssues: (q.warnings?.length || 0) > 0,
        subQuestions: q.subQuestions?.map(s => ({
            id: `${q.id}_${s.label.replace(")", "")}`,
            label: s.label,
            content: s.content,
            contentHtml: s.contentHtml,
            isCorrect: s.isCorrect,
            images: s.images,
            formulas: s.formulas,
        })),
    };
}

/**
 * Convert parsed exam to JSON format for import
 */
export function toImportJson(exam: ParsedExam): object {
    // Convert images Map to array for JSON serialization
    const imagesArray = Array.from(exam.images.values()).map(img => ({
        id: img.id,
        contentType: img.contentType,
        data: img.data,
        altText: img.altText,
    }));
    
    return {
        exam: {
            id: `exam_${exam.slug.replace(/-/g, "_")}`,
            title: exam.title,
            slug: exam.slug,
            description: `Đề thi thử THPT Quốc gia môn Tin học năm ${exam.year}`,
            subject: "Tin học",
            year: exam.year,
            source: exam.source,
            type: exam.type,
            duration: exam.duration,
            published: true,
            parts: [
                {
                    id: 1,
                    name: "Phần I: Trắc nghiệm nhiều lựa chọn",
                    description: "Thí sinh trả lời từ câu 1 đến câu 24",
                    type: "MULTIPLE_CHOICE",
                    track: "COMMON",
                    required: true,
                    questionCount: 24,
                    pointsPerQuestion: 0.25,
                    totalPoints: 6,
                },
                {
                    id: 2,
                    name: "Phần II: Trắc nghiệm đúng sai",
                    description: "Phần đúng/sai với 2 câu chung và 2 câu theo định hướng",
                    type: "TRUE_FALSE_GROUP",
                    totalPoints: 4,
                },
            ],
        },
        questions: {
            part1: exam.part1Questions.map(questionToJson),
            part2_common: exam.part2CommonQuestions.map(q => ({
                ...questionToJson(q),
                id: q.id,
            })),
            part2_computer_science: exam.part2CSQuestions.map(q => ({
                ...questionToJson(q),
                id: `${q.id}_cs`,
                subQuestions: q.subQuestions?.map(s => ({
                    id: `${q.id}_cs_${s.label.replace(")", "")}`,
                    label: s.label,
                    content: s.content,
                    contentHtml: s.contentHtml,
                    isCorrect: s.isCorrect,
                    images: s.images,
                    formulas: s.formulas,
                })),
            })),
            part2_applied_informatics: exam.part2AIQuestions.map(q => ({
                ...questionToJson(q),
                id: `${q.id}_ai`,
                subQuestions: q.subQuestions?.map(s => ({
                    id: `${q.id}_ai_${s.label.replace(")", "")}`,
                    label: s.label,
                    content: s.content,
                    contentHtml: s.contentHtml,
                    isCorrect: s.isCorrect,
                    images: s.images,
                    formulas: s.formulas,
                })),
            })),
        },
        // Images stored separately
        images: imagesArray,
        // Warnings cho các câu hỏi có vấn đề
        warnings: exam.warnings || [],
        // Lỗi nghiêm trọng (câu hỏi có số đáp án không đúng)
        criticalErrors: (exam.warnings || [])
            .filter(w => w.type === "EXTRA_CHOICES" || w.type === "INCOMPLETE_CHOICES" || w.type === "MISSING_CHOICES")
            .map(w => {
                const question = [...exam.part1Questions, ...exam.part2CommonQuestions, ...exam.part2CSQuestions, ...exam.part2AIQuestions]
                    .find(q => q.order === w.questionOrder);
                return {
                    questionNum: w.questionOrder,
                    type: w.type,
                    actualChoices: question?.actualChoiceCount || 0,
                    expectedChoices: question?.expectedChoiceCount || 4,
                    message: w.message,
                    suggestion: w.suggestion,
                    rawText: question?.rawContent || ""
                };
            }),
        _meta: {
            parsedAt: new Date().toISOString(),
            totalQuestions: exam.part1Questions.length + 
                exam.part2CommonQuestions.length + 
                exam.part2CSQuestions.length + 
                exam.part2AIQuestions.length,
            totalImages: imagesArray.length,
            province: exam.province,
            school: exam.school,
            hasImages: imagesArray.length > 0,
            hasFormulas: exam.part1Questions.some(q => q.formulas && q.formulas.length > 0),
            subject: exam.subject || "tin-hoc",
            expectedChoicesPerQuestion: exam.expectedChoicesPerQuestion || 4,
            warningsCount: exam.warnings?.length || 0,
            criticalErrorsCount: (exam.warnings || []).filter(w => 
                w.type === "EXTRA_CHOICES" || w.type === "INCOMPLETE_CHOICES" || w.type === "MISSING_CHOICES"
            ).length,
            questionsWithExtraChoices: (exam.warnings || []).filter(w => w.type === "EXTRA_CHOICES").map(w => w.questionOrder),
            questionsWithMissingChoices: (exam.warnings || []).filter(w => w.type === "INCOMPLETE_CHOICES" || w.type === "MISSING_CHOICES").map(w => w.questionOrder),
            questionsWithNoAnswer: (exam.warnings || []).filter(w => w.type === "NO_ANSWER").map(w => w.questionOrder),
            questionsWithIssues: exam.warnings?.map(w => w.questionOrder).filter((v, i, a) => a.indexOf(v) === i) || [],
        },
    };
}

// ========================
// CLI
// ========================

async function main() {
    const args = process.argv.slice(2);
    
    // Parse flags
    const withMedia = args.includes("--with-media") || args.includes("-m");
    const saveImages = args.includes("--save-images") || args.includes("-i");
    const strictMode = args.includes("--strict") || args.includes("-s");
    const copySource = args.includes("--copy-source") || args.includes("-C");
    
    // Parse output directory: --output-dir=./output or -o ./output
    let outputDir: string | undefined;
    const outputDirArg = args.find(a => a.startsWith("--output-dir="));
    if (outputDirArg) {
        outputDir = outputDirArg.split("=")[1];
    } else {
        const outputIndex = args.findIndex(a => a === "-o");
        if (outputIndex !== -1 && args[outputIndex + 1]) {
            outputDir = args[outputIndex + 1];
        }
    }
    
    // Parse subject option: --subject=toan or -S toan
    let subject = "tin-hoc"; // default
    const subjectArg = args.find(a => a.startsWith("--subject="));
    if (subjectArg) {
        subject = subjectArg.split("=")[1];
    } else {
        const subjectIndex = args.findIndex(a => a === "-S");
        if (subjectIndex !== -1 && args[subjectIndex + 1]) {
            subject = args[subjectIndex + 1];
        }
    }
    
    // Parse expected choices: --choices=4 or -c 4
    let expectedChoices: number | undefined;
    const choicesArg = args.find(a => a.startsWith("--choices="));
    if (choicesArg) {
        expectedChoices = parseInt(choicesArg.split("=")[1]);
    } else {
        const choicesIndex = args.findIndex(a => a === "-c");
        if (choicesIndex !== -1 && args[choicesIndex + 1]) {
            expectedChoices = parseInt(args[choicesIndex + 1]);
        }
    }
    
    const filteredArgs = args.filter(a => 
        !a.startsWith("-") && 
        !a.startsWith("--") &&
        !["tin-hoc", "toan", "vat-ly", "hoa-hoc", "sinh-hoc"].includes(a) &&
        isNaN(parseInt(a))
    );
    
    if (filteredArgs.length === 0) {
        console.log("Usage: npx tsx scripts/parse-tin-hoc-exam.ts [options] <path-to-docx> [path-to-answer-docx]");
        console.log("");
        console.log("Options:");
        console.log("  -m, --with-media       Extract images and formulas from DOCX");
        console.log("  -i, --save-images      Save images to separate files (requires --with-media)");
        console.log("  -s, --strict           Strict mode - report all issues");
        console.log("  -S, --subject=SUBJECT  Môn học (tin-hoc, toan, vat-ly, hoa-hoc, sinh-hoc)");
        console.log("  -c, --choices=N        Số đáp án mong đợi mỗi câu (mặc định: 4)");
        console.log("  -C, --copy-source      Copy file DOCX gốc vào cùng thư mục output");
        console.log("  -o, --output-dir=DIR   Thư mục output (mặc định: cùng thư mục với file input)");
        console.log("  --legacy               Dùng phương pháp parse cũ (line-by-line)");
        console.log("");
        console.log("Output files:");
        console.log("  <name>-parsed.json     File JSON chứa dữ liệu đã parse");
        console.log("  <name>.docx            File DOCX gốc (nếu dùng --copy-source)");
        console.log("");
        console.log("Parse method:");
        console.log("  Script sẽ tìm tất cả 'Câu N' trong file và split thành từng block.");
        console.log("  Hỗ trợ: 'Câu 1', 'Câu 1:', 'Câu 1.', 'Question 1', '1.', '1)'");
        console.log("");
        console.log("Supported subjects:");
        console.log("  tin-hoc    - Tin học (mặc định, 4 đáp án A,B,C,D)");
        console.log("  toan       - Toán (4 đáp án)");
        console.log("  vat-ly     - Vật lý (4 đáp án)");
        console.log("  hoa-hoc    - Hóa học (4 đáp án)");
        console.log("  sinh-hoc   - Sinh học (4 đáp án)");
        console.log("");
        console.log("Examples:");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts exam.docx");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts --with-media exam.docx");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts -m -i exam.docx answer.docx");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts --subject=toan --choices=4 exam.docx");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts -C -o ./output exam.docx");
        console.log("  npx tsx scripts/parse-tin-hoc-exam.ts --copy-source --output-dir=./parsed exam.docx");
        process.exit(1);
    }
    
    const examPath = path.resolve(filteredArgs[0]);
    const answerPath = filteredArgs[1] ? path.resolve(filteredArgs[1]) : undefined;
    
    if (!fs.existsSync(examPath)) {
        console.error(`❌ File not found: ${examPath}`);
        process.exit(1);
    }
    
    console.log(`📄 Parsing exam: ${examPath}`);
    console.log(`   📚 Subject: ${subject}`);
    console.log(`   🔢 Expected choices per question: ${expectedChoices || EXPECTED_CHOICES_BY_SUBJECT[subject] || 4}`);
    if (withMedia) {
        console.log(`   📷 Image extraction: enabled`);
        console.log(`   📐 Formula detection: enabled`);
    }
    if (strictMode) {
        console.log(`   ⚠️  Strict mode: enabled`);
    }
    
    let exam: ParsedExam;
    const metadata = extractMetadata(examPath);
    
    const parseOptions = {
        subject,
        expectedChoices,
        strictMode,
    };
    
    if (withMedia) {
        // Parse with media extraction
        const { text, html, images } = await readDocxFileWithMedia(examPath);
        exam = parseExamTextWithMedia(text, html, images, metadata);
        
        // Save images to files if requested
        if (saveImages && exam.images.size > 0) {
            const imagesDir = path.join(path.dirname(examPath), "images");
            if (!fs.existsSync(imagesDir)) {
                fs.mkdirSync(imagesDir, { recursive: true });
            }
            
            for (const [imageId, imageData] of exam.images) {
                const imagePath = path.join(imagesDir, imageId);
                const buffer = Buffer.from(imageData.data, "base64");
                fs.writeFileSync(imagePath, buffer);
                console.log(`   💾 Saved: ${imagePath}`);
            }
        }
    } else {
        // Simple text parsing - sử dụng phương pháp split theo "Câu N"
        const examText = await readDocxFile(examPath);
        
        // Thử phương pháp split trước (chính xác hơn)
        exam = parseExamBySplitting(examText, metadata, parseOptions);
        
        // Nếu không tìm được câu hỏi nào, fallback sang line-by-line
        if (exam.part1Questions.length === 0 && exam.part2CommonQuestions.length === 0) {
            console.log("\n🔄 Fallback sang phương pháp line-by-line...");
            exam = parseExamText(examText, metadata, parseOptions);
        }
    }
    
    console.log(`\n📊 Parse Results:`);
    console.log(`   Province: ${exam.province}`);
    console.log(`   Source: ${exam.source}`);
    console.log(`   Part 1 Questions: ${exam.part1Questions.length}`);
    console.log(`   Part 2 Common: ${exam.part2CommonQuestions.length}`);
    console.log(`   Part 2 CS: ${exam.part2CSQuestions.length}`);
    console.log(`   Part 2 AI: ${exam.part2AIQuestions.length}`);
    
    // Report questions with issues
    if (exam.warnings && exam.warnings.length > 0) {
        console.log(`\n⚠️  Questions with issues (${exam.warnings.length} total):`);
        const byQuestion = exam.warnings.reduce((acc, w) => {
            if (!acc[w.questionOrder]) acc[w.questionOrder] = [];
            acc[w.questionOrder].push(w);
            return acc;
        }, {} as Record<number, ParseWarning[]>);
        
        for (const [qNum, warnings] of Object.entries(byQuestion)) {
            console.log(`   Câu ${qNum}:`);
            for (const w of warnings) {
                console.log(`      - ${w.type}: ${w.message}`);
                if (w.suggestion) {
                    console.log(`        💡 ${w.suggestion}`);
                }
            }
        }
    } else {
        console.log(`\n✅ All questions parsed successfully!`);
    }
    
    if (withMedia) {
        console.log(`\n📷 Media:`);
        console.log(`   🖼️  Images found: ${exam.images.size}`);
        const questionsWithFormulas = [...exam.part1Questions, ...exam.part2CommonQuestions]
            .filter(q => q.formulas && q.formulas.length > 0).length;
        console.log(`   📐 Questions with formulas: ${questionsWithFormulas}`);
    }
    
    // Parse answer key if provided
    if (answerPath && fs.existsSync(answerPath)) {
        console.log(`\n📝 Parsing answer key: ${answerPath}`);
        const answerText = await readDocxFile(answerPath);
        const answerKey = parseAnswerKey(answerText);
        applyAnswerKey(exam, answerKey);
        console.log(`   Part 1 answers: ${Object.keys(answerKey.part1).length}`);
        console.log(`   Part 2 answers: ${Object.keys(answerKey.part2).length}`);
    }
    
    // Convert to JSON
    const jsonOutput = toImportJson(exam);
    
    // Determine output directory
    const finalOutputDir = outputDir 
        ? path.resolve(outputDir)
        : path.dirname(examPath);
    
    // Create output directory if not exists
    if (outputDir && !fs.existsSync(finalOutputDir)) {
        fs.mkdirSync(finalOutputDir, { recursive: true });
        console.log(`\n📁 Created output directory: ${finalOutputDir}`);
    }
    
    // Get base filename without extension
    const baseName = path.basename(examPath, path.extname(examPath));
    
    // Output JSON file
    const jsonOutputPath = path.join(finalOutputDir, `${baseName}-parsed.json`);
    fs.writeFileSync(jsonOutputPath, JSON.stringify(jsonOutput, null, 2), "utf-8");
    console.log(`\n✅ JSON saved to: ${jsonOutputPath}`);
    
    // Copy source DOCX if requested
    if (copySource) {
        const docxOutputPath = path.join(finalOutputDir, `${baseName}.docx`);
        // Only copy if source and dest are different
        if (path.resolve(examPath) !== path.resolve(docxOutputPath)) {
            fs.copyFileSync(examPath, docxOutputPath);
            console.log(`📄 DOCX copied to: ${docxOutputPath}`);
        }
        
        // Also copy answer file if provided
        if (answerPath && fs.existsSync(answerPath)) {
            const answerBaseName = path.basename(answerPath, path.extname(answerPath));
            const answerOutputPath = path.join(finalOutputDir, `${answerBaseName}.docx`);
            if (path.resolve(answerPath) !== path.resolve(answerOutputPath)) {
                fs.copyFileSync(answerPath, answerOutputPath);
                console.log(`📄 Answer DOCX copied to: ${answerOutputPath}`);
            }
        }
    }
    
    // Summary warnings
    if (exam.warnings && exam.warnings.length > 0) {
        const noAnswerWarnings = exam.warnings.filter(w => w.type === "NO_ANSWER");
        const choiceWarnings = exam.warnings.filter(w => 
            w.type === "EXTRA_CHOICES" || w.type === "INCOMPLETE_CHOICES" || w.type === "MISSING_CHOICES"
        );
        
        console.log(`\n⚠️  Tổng kết warnings:`);
        if (choiceWarnings.length > 0) {
            console.log(`   📛 ${choiceWarnings.length} câu có lỗi về số đáp án`);
        }
        if (noAnswerWarnings.length > 0) {
            console.log(`   ❓ ${noAnswerWarnings.length} câu chưa có đáp án đúng`);
        }
        console.log(`   📝 Chi tiết trong file JSON: ${jsonOutputPath}`);
    } else {
        console.log(`\n✅ Tất cả câu hỏi đã parse thành công!`);
    }
    
    console.log("\n📌 Để import vào database, chạy:");
    console.log(`   npx tsx scripts/convert-exam-json.ts ${jsonOutputPath}`);
}

main().catch(console.error);
