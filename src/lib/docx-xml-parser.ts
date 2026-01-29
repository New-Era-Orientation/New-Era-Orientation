/**
 * Direct DOCX XML Parser
 * 
 * Mammoth library can't detect all Word formatting (e.g., highlight colors).
 * This module parses the raw DOCX XML to extract:
 * - Highlight colors (w:highlight)
 * - Text colors (w:color)
 * - Bold text (w:b)
 * - Underline text (w:u)
 * - Strikethrough (w:strike)
 * - Images with positions
 */

import * as JSZip from 'jszip';

// ============================================
// Types
// ============================================

interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  highlight?: string;  // yellow, green, red, cyan, etc.
  color?: string;      // hex color like "FF0000"
}

interface Paragraph {
  runs: TextRun[];
  fullText: string;
}

interface DocxContent {
  paragraphs: Paragraph[];
  images: DocxImage[];
}

interface DocxImage {
  id: string;
  name: string;
  contentType: string;
  data: string; // base64
}

interface AnswerDetection {
  questionNum: number;
  answer: string;
  method: 'highlight' | 'color' | 'bold' | 'underline';
  confidence: number;
}

// ============================================
// XML Parsing Helpers
// ============================================

function extractTagContent(xml: string, tagName: string): string[] {
  const regex = new RegExp(`<${tagName}[^>]*>(.*?)<\\/${tagName}>`, 'g');
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) matches.push(match[1]);
  }
  return matches;
}

function extractAttribute(xml: string, attrName: string): string | null {
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function extractWordAttribute(xml: string, attrName: string): string | null {
  // Word uses namespaced attributes like w:val="value"
  const regex = new RegExp(`w:${attrName}="([^"]*)"`, 'i');
  const match = xml.match(regex);
  return match ? match[1] : null;
}

// ============================================
// DOCX XML Parser
// ============================================

/**
 * Parse DOCX file to extract text with formatting information
 */
export async function parseDocxXml(buffer: Buffer): Promise<DocxContent> {
  const zip = await JSZip.loadAsync(buffer);
  
  // Get main document content
  const documentXml = await zip.file('word/document.xml')?.async('string');
  if (!documentXml) {
    throw new Error('Invalid DOCX: no document.xml found');
  }
  
  const paragraphs: Paragraph[] = [];
  
  // Extract paragraphs (w:p elements) - using non-dotall approach
  const paragraphMatches = documentXml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || [];
  
  for (const pMatch of paragraphMatches) {
    const paragraphXml = pMatch.replace(/<\/?w:p[^>]*>/g, '');
    const runs: TextRun[] = [];
    
    // Extract text runs (w:r elements)
    const runMatches = paragraphXml.match(/<w:r[^>]*>[\s\S]*?<\/w:r>/g) || [];
    
    for (const rMatch of runMatches) {
      const runXml = rMatch;
      const run: TextRun = { text: '' };
      
      // Extract text content (w:t)
      const textMatch = runXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      if (textMatch) {
        run.text = textMatch[1];
      }
      
      // Extract run properties (w:rPr)
      const propsMatch = runXml.match(/<w:rPr[^>]*>([\s\S]*?)<\/w:rPr>/);
      if (propsMatch) {
        const propsXml = propsMatch[1];
        
        // Bold (w:b)
        if (/<w:b(?:\s|\/|>)/.test(propsXml)) {
          run.bold = true;
        }
        
        // Italic (w:i)
        if (/<w:i(?:\s|\/|>)/.test(propsXml)) {
          run.italic = true;
        }
        
        // Underline (w:u)
        if (/<w:u(?:\s|\/|>)/.test(propsXml)) {
          run.underline = true;
        }
        
        // Strikethrough (w:strike)
        if (/<w:strike(?:\s|\/|>)/.test(propsXml)) {
          run.strikethrough = true;
        }
        
        // Highlight color (w:highlight)
        const highlightMatch = propsXml.match(/<w:highlight\s+w:val="([^"]+)"/);
        if (highlightMatch) {
          run.highlight = highlightMatch[1]; // yellow, green, red, cyan, etc.
        }
        
        // Text color (w:color)
        const colorMatch = propsXml.match(/<w:color\s+w:val="([^"]+)"/);
        if (colorMatch && colorMatch[1] !== 'auto') {
          run.color = colorMatch[1]; // hex like "FF0000"
        }
      }
      
      if (run.text) {
        runs.push(run);
      }
    }
    
    // Build full paragraph text
    const fullText = runs.map(r => r.text).join('');
    
    if (fullText.trim()) {
      paragraphs.push({ runs, fullText });
    }
  }
  
  // Extract images
  const images = await extractDocxImages(zip);
  
  return { paragraphs, images };
}

