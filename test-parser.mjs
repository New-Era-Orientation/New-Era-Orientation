/**
 * Test the XML parser with real DOCX files
 */

import { extractAnswerKeyFromDocx } from './src/lib/docx-xml-parser.ts';
import fs from 'fs';

async function testParser(filePath) {
  console.log('\n' + '='.repeat(60));
  console.log('Testing:', filePath);
  console.log('='.repeat(60));
  
  const buffer = fs.readFileSync(filePath);
  
  try {
    const { answers, images } = await extractAnswerKeyFromDocx(buffer);
    
    console.log('\nDetected Answers:');
    if (answers.size === 0) {
      console.log('  No answers detected!');
    } else {
      const sorted = [...answers.entries()].sort((a, b) => a[0] - b[0]);
      for (const [qNum, info] of sorted.slice(0, 20)) {
        console.log(`  Câu ${qNum}: ${info.answer} [${info.method}, confidence: ${info.confidence}]`);
      }
      if (answers.size > 20) {
        console.log(`  ... and ${answers.size - 20} more`);
      }
    }
    
    console.log('\nImages:', images.length);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

async function main() {
  // Test files
  const testFiles = [
    './test-baclieu.docx',
    './test-exam.docx', 
    './test-answer.docx',
    './test-answer2.docx',
  ];
  
  for (const file of testFiles) {
    if (fs.existsSync(file)) {
      await testParser(file);
    }
  }
}

main().catch(console.error);
