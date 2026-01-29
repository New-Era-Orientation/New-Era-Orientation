/**
 * API Route: Parse DOCX file for exam editor
 * 
 * Features:
 * - Extract text and HTML from DOCX
 * - Detect correct answers from styling (bold, underline, color, highlight)
 * - Associate images with specific questions
 * - Handle special characters and math formulas
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { 
  extractAnswerKeyFromDocx, 
  normalizeSpecialCharacters,
  extractMathFormulas,
} from '@/lib/docx-xml-parser';

// ============================================
// Types
// ============================================

interface ExtractedImage {
  id: string;
  contentType: string;
  data: string;
  questionOrder?: number; // Which question this image belongs to
}

interface ChoiceInfo {
  label: string;
  content: string;
  isCorrect: boolean;
  isBold?: boolean;
  isUnderlined?: boolean;
  hasColor?: string;
  isHighlighted?: boolean;
}

interface ParsedQuestion {
  order: number;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE_GROUP';
  choices: ChoiceInfo[];
  correctAnswer?: string;
  images?: string[];
  answerSource?: string; // How the answer was detected: 'bold', 'underline', 'color', 'highlight', 'text', 'manual'
}

interface AnswerKey {
  [questionNum: number]: string;
}

// ============================================
// Answer Detection from HTML
// ============================================

/**
 * Extract answer key from HTML by detecting styled choices
 * Supports: bold, underline, color (red/blue), highlight, and "Đáp án:" text
 */
function extractAnswerKeyFromHtml(html: string): {
  answerKey: AnswerKey;
  questionImageMap: Map<number, string[]>;
} {
  const $ = cheerio.load(html);
  const answerKey: AnswerKey = {};
  const questionImageMap = new Map<number, string[]>();
  
  let currentQuestionNum = 0;
  
  // Process each paragraph/element
  $('p, div, li').each((_, element) => {
    const $el = $(element);
    const text = $el.text();
    
    // Detect question number
    const questionMatch = text.match(/C[âaà]u\s*(\d+)/iu);
    if (questionMatch) {
      currentQuestionNum = parseInt(questionMatch[1]);
    }
    
    // Associate images with current question
    $el.find('img').each((_, img) => {
      const imageId = $(img).attr('data-image-id');
      if (imageId && currentQuestionNum > 0) {
        if (!questionImageMap.has(currentQuestionNum)) {
          questionImageMap.set(currentQuestionNum, []);
        }
        questionImageMap.get(currentQuestionNum)!.push(imageId);
      }
    });
    
    // Method 1: Check for "Đáp án:" pattern in text
    const answerTextMatch = text.match(/[đd][áa]p\s*[áa]n[:\s]*([A-D])/iu);
    if (answerTextMatch && currentQuestionNum > 0) {
      answerKey[currentQuestionNum] = answerTextMatch[1].toUpperCase();
      return;
    }
    
    // Method 2: Look for styled choices (bold, underline, color)
    const choicePatterns = [
      /\b([A-D])\s*[.)]\s*/gi,
      /\b([A-D])\s*[.)]/gi
    ];
    
    // Get HTML content to check for styling
    const htmlContent = $el.html() || '';
    
    // Check each choice label for styling
    for (const label of ['A', 'B', 'C', 'D']) {
      // Pattern to find choice with various stylings
      const patterns = [
        // Bold choice: <strong>A.</strong> or <strong>A. content</strong>
        new RegExp(`<strong[^>]*>\\s*${label}[.)]`, 'i'),
        new RegExp(`<b[^>]*>\\s*${label}[.)]`, 'i'),
        // Underlined choice
        new RegExp(`<u[^>]*>\\s*${label}[.)]`, 'i'),
        // Colored choice (red, blue, green)
        new RegExp(`<span[^>]*color:\\s*(red|#f{1,2}0{1,2}0{0,2}|#cc0000|blue|green)[^>]*>\\s*${label}[.)]`, 'i'),
        new RegExp(`<span[^>]*style="[^"]*color:\\s*(red|#f{1,2}0{1,2}0{0,2}|#cc0000|blue|green)[^"]*"[^>]*>[^<]*${label}[.)]`, 'i'),
        // Marked/highlighted choice
        new RegExp(`<mark[^>]*>\\s*${label}[.)]`, 'i'),
        // Choice content is bold (not just the label)
        new RegExp(`${label}[.)\\s]*<strong`, 'i'),
        new RegExp(`${label}[.)\\s]*<b>`, 'i'),
      ];
      
      for (const pattern of patterns) {
        if (pattern.test(htmlContent)) {
          // Only set if this question doesn't have an answer yet
          if (currentQuestionNum > 0 && !answerKey[currentQuestionNum]) {
            answerKey[currentQuestionNum] = label;
          }
          break;
        }
      }
    }
  });
  
  return { answerKey, questionImageMap };
}

