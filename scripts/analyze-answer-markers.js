/**
 * Analyze DOCX files to understand how correct answers are marked
 */

const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');

async function analyzeFile(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log('Analyzing:', path.basename(filePath));
  console.log('='.repeat(60));
  
  const buffer = fs.readFileSync(filePath);
  const zip = await JSZip.loadAsync(buffer);
  const xml = await zip.file('word/document.xml').async('string');
  
  // 1. Color patterns
  console.log('\n--- COLOR PATTERNS ---');
  const colorMatches = xml.match(/<w:color[^>]+>/g) || [];
  const colorCounts = {};
  colorMatches.forEach(m => { colorCounts[m] = (colorCounts[m] || 0) + 1; });
  Object.entries(colorCounts).forEach(([k, v]) => console.log(`  ${v}x: ${k}`));
  
  // 2. Highlight patterns
  console.log('\n--- HIGHLIGHT PATTERNS ---');
  const hlMatches = xml.match(/<w:highlight[^>]+>/g) || [];
  if (hlMatches.length > 0) {
    const hlCounts = {};
    hlMatches.forEach(m => { hlCounts[m] = (hlCounts[m] || 0) + 1; });
    Object.entries(hlCounts).forEach(([k, v]) => console.log(`  ${v}x: ${k}`));
  } else {
    console.log('  None found');
  }
  
  // 3. Shading patterns (another way to highlight)
  console.log('\n--- SHADING PATTERNS ---');
  const shdMatches = xml.match(/<w:shd[^>]+>/g) || [];
  if (shdMatches.length > 0) {
    const shdCounts = {};
    shdMatches.forEach(m => { shdCounts[m] = (shdCounts[m] || 0) + 1; });
    Object.entries(shdCounts).slice(0, 5).forEach(([k, v]) => console.log(`  ${v}x: ${k}`));
  } else {
    console.log('  None found');
  }
  
  // 4. Bold count
  console.log('\n--- FORMATTING COUNTS ---');
  console.log('  Bold:', (xml.match(/<w:b\/>/g) || []).length);
  console.log('  Bold w:val=1:', (xml.match(/<w:b w:val="1"\/>/g) || []).length);
  console.log('  Underline:', (xml.match(/<w:u /g) || []).length);
  console.log('  Italic:', (xml.match(/<w:i\/>/g) || []).length);
  
  // 5. Extract samples of colored text
  console.log('\n--- COLORED TEXT SAMPLES ---');
  
  // Find paragraphs with Câu X pattern
  const paragraphs = xml.match(/<w:p[^>]*>[\s\S]*?<\/w:p>/g) || [];
  let sampleCount = 0;
  
  for (const para of paragraphs) {
    const fullText = extractText(para);
    const questionMatch = fullText.match(/Câu\s*(\d+)/i);
    
    if (questionMatch) {
      const qNum = questionMatch[1];
      
      // Check for colored runs in this paragraph
      const runs = para.match(/<w:r[^>]*>[\s\S]*?<\/w:r>/g) || [];
      for (const run of runs) {
        const hasColor = run.match(/<w:color w:val="([^"]+)"/);
        const hasHighlight = run.match(/<w:highlight w:val="([^"]+)"/);
        const hasBold = run.includes('<w:b/>') || run.includes('<w:b ');
        const text = extractText(run);
        
        // Check if this is a choice label (A, B, C, D)
        const choiceMatch = text.match(/^([A-D])[.)]/);
        
        if (choiceMatch && (hasColor || hasHighlight || hasBold)) {
          const markers = [];
          if (hasColor) markers.push(`color:${hasColor[1]}`);
          if (hasHighlight) markers.push(`highlight:${hasHighlight[1]}`);
          if (hasBold) markers.push('bold');
          
          console.log(`  Câu ${qNum}: ${choiceMatch[1]} [${markers.join(', ')}]`);
          sampleCount++;
        }
      }
      
      if (sampleCount >= 10) break;
    }
  }
  
  // 6. Look for answer table at end
  console.log('\n--- ANSWER TABLE CHECK ---');
  const tableMatch = xml.match(/<w:tbl[\s\S]*?<\/w:tbl>/g);
  if (tableMatch) {
    console.log(`  Found ${tableMatch.length} table(s)`);
    // Check if last table looks like answer key
    const lastTable = tableMatch[tableMatch.length - 1];
    const tableText = extractText(lastTable);
    if (tableText.match(/1\s*[A-D]/i) || tableText.match(/đáp án/i)) {
      console.log('  Last table might be answer key');
      console.log('  Sample:', tableText.substring(0, 200));
    }
  } else {
    console.log('  No tables found');
  }
  
  return {
    colors: colorCounts,
    highlights: hlMatches.length,
    bold: (xml.match(/<w:b\/>/g) || []).length,
  };
}

function extractText(xmlFragment) {
  const matches = xmlFragment.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [];
  return matches.map(m => m.replace(/<[^>]+>/g, '')).join('');
}

async function main() {
  const testFiles = [
    'test-baclieu.docx',
    'test-exam.docx',
    'test-answer.docx',
    'test-answer2.docx',
  ];
  
  for (const file of testFiles) {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      try {
        await analyzeFile(filePath);
      } catch (e) {
        console.log(`Error analyzing ${file}:`, e.message);
      }
    }
  }
  
  // Also analyze a few more files from 2025 folder
  console.log('\n\n' + '='.repeat(60));
  console.log('ANALYZING MORE FILES FROM 2025 FOLDER');
  console.log('='.repeat(60));
  
  const base2025 = 'C:\\Users\\YAYSOOSWhite\\Documents\\GitHub\\De-tin-2025\\2025';
  const allDocx = [];
  
  function findDocx(dir) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          findDocx(fullPath);
        } else if (item.name.endsWith('.docx') && item.name.includes('ĐÁP ÁN')) {
          allDocx.push(fullPath);
        }
      }
    } catch (e) {
      // Ignore access errors
    }
  }
  
  findDocx(base2025);
  
  // Analyze first 5 answer files
  const answerSummary = {};
  for (const file of allDocx.slice(0, 8)) {
    try {
      const result = await analyzeFile(file);
      const key = Object.keys(result.colors)
        .filter(c => !c.includes('000000') && !c.includes('auto'))
        .join(', ') || 'no-special-color';
      answerSummary[key] = (answerSummary[key] || 0) + 1;
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY: Color patterns found in answer files');
  console.log('='.repeat(60));
  Object.entries(answerSummary).forEach(([k, v]) => {
    console.log(`  ${v} files: ${k}`);
  });
}

main().catch(console.error);
