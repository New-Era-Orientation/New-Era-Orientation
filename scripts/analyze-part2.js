/**
 * Analyze Part II (True/False) format and Code detection in DOCX files
 */

const fs = require('fs');
const mammoth = require('mammoth');

const CODE_LANGUAGE_PATTERNS = {
  python: [
    /\bdef\s+\w+\s*\(/i,
    /\bprint\s*\(/i,
    /\bfor\s+\w+\s+in\s+/i,
    /\brange\s*\(/i,
    /\breturn\s+/i,
    /\bTrue\b|\bFalse\b|\bNone\b/,
  ],
  cpp: [
    /\bint\s+\w+\s*[=(]/i,
    /\bvoid\s+\w+\s*\(/i,
    /\bcout\s*<</i,
    /\bfor\s*\(\s*int/i,
    /\breturn\s+\d+\s*;/i,
    /\bbool\s+\w+/i,
  ],
};

const CODE_HEADER_PATTERNS = [
  /h[àa]m\s+vi[ếe]t\s+b[ằa]ng\s+ng[ôo]n\s+ng[ữu]\s*(Python|C\+\+)/iu,
  /ng[ôo]n\s+ng[ữu]\s*(Python|C\+\+|SQL)/iu,
];

async function analyze() {
  const buffer = fs.readFileSync('test-baclieu.docx');
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;
  
  console.log('=== CODE HEADERS FOUND ===');
  for (const pattern of CODE_HEADER_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, 'giu');
    const matches = text.match(globalPattern);
    if (matches) {
      console.log('Matches:', matches);
    }
  }
  
  console.log('\n=== CODE SAMPLES ===');
  // Find text containing code keywords
  const chunks = text.split(/Câu\s*\d+/i);
  let codeChunkCount = 0;
  
  for (let i = 0; i < chunks.length && codeChunkCount < 5; i++) {
    const chunk = chunks[i];
    for (const [lang, patterns] of Object.entries(CODE_LANGUAGE_PATTERNS)) {
      const matchCount = patterns.filter(p => p.test(chunk)).length;
      if (matchCount >= 2) {
        console.log('\n--- Chunk', i, '(' + lang + ', matches:', matchCount + ') ---');
        console.log(chunk.substring(0, 500));
        codeChunkCount++;
        break;
      }
    }
  }
  
  // Check for table-style choices
  console.log('\n=== TABLE-STYLE CHOICES ===');
  const tablePattern = /([A-D])\.\s*.+?\s+([A-D])\.\s*/g;
  const tableMatches = text.match(tablePattern);
  if (tableMatches) {
    console.log('Found', tableMatches.length, 'potential table-style choice lines');
    console.log('Examples:', tableMatches.slice(0, 5));
  }
}
analyze();