/**
 * Parse answer table at the end of exam (if exists)
 * Format: 1-A, 2-B, 3-C... or table with rows
 */
function parseAnswerTable(html: string): AnswerKey {
  const $ = cheerio.load(html);
  const answerKey: AnswerKey = {};
  
  // Check for answer table
  $('table').each((_, table) => {
    const $table = $(table);
    const headerText = $table.find('th, td').first().text().toLowerCase();
    
    // If this looks like an answer table
    if (headerText.includes('câu') || headerText.includes('đáp án')) {
      $table.find('tr').each((_, row) => {
        const cells = $(row).find('td, th');
        if (cells.length >= 2) {
          const questionNum = parseInt($(cells[0]).text().match(/\d+/)?.[0] || '0');
          const answer = $(cells[1]).text().trim().toUpperCase();
          if (questionNum > 0 && /^[A-D]$/.test(answer)) {
            answerKey[questionNum] = answer;
          }
        }
      });
    }
  });
  
  // Check for inline answer list: "1-A, 2-B, 3-C" or "1.A 2.B 3.C"
  const fullText = $('body').text();
  const answerListMatch = fullText.match(/(?:đáp án|ĐÁP ÁN)[:\s]*([\d\s\-.,A-Da-d]+)/iu);
  if (answerListMatch) {
    const answerList = answerListMatch[1];
    const pairs = answerList.matchAll(/(\d+)\s*[-.:]\s*([A-Da-d])/g);
    for (const pair of pairs) {
      answerKey[parseInt(pair[1])] = pair[2].toUpperCase();
    }
  }
  
  return answerKey;
}

// ============================================
// DOCX Parser
// ============================================

function generateImageId(contentType: string, data: Buffer): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(data).digest('hex').slice(0, 8);
  const ext = contentType.split('/')[1] || 'png';
  return `img_${hash}.${ext}`;
}

async function parseDocxBuffer(buffer: Buffer): Promise<{
  text: string;
  html: string;
  images: Map<string, ExtractedImage>;
}> {
  const images = new Map<string, ExtractedImage>();

  const imageConverter = mammoth.images.imgElement(async (image: { contentType: string; readAsBuffer: () => Promise<Buffer> }) => {
    const imgBuffer = await image.readAsBuffer();
    const base64 = imgBuffer.toString('base64');
    const imageId = generateImageId(image.contentType, imgBuffer);

    images.set(imageId, {
      id: imageId,
      contentType: image.contentType,
      data: base64,
    });

    return {
      src: `data:${image.contentType};base64,${base64}`,
      'data-image-id': imageId,
    };
  });

  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml({ buffer }, { convertImage: imageConverter }),
    mammoth.extractRawText({ buffer }),
  ]);

  return {
    text: textResult.value,
    html: htmlResult.value,
    images,
  };
}

