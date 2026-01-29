/**
 * Test script to analyze answer detection from DOCX files
 * Run with: node scripts/test-answer-detection.js
 */

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

// ============================================
// Simple XML Parser (same logic as docx-xml-parser.ts)
// ============================================

async function parseDocxXml(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml')?.async('string');
  
  if (!documentXml) {
    throw new Error('Invalid DOCX: no document.xml found');
  }
  
  const paragraphs = [];
  const paragraphMatches = documentXml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || [];
  
  for (const pMatch of paragraphMatches) {
    const paragraphXml = pMatch.replace(/<\/?w:p[^>]*>/g, '');
    const runs = [];
    
    const runMatches = paragraphXml.match(/<w:r[^>]*>[\s\S]*?<\/w:r>/g) || [];
    
    for (const rMatch of runMatches) {
      const runXml = rMatch;
      const run = { text: '' };
      
      // Extract text content
      const textMatch = runXml.match(/<w:t[^>]*>([^<]*)<\/w:t>/);
      if (textMatch) {
        run.text = textMatch[1];
      }
      
      // Extract formatting
      const propsMatch = runXml.match(/<w:rPr[^>]*>([\s\S]*?)<\/w:rPr>/);
      if (propsMatch) {
        const propsXml = propsMatch[1];
        
        if (/<w:b(?:\s|\/|>)/.test(propsXml)) run.bold = true;
        if (/<w:i(?:\s|\/|>)/.test(propsXml)) run.italic = true;
        if (/<w:u(?:\s|\/|>)/.test(propsXml)) run.underline = true;
        
        const highlightMatch = propsXml.match(/<w:highlight\s+w:val="([^"]+)"/);
        if (highlightMatch) run.highlight = highlightMatch[1];
        
        const colorMatch = propsXml.match(/<w:color\s+w:val="([^"]+)"/);
        if (colorMatch && colorMatch[1] !== 'auto') run.color = colorMatch[1];
      }
      
      if (run.text) runs.push(run);
    }
    
    const fullText = runs.map(r => r.text).join('');
    if (fullText.trim()) {
      paragraphs.push({ runs, fullText });
    }
  }
  
  return { paragraphs };
}

// ============================================
// Answer Detection
// ============================================

function detectAnswers(content) {
  const detections = [];
  let currentQuestion = 0;
  
  for (const paragraph of content.paragraphs) {
    const text = paragraph.fullText;
    
    // Detect question number
    const questionMatch = text.match(/C[âaà]u\s*(\d+)/i);
    if (questionMatch) {
      currentQuestion = parseInt(questionMatch[1]);
    }
    
    if (currentQuestion === 0) continue;
    
    // Method 1: Check for styled choice labels (A. B. C. D.)
    for (const run of paragraph.runs) {
      const choiceMatch = run.text.match(/^([A-D])\s*[.)]/i);
      if (choiceMatch) {
        const label = choiceMatch[1].toUpperCase();
        
        if (run.color && run.color.toUpperCase() === 'FF0000') {
          detections.push({
            question: currentQuestion,
            answer: label,
            method: 'color:red',
            text: run.text.substring(0, 30)
          });
        } else if (run.highlight) {
          detections.push({
            question: currentQuestion,
            answer: label,
            method: `highlight:${run.highlight}`,
            text: run.text.substring(0, 30)
          });
        }
      }
    }
    
    // Method 2: Check if ANY part of paragraph with choice has red color
    // Find which choices are in this paragraph
    const paragraphChoices = text.match(/[A-D]\s*[.)]/g) || [];
    
    for (const run of paragraph.runs) {
      if (run.color && run.color.toUpperCase() === 'FF0000') {
        // This run is red - find which choice it belongs to
        const runChoiceMatch = run.text.match(/([A-D])\s*[.)]/i);
        if (runChoiceMatch) {
          const label = runChoiceMatch[1].toUpperCase();
          const exists = detections.find(d => d.question === currentQuestion && d.answer === label);
          if (!exists) {
            detections.push({
              question: currentQuestion,
              answer: label,
              method: 'color:red-content',
              text: run.text.substring(0, 50)
            });
          }
        }
      }
    }
  }
  
  // Deduplicate
  const unique = new Map();
  for (const d of detections) {
    const key = `${d.question}-${d.answer}`;
    if (!unique.has(key)) {
      unique.set(key, d);
    }
  }
  
  return Array.from(unique.values());
}

// ============================================
// Main Test
// ============================================

async function testFile(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log('File:', path.basename(filePath));
  console.log('='.repeat(60));
  
  try {
    const buffer = fs.readFileSync(filePath);
    const content = await parseDocxXml(buffer);
    const detections = detectAnswers(content);
    
    console.log(`\nParagraphs parsed: ${content.paragraphs.length}`);
    console.log(`Answers detected: ${detections.length}`);
    
    if (detections.length > 0) {
      console.log('\nSample detections:');
      for (const d of detections.slice(0, 15)) {
        console.log(`  Câu ${d.question}: ${d.answer} [${d.method}]`);
      }
      if (detections.length > 15) {
        console.log(`  ... and ${detections.length - 15} more`);
      }
    } else {
      // Debug: show some paragraphs with formatting
      console.log('\nDebug - Paragraphs with formatting:');
      let count = 0;
      for (const para of content.paragraphs) {
        for (const run of para.runs) {
          if (run.color || run.highlight || run.bold) {
            console.log(`  [${run.color || run.highlight || 'bold'}] "${run.text.substring(0, 40)}..."`);
            count++;
            if (count >= 10) break;
          }
        }
        if (count >= 10) break;
      }
    }
    
    return detections.length;
  } catch (e) {
    console.log('Error:', e.message);
    return 0;
  }
}

async function main() {
  const baseDir = path.join(__dirname, '..');
  
  const testFiles = [
    path.join(baseDir, 'test-baclieu.docx'),
    path.join(baseDir, 'test-exam.docx'),
    path.join(baseDir, 'test-answer.docx'),
    path.join(baseDir, 'test-answer2.docx'),
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      await testFile(file);
    }
  }
}

main().catch(console.error);