/**
 * Extract all images from DOCX
 */
async function extractDocxImages(zip: typeof JSZip.prototype): Promise<DocxImage[]> {
  const images: DocxImage[] = [];
  const mediaFolder = zip.folder('word/media');
  
  if (!mediaFolder) {
    return images;
  }
  
  const imageFiles = Object.keys(zip.files).filter(
    name => name.startsWith('word/media/') && /\.(png|jpg|jpeg|gif|bmp|emf|wmf)$/i.test(name)
  );
  
  for (const filename of imageFiles) {
    const file = zip.file(filename);
    if (!file) continue;
    
    const data = await file.async('base64');
    const name = filename.split('/').pop() || filename;
    const ext = name.split('.').pop()?.toLowerCase() || 'png';
    
    const contentTypeMap: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'emf': 'image/x-emf',
      'wmf': 'image/x-wmf',
    };
    
    images.push({
      id: name,
      name,
      contentType: contentTypeMap[ext] || 'image/png',
      data,
    });
  }
  
  return images;
}

/**
 * Detect correct answers from formatting in DOCX XML
 * 
 * Supports two question types:
 * 1. Multiple Choice (Phần I): Single answer A/B/C/D per question
 * 2. True/False Group (Phần II): 4 sub-items a/b/c/d per question, each can be correct
 * 
 * Returns answers detected by highlight, color, bold, or underline
 */
export function detectAnswersFromFormatting(content: DocxContent): AnswerDetection[] {
  const detections: AnswerDetection[] = [];
  let currentQuestion = 0;
  let currentPart = 1; // 1 = Multiple choice, 2 = True/False
  
  for (const paragraph of content.paragraphs) {
    const text = paragraph.fullText;
    
    // Detect part change
    if (/PH[ẦAÀ]N\s*(II|2)/i.test(text)) {
      currentPart = 2;
    }
    
    // Detect question number
    const questionMatch = text.match(/C[âaà]u\s*(\d+)/i);
    if (questionMatch) {
      currentQuestion = parseInt(questionMatch[1]);
    }
    
    // Skip if not in a question context
    if (currentQuestion === 0) continue;
    
    // For Part 1 (Multiple Choice): Look for styled choice labels A, B, C, D
    // For Part 2 (True/False): Look for styled sub-items a, b, c, d
    const choicePattern = currentPart === 1 ? /^([A-D])\s*[.)]/i : /^([a-d])\s*[.)]/i;
    const contentPattern = currentPart === 1 ? /([A-D])\s*[.)]/i : /([a-d])\s*[.)]/i;
    
    for (const run of paragraph.runs) {
      // Check if this run starts with a choice/sub-item label
      const choiceMatch = run.text.match(choicePattern);
      if (!choiceMatch) continue;
      
      const label = choiceMatch[1].toUpperCase();
      const isStyled = checkRunStyling(run);
      
      if (isStyled.styled) {
        detections.push({
          questionNum: currentQuestion,
          answer: label,
          method: isStyled.method as 'highlight' | 'color' | 'bold' | 'underline',
          confidence: isStyled.confidence,
        });
      }
    }
    
    // Also check if content following choice is styled
    let inChoice = '';
    for (const run of paragraph.runs) {
      const choiceMatch = run.text.match(contentPattern);
      if (choiceMatch) {
        inChoice = choiceMatch[1].toUpperCase();
      }
      
      // Check if this run has content after a choice label and is styled
      if (inChoice && run.text.trim().length > 2) {
        const isStyled = checkRunStyling(run);
        
        if (isStyled.styled) {
          const existingDetection = detections.find(
            d => d.questionNum === currentQuestion && d.answer === inChoice
          );
          
          if (!existingDetection) {
            detections.push({
              questionNum: currentQuestion,
              answer: inChoice,
              method: isStyled.method as 'highlight' | 'color' | 'bold' | 'underline',
              confidence: isStyled.confidence * 0.95, // Slightly lower confidence
            });
          }
        }
      }
    }
  }
  
  // For Part 1: Deduplicate and keep only ONE answer per question (highest confidence)
  // For Part 2: Keep ALL correct sub-items for each question
  const part1Questions = new Map<number, AnswerDetection>();
  const part2Questions = new Map<number, AnswerDetection[]>();
  
  for (const detection of detections) {
    // Determine if this is Part 1 or Part 2 based on answer format
    // Part 1 has A-D, Part 2 has a-d (we store as uppercase but original was lowercase)
    const isLikelyPart2 = detections.filter(d => d.questionNum === detection.questionNum).length > 1;
    
    if (isLikelyPart2) {
      // Part 2: Multiple correct answers possible
      if (!part2Questions.has(detection.questionNum)) {
        part2Questions.set(detection.questionNum, []);
      }
      const existing = part2Questions.get(detection.questionNum)!;
      if (!existing.find(d => d.answer === detection.answer)) {
        existing.push(detection);
      }
    } else {
      // Part 1: Single answer
      const existing = part1Questions.get(detection.questionNum);
      if (!existing || detection.confidence > existing.confidence) {
        part1Questions.set(detection.questionNum, detection);
      }
    }
  }
  
  // Combine results - for Part 2, take the first/best answer for compatibility
  const result: AnswerDetection[] = [...part1Questions.values()];
  
  for (const [qNum, answers] of part2Questions) {
    // Sort by label (A, B, C, D) and take first for backward compatibility
    // But also mark that this question has multiple correct answers
    const sorted = answers.sort((a, b) => a.answer.localeCompare(b.answer));
    if (sorted.length > 0) {
      result.push({
        ...sorted[0],
        // Encode multiple answers if needed: "A,B,C" format
        answer: sorted.map(a => a.answer).join(','),
      });
    }
  }
  
  return result;
}