function parseExamText(text: string): {
  questions: ParsedQuestion[];
  metadata: Record<string, string>;
} {
  // Normalize text - add line breaks before choice patterns and question numbers
  let normalizedText = text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Normalize multiple whitespace (except newlines) to single space
    .replace(/[^\S\n]+/g, ' ')
    // STEP 1: Add newline BEFORE A. B. C. D. when preceded by punctuation (? . !)
    // This handles: "Kết quả?A. 70" -> "Kết quả?\nA. 70"
    // Must use function replacement to preserve group 2
    .replace(/([?.!])([A-D])\.\s*/g, (_, p, c) => `${p}\n${c}. `)
    // STEP 2: Handle table-style choices: Split before B., C., D. when preceded by non-newline
    // This handles: "A. 70.B. 165" -> "A. 70.\nB. 165"
    .replace(/([^\n])([B-D])\.\s*/gi, (_, g1, g2) => `${g1}\n${g2}. `)
    // STEP 3: Add newline before "Câu X" when preceded by any char
    // This handles: "D. 90.Câu 9" -> "D. 90.\nCâu 9"
    .replace(/([^\n])(Câu\s*\d+)/gi, (_, g1, g2) => `${g1}\n${g2}`)
    // Add newline BEFORE A. B. C. D. when preceded by ) or > (HTML closing tags)
    .replace(/([)>])([A-D])\.\s*/g, (_, g1, g2) => `${g1}\n${g2}. `)
    // Handle pattern where choices run together without period: "hìnhB. Switch"
    .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])([A-D])\.\s*/gi, (_, g1, g2) => `${g1}\n${g2}. `)
    // Part 2 True/False: Add newline before a), b), c), d) when preceded by . ? ! or : (with any spaces)
    .replace(/([.?!:])\s*([a-d])\)\s*/g, (_, g1, g2) => `${g1}\n${g2}) `)
    // Also handle when directly after a word without punctuation: "trênb)" -> "trên\nb)"
    .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])([a-d])\)\s*/gi, (_, g1, g2) => `${g1}\n${g2}) `);
  
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l);
  const questions: ParsedQuestion[] = [];
  const metadata: Record<string, string> = {};
  
  let currentQuestion: ParsedQuestion | null = null;
  let currentPart = 1;
  let questionOrder = 0;
  let isInCodeBlock = false;
  let codeLanguage: string | null = null;

  // Patterns
  const QUESTION_PATTERN = /^C[âaà]u\s*(\d+)[\s.:]*(.+)?/iu;
  const CHOICE_PATTERN_PART1 = /^([A-D])[.)\s]+(.+)/i;
  const CHOICE_PATTERN_PART2 = /^([a-d])\)\s*(.+)/i;  // a), b), c), d) for True/False
  const PART_PATTERN = /PH[ẦAÀ]N\s*(I{1,2}|[12])/iu;
  const ANSWER_PATTERN = /[đd][áa]p\s*[áa]n(?:\s*[đd][úu]ng)?[:\s]*([A-D])/iu;
  
  // Code language detection keywords
  const CODE_LANGUAGE_PATTERNS = {
    python: [
      /\bdef\s+\w+\s*\(/i,                    // def function_name(
      /\bprint\s*\(/i,                         // print(
      /\bfor\s+\w+\s+in\s+/i,                  // for x in
      /\bif\s+__name__\s*==\s*['"]__main__['"]/i, // if __name__ == "__main__"
      /\bimport\s+\w+/i,                       // import module
      /\bfrom\s+\w+\s+import/i,                // from module import
      /\brange\s*\(/i,                         // range(
      /\blen\s*\(/i,                           // len(
      /\breturn\s+/i,                          // return
      /:\s*$/,                                 // ends with :
      /\bTrue\b|\bFalse\b|\bNone\b/,           // Python keywords
    ],
    cpp: [
      /\bint\s+\w+\s*[=(]/i,                   // int var = or int func(
      /\bvoid\s+\w+\s*\(/i,                    // void func(
      /\bcout\s*<</i,                          // cout <<
      /\bcin\s*>>/i,                           // cin >>
      /\b#include\s*</i,                       // #include <
      /\busing\s+namespace\s+std/i,            // using namespace std
      /\bfor\s*\(\s*int/i,                     // for (int
      /\bprintf\s*\(/i,                        // printf(
      /\bscanf\s*\(/i,                         // scanf(
      /\breturn\s+0\s*;/i,                     // return 0;
      /\bbool\s+\w+/i,                         // bool var
      /\{\s*$/,                                // ends with {
    ],
    sql: [
      /\bSELECT\s+/i,                          // SELECT
      /\bFROM\s+\w+/i,                         // FROM table
      /\bWHERE\s+/i,                           // WHERE
      /\bINSERT\s+INTO/i,                      // INSERT INTO
      /\bUPDATE\s+\w+\s+SET/i,                 // UPDATE table SET
      /\bDELETE\s+FROM/i,                      // DELETE FROM
      /\bCREATE\s+TABLE/i,                     // CREATE TABLE
      /\bJOIN\s+\w+/i,                         // JOIN table
      /\bORDER\s+BY/i,                         // ORDER BY
      /\bGROUP\s+BY/i,                         // GROUP BY
    ],
    html: [
      /<html[^>]*>/i,                          // <html>
      /<head[^>]*>/i,                          // <head>
      /<body[^>]*>/i,                          // <body>
      /<div[^>]*>/i,                           // <div>
      /<p[^>]*>/i,                             // <p>
      /<a\s+href=/i,                           // <a href=
      /<img\s+/i,                              // <img
      /<table[^>]*>/i,                         // <table>
      /<form[^>]*>/i,                          // <form>
      /<input[^>]*>/i,                         // <input>
      /<\/\w+>/,                               // closing tags
    ],
    css: [
      /\{[^}]*:[^}]*;[^}]*\}/,                 // { property: value; }
      /\bcolor\s*:/i,                          // color:
      /\bfont-size\s*:/i,                      // font-size:
      /\bbackground(-color)?\s*:/i,            // background:
      /\bmargin\s*:/i,                         // margin:
      /\bpadding\s*:/i,                        // padding:
      /\bborder\s*:/i,                         // border:
      /\bdisplay\s*:/i,                        // display:
      /\bwidth\s*:/i,                          // width:
      /\bheight\s*:/i,                         // height:
      /\.\w+\s*\{/,                            // .class {
      /#\w+\s*\{/,                             // #id {
    ],
  };
  
  // Code block header keywords (indicates start of code section)
  const CODE_HEADER_PATTERNS = [
    /h[àa]m\s+vi[ếe]t\s+b[ằa]ng\s+ng[ôo]n\s+ng[ữu]\s*(Python|C\+\+)/iu,  // "Hàm viết bằng ngôn ngữ Python/C++"
    /ng[ôo]n\s+ng[ữu]\s*(Python|C\+\+|SQL)/iu,                           // "ngôn ngữ Python/C++/SQL"
    /m[ãa]\s+ngu[ồo]n\s*(Python|C\+\+)/iu,                               // "mã nguồn Python/C++"
    /[đd]o[ạa]n\s+m[ãa]\s*(Python|C\+\+|HTML|CSS|SQL)/iu,                // "đoạn mã Python/C++/HTML/CSS/SQL"
    /ch[ươ][ơo]ng\s+tr[ìi]nh\s*(Python|C\+\+)/iu,                        // "chương trình Python/C++"
  ];
  
  // Instruction/guidance keywords to skip
  const INSTRUCTION_KEYWORDS = [
    /^th[íi]\s*sinh\s*(tr[ảa]\s*l[ờo]i|ch[ọo]n|l[àa]m)/iu,  // "Thí sinh trả lời/chọn/làm"
    /^trong\s*m[ỗô]i\s*[ýy]/iu,  // "Trong mỗi ý"
    /^ch[ọo]n\s*[đd][úu]ng\s*ho[ặa]c\s*sai/iu,  // "chọn đúng hoặc sai"
    /^ph[ầa]n\s*(riêng|chung)/iu,  // "Phần riêng/chung"
    /^[đd][ịi]nh\s*h[ưu][ớo]ng/iu,  // "Định hướng"
    /^th[íi]\s*sinh\s*ch[ỉi]\s*ch[ọo]n/iu,  // "Thí sinh chỉ chọn"
    /^ch[ọo]n\s*m[ộo]t\s*trong/iu,  // "Chọn một trong"
  ];
  
  // Keywords that introduce True/False statements
  const TF_INTRO_KEYWORDS = [
    /d[ưu][ớo]i\s*[đd][âa]y\s*(l[àa])?\s*(m[ộo]t\s*s[ốo])?\s*nh[ậa]n\s*x[eé]t/iu,  // "Dưới đây là một số nhận xét"
    /m[ộo]t\s*s[ốo]\s*(ng[ưu][ờo]i|h[ọo]c\s*sinh)\s*([đd][ãa])?\s*(nh[ậa]n\s*x[eé]t|[đd][ưu]a\s*ra)/iu,  // "Một số người/học sinh nhận xét"
    /nh[ậa]n\s*x[eé]t\s*(sau|d[ưu][ớo]i)\s*[đd][âa]y/iu,  // "nhận xét sau/dưới đây"
    /c[áa]c\s*[ýy]\s*ki[ếe]n\s*sau/iu,  // "các ý kiến sau"
  ];

  // Helper function to detect code language
  function detectCodeLanguage(text: string): string | null {
    for (const [lang, patterns] of Object.entries(CODE_LANGUAGE_PATTERNS)) {
      const matchCount = patterns.filter(p => p.test(text)).length;
      if (matchCount >= 2) {  // At least 2 patterns match
        return lang;
      }
    }
    return null;
  }

  // Helper function to check if line is a code header
  function getCodeHeaderLanguage(line: string): string | null {
    for (const pattern of CODE_HEADER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        const lang = match[1]?.toLowerCase();
        if (lang === 'c++') return 'cpp';
        return lang || null;
      }
    }
    return null;
  }

  for (const line of lines) {
    // Skip instruction lines
    const isInstruction = INSTRUCTION_KEYWORDS.some(pattern => pattern.test(line));
    if (isInstruction) {
      continue;
    }
    
    // Check for code header (e.g., "Hàm viết bằng ngôn ngữ Python")
    const headerLang = getCodeHeaderLanguage(line);
    if (headerLang) {
      codeLanguage = headerLang;
      if (currentQuestion) {
        currentQuestion.content += ` [${headerLang.toUpperCase()}] `;
      }
      continue;
    }
    
    // Detect code in content
    const detectedLang = detectCodeLanguage(line);
    if (detectedLang && currentQuestion) {
      // Add language marker if not already marked
      if (!currentQuestion.content.includes(`[${detectedLang.toUpperCase()}]`)) {
        currentQuestion.content += ` [${detectedLang.toUpperCase()}] `;
      }
    }
    
    // Check part header
    const partMatch = line.match(PART_PATTERN);
    if (partMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
        currentQuestion = null;
      }
      const partNum = partMatch[1];
      currentPart = (partNum === 'II' || partNum === '2') ? 2 : 1;
      continue;
    }

    // Check inline answer
    const answerMatch = line.match(ANSWER_PATTERN);
    if (answerMatch && currentQuestion) {
      currentQuestion.correctAnswer = answerMatch[1].toUpperCase();
      for (const choice of currentQuestion.choices) {
        choice.isCorrect = choice.label === currentQuestion.correctAnswer;
      }
      continue;
    }

    // Check question
    const questionMatch = line.match(QUESTION_PATTERN);
    if (questionMatch) {
      if (currentQuestion) {
        questions.push(currentQuestion);
      }

      questionOrder++;
      currentQuestion = {
        order: questionOrder,
        content: (questionMatch[2] || '').trim(),
        type: currentPart === 1 ? 'MULTIPLE_CHOICE' : 'TRUE_FALSE_GROUP',
        choices: [],
      };
      continue;
    }

    // Check if this line introduces True/False statements (add to question content but mark it)
    const isTFIntro = TF_INTRO_KEYWORDS.some(pattern => pattern.test(line));
    if (isTFIntro && currentQuestion && currentPart === 2) {
      // This is context for the T/F question, add it
      currentQuestion.content += ' ' + line;
      continue;
    }

    // Check choice based on current part
    if (currentPart === 1) {
      // Part 1: Multiple choice A, B, C, D
      const choiceMatch = line.match(CHOICE_PATTERN_PART1);
      if (choiceMatch && currentQuestion) {
        currentQuestion.choices.push({
          label: choiceMatch[1].toUpperCase(),
          content: choiceMatch[2].trim(),
          isCorrect: false,
        });
        continue;
      }
    } else {
      // Part 2: True/False a), b), c), d)
      const choiceMatch = line.match(CHOICE_PATTERN_PART2);
      if (choiceMatch && currentQuestion) {
        // Convert a,b,c,d to A,B,C,D for consistency
        const label = choiceMatch[1].toUpperCase();
        currentQuestion.choices.push({
          label,
          content: choiceMatch[2].trim(),
          isCorrect: false,  // Will be detected from styling
        });
        continue;
      }
    }

    // Append to question content (context/scenario text)
    if (currentQuestion && !line.match(/^[A-Da-d][.)]/)) {
      currentQuestion.content += ' ' + line;
    }
  }

  if (currentQuestion) {
    questions.push(currentQuestion);
  }

  return { questions, metadata };
}

// ============================================
// API Handler
// ============================================

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse with mammoth (for HTML and text)
    const { text, html, images } = await parseDocxBuffer(buffer);
    
    // Normalize special characters in text
    const normalizedText = normalizeSpecialCharacters(text);
    const { questions, metadata } = parseExamText(normalizedText);

    // ============================================
    // Answer Detection - Multiple Methods
    // ============================================
    
    // Method 1: Extract from styled choices in HTML (bold, underline, color - mammoth)
    const { answerKey: styledAnswers, questionImageMap } = extractAnswerKeyFromHtml(html);
    
    // Method 2: Parse answer table at end of exam
    const tableAnswers = parseAnswerTable(html);
    
    // Method 3: Direct DOCX XML parsing for highlight (mammoth doesn't support highlight)
    let xmlAnswers: Map<number, { answer: string; method: string; confidence: number }> | null = null;
    let xmlImages: { id: string; name: string; contentType: string; data: string }[] = [];
    let mathFormulas: { latex: string; omml: string; position: { paragraph: number; run: number } }[] = [];
    
    try {
      const xmlResult = await extractAnswerKeyFromDocx(buffer);
      xmlAnswers = xmlResult.answers;
      xmlImages = xmlResult.images;
      
      // Also extract math formulas
      mathFormulas = await extractMathFormulas(buffer);
    } catch (xmlError) {
      console.warn('XML parsing failed, using mammoth results only:', xmlError);
    }
    
    // Merge answers with priority: table > xml (highlight) > html styled > text-based
    const mergedAnswers: AnswerKey = { ...tableAnswers };
    
    // Add XML-detected answers (highlight, color from direct XML parsing)
    if (xmlAnswers) {
      for (const [qNum, info] of xmlAnswers.entries()) {
        // Only add if higher confidence or not yet set
        if (!mergedAnswers[qNum] || info.confidence > 0.85) {
          mergedAnswers[qNum] = info.answer;
        }
      }
    }
    
    // Add HTML-styled answers
    for (const [qNum, answer] of Object.entries(styledAnswers)) {
      if (!mergedAnswers[parseInt(qNum)]) {
        mergedAnswers[parseInt(qNum)] = answer;
      }
    }
    
    // Apply answers to questions
    let answersFromStyling = 0;
    let answersFromXml = 0;
    for (const question of questions) {
      // Check if we found answer from any method
      const detectedAnswer = mergedAnswers[question.order];
      if (detectedAnswer && !question.correctAnswer) {
        question.correctAnswer = detectedAnswer;
        
        // Determine source
        if (tableAnswers[question.order]) {
          question.answerSource = 'answer_table';
        } else if (xmlAnswers?.has(question.order)) {
          question.answerSource = xmlAnswers.get(question.order)!.method;
          answersFromXml++;
        } else if (styledAnswers[question.order]) {
          question.answerSource = 'html_styling';
          answersFromStyling++;
        }
      }
      
      // Mark the correct choice
      if (question.correctAnswer) {
        for (const choice of question.choices) {
          choice.isCorrect = choice.label === question.correctAnswer;
        }
      }
      
      // Associate images with this question
      const questionImages = questionImageMap.get(question.order);
      if (questionImages && questionImages.length > 0) {
        question.images = questionImages;
      }
    }

    // Convert images to array with question association
    const imagesArray = Array.from(images.values()).map(img => {
      // Find which question this image belongs to
      for (const [qOrder, imgIds] of questionImageMap.entries()) {
        if (imgIds.includes(img.id)) {
          return { ...img, questionOrder: qOrder };
        }
      }
      return img;
    });

    // ============================================
    // Generate text format output
    // ============================================
    
    let textFormat = '';
    if (metadata.title) textFormat += `Tiêu đề: ${metadata.title}\n`;
    textFormat += '\nPhần I: Trắc nghiệm nhiều lựa chọn\n\n';

    for (const q of questions) {
      textFormat += `Câu ${q.order}: ${q.content}\n`;
      
      // Add image references if any
      if (q.images && q.images.length > 0) {
        textFormat += `[Hình: ${q.images.join(', ')}]\n`;
      }
      
      for (const c of q.choices) {
        const marker = c.isCorrect ? '**' : '';
        textFormat += `${marker}${c.label}. ${c.content}${marker}\n`;
      }
      textFormat += '\n';
    }

    return NextResponse.json({
      success: true,
      text: textFormat.trim(),
      questions,
      images: imagesArray,
      rawText: text,
      html,
      mathFormulas: mathFormulas.length > 0 ? mathFormulas : undefined,
      stats: {
        questionCount: questions.length,
        imageCount: imagesArray.length,
        withAnswers: questions.filter(q => q.correctAnswer).length,
        answersFromText: questions.filter(q => q.answerSource === undefined && q.correctAnswer).length,
        answersFromHtmlStyling: answersFromStyling,
        answersFromXmlParsing: answersFromXml,
        answersFromTable: Object.keys(tableAnswers).length,
        mathFormulaCount: mathFormulas.length,
      },
    });
  } catch (error) {
    console.error('Parse DOCX error:', error);
    return NextResponse.json(
      { error: 'Failed to parse file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