/**
 * Helper function to check if a text run has styling that indicates correct answer
 */
function checkRunStyling(run: TextRun): { styled: boolean; method: string; confidence: number } {
  // Priority: highlight > color > bold > underline
  if (run.highlight) {
    const correctHighlights = ['yellow', 'green', 'cyan', 'lightgray', 'red'];
    if (correctHighlights.includes(run.highlight.toLowerCase())) {
      return { styled: true, method: 'highlight', confidence: 0.95 };
    }
  }
  
  if (run.color) {
    const hexColor = run.color.toLowerCase();
    // Red color (FF0000 or variations)
    const isRed = hexColor === 'ff0000' || 
                  (hexColor.startsWith('ff') && !hexColor.startsWith('ff00')) ||
                  hexColor === 'red';
    // Blue color
    const isBlue = hexColor === '0000ff' || 
                   (hexColor.endsWith('ff') && !hexColor.startsWith('ff')) ||
                   hexColor === 'blue';
    
    if (isRed || isBlue) {
      return { styled: true, method: 'color', confidence: 0.9 };
    }
  }
  
  if (run.bold) {
    return { styled: true, method: 'bold', confidence: 0.8 };
  }
  
  if (run.underline) {
    return { styled: true, method: 'underline', confidence: 0.75 };
  }
  
  return { styled: false, method: '', confidence: 0 };
}

/**
 * Get answer key from DOCX by all methods
 */
export async function extractAnswerKeyFromDocx(buffer: Buffer): Promise<{
  answers: Map<number, { answer: string; method: string; confidence: number }>;
  images: DocxImage[];
}> {
  const content = await parseDocxXml(buffer);
  const detections = detectAnswersFromFormatting(content);
  
  const answers = new Map<number, { answer: string; method: string; confidence: number }>();
  
  for (const detection of detections) {
    answers.set(detection.questionNum, {
      answer: detection.answer,
      method: detection.method,
      confidence: detection.confidence,
    });
  }
  
  return { answers, images: content.images };
}

// ============================================
// Math Formula Detection
// ============================================

interface MathFormula {
  latex: string;
  omml: string; // Office Math Markup Language
  position: { paragraph: number; run: number };
}

/**
 * Extract math formulas from DOCX (OMML format)
 * Word stores math as w:oMath or m:oMath elements
 */
export async function extractMathFormulas(buffer: Buffer): Promise<MathFormula[]> {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  
  if (!documentXml) {
    return [];
  }
  
  const formulas: MathFormula[] = [];
  
  // Find all math elements (both namespaces) - using [\s\S] instead of . with s flag
  const mathMatches = documentXml.match(/<(?:m:|w:)?oMath[^>]*>[\s\S]*?<\/(?:m:|w:)?oMath>/g) || [];
  let paragraphIndex = 0;
  
  for (const mathMatch of mathMatches) {
    // Extract content between oMath tags
    const ommlContent = mathMatch.replace(/<\/?(?:m:|w:)?oMath[^>]*>/g, '');
    
    // Convert OMML to a simplified LaTeX-like representation
    const latex = convertOmmlToLatex(ommlContent);
    
    formulas.push({
      latex,
      omml: mathMatch,
      position: { paragraph: paragraphIndex, run: 0 },
    });
  }
  
  return formulas;
}

/**
 * Basic OMML to LaTeX converter
 * This is a simplified version - full conversion is complex
 */
function convertOmmlToLatex(omml: string): string {
  let latex = '';
  
  // Extract fractions (m:f) - using [\s\S] instead of . with s flag
  const fracMatches = omml.match(/<m:f[^>]*>[\s\S]*?<m:num[^>]*>([\s\S]*?)<\/m:num>[\s\S]*?<m:den[^>]*>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/g) || [];
  for (const fracMatch of fracMatches) {
    const numMatch = fracMatch.match(/<m:num[^>]*>([\s\S]*?)<\/m:num>/);
    const denMatch = fracMatch.match(/<m:den[^>]*>([\s\S]*?)<\/m:den>/);
    if (numMatch && denMatch) {
      const num = extractTextFromOmml(numMatch[1]);
      const den = extractTextFromOmml(denMatch[1]);
      latex += `\\frac{${num}}{${den}}`;
    }
  }
  
  // Extract superscripts (m:sSup)
  const supMatches = omml.match(/<m:sSup[^>]*>[\s\S]*?<\/m:sSup>/g) || [];
  for (const supMatch of supMatches) {
    const baseMatch = supMatch.match(/<m:e[^>]*>([\s\S]*?)<\/m:e>/);
    const expMatch = supMatch.match(/<m:sup[^>]*>([\s\S]*?)<\/m:sup>/);
    if (baseMatch && expMatch) {
      const base = extractTextFromOmml(baseMatch[1]);
      const exp = extractTextFromOmml(expMatch[1]);
      latex += `${base}^{${exp}}`;
    }
  }
  
  // Extract subscripts (m:sSub)
  const subMatches = omml.match(/<m:sSub[^>]*>[\s\S]*?<\/m:sSub>/g) || [];
  for (const subMatch of subMatches) {
    const baseMatch = subMatch.match(/<m:e[^>]*>([\s\S]*?)<\/m:e>/);
    const subPartMatch = subMatch.match(/<m:sub[^>]*>([\s\S]*?)<\/m:sub>/);
    if (baseMatch && subPartMatch) {
      const base = extractTextFromOmml(baseMatch[1]);
      const sub = extractTextFromOmml(subPartMatch[1]);
      latex += `${base}_{${sub}}`;
    }
  }
  
  // Extract square roots (m:rad)
  const radMatches = omml.match(/<m:rad[^>]*>[\s\S]*?<\/m:rad>/g) || [];
  for (const radMatch of radMatches) {
    const contentMatch = radMatch.match(/<m:e[^>]*>([\s\S]*?)<\/m:e>/);
    if (contentMatch) {
      const content = extractTextFromOmml(contentMatch[1]);
      latex += `\\sqrt{${content}}`;
    }
  }
  
  // If no special structures found, extract plain text
  if (!latex) {
    latex = extractTextFromOmml(omml);
  }
  
  return latex;
}

function extractTextFromOmml(omml: string): string {
  // Extract text from m:t elements
  const textRegex = /<m:t[^>]*>([^<]*)<\/m:t>/g;
  let text = '';
  let match;
  while ((match = textRegex.exec(omml)) !== null) {
    text += match[1];
  }
  return text;
}

// ============================================
// Special Character Handling
// ============================================

/**
 * Convert special Word characters to Unicode
 */
export function normalizeSpecialCharacters(text: string): string {
  const replacements: [string | RegExp, string][] = [
    // Common Word special characters
    [/\u2018/g, "'"],  // Left single quote
    [/\u2019/g, "'"],  // Right single quote
    [/\u201C/g, '"'],  // Left double quote
    [/\u201D/g, '"'],  // Right double quote
    [/\u2013/g, '–'],  // En dash
    [/\u2014/g, '—'],  // Em dash
    [/\u2026/g, '...'], // Ellipsis
    [/\u00A0/g, ' '],  // Non-breaking space
    [/\u200B/g, ''],   // Zero-width space
    [/\u00AD/g, ''],   // Soft hyphen
    
    // Math symbols that might be special characters
    [/\u00B2/g, '²'],  // Superscript 2
    [/\u00B3/g, '³'],  // Superscript 3
    [/\u00BC/g, '¼'],  // One quarter
    [/\u00BD/g, '½'],  // One half
    [/\u00BE/g, '¾'],  // Three quarters
    [/\u2260/g, '≠'],  // Not equal
    [/\u2264/g, '≤'],  // Less than or equal
    [/\u2265/g, '≥'],  // Greater than or equal
    [/\u00B1/g, '±'],  // Plus-minus
    [/\u00D7/g, '×'],  // Multiplication
    [/\u00F7/g, '÷'],  // Division
    [/\u221A/g, '√'],  // Square root
    [/\u03C0/g, 'π'],  // Pi
    [/\u221E/g, '∞'],  // Infinity
  ];
  
  let result = text;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  
  return result;
}
