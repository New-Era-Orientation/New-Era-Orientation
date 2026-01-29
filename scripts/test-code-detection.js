/**
 * Test code detection and table-style choices parsing
 */

const testCases = [
  // Test 1: Table-style choices (A B on same line, C D on same line)
  {
    name: 'Table-style choices',
    input: `Câu 1. Kết quả của biểu thức sau?
A. 10 B. 20
C. 30 D. 40`,
    expected: 'Should split A/B and C/D into separate lines'
  },
  
  // Test 2: Python code detection
  {
    name: 'Python code detection',
    input: `Câu 2. Cho hàm Python sau:
def find(x, a, n):
  for i in range(n):
    if a[i] == x:
      return True
  return False
A. O(1)
B. O(n)
C. O(n²)
D. O(log n)`,
    expected: 'Should detect Python keywords'
  },
  
  // Test 3: C++ code detection
  {
    name: 'C++ code detection',
    input: `Câu 3. Cho hàm C++ sau:
int find(int x, int a[], int n) {
  for (int i=0; i<n; i++) {
    if (a[i]==x) return i;
  }
  return -1;
}
A. Tìm kiếm tuyến tính
B. Tìm kiếm nhị phân`,
    expected: 'Should detect C++ keywords'
  },
  
  // Test 4: SQL code detection
  {
    name: 'SQL code detection',
    input: `Câu 4. Câu lệnh SQL nào đúng?
SELECT * FROM students WHERE age > 18
A. Đúng
B. Sai`,
    expected: 'Should detect SQL keywords'
  },
  
  // Test 5: HTML/CSS code detection
  {
    name: 'HTML/CSS code detection',
    input: `Câu 5. Đoạn mã HTML sau có tác dụng gì?
<div style="color: red; font-size: 20px;">Hello</div>
A. Chữ màu đỏ
B. Chữ màu xanh`,
    expected: 'Should detect HTML/CSS keywords'
  },
  
  // Test 6: Code header with language pairing (Python + C++)
  {
    name: 'Code language pairing',
    input: `Câu 6. Hàm viết bằng ngôn ngữ Python
def sum(a, n):
  return sum(a)
Hàm viết bằng ngôn ngữ C++
int sum(int a[], int n) {
  int s = 0;
  for (int i=0; i<n; i++) s += a[i];
  return s;
}
A. Tính tổng
B. Tính trung bình`,
    expected: 'Should detect paired Python/C++ code blocks'
  },
];

// Code language patterns
const CODE_LANGUAGE_PATTERNS = {
  python: [
    /\bdef\s+\w+\s*\(/i,
    /\bprint\s*\(/i,
    /\bfor\s+\w+\s+in\s+/i,
    /\bimport\s+\w+/i,
    /\bfrom\s+\w+\s+import/i,
    /\brange\s*\(/i,
    /\blen\s*\(/i,
    /\breturn\s+/i,
    /:\s*$/m,
    /\bTrue\b|\bFalse\b|\bNone\b/,
  ],
  cpp: [
    /\bint\s+\w+\s*[=(]/i,
    /\bvoid\s+\w+\s*\(/i,
    /\bcout\s*<</i,
    /\bcin\s*>>/i,
    /\b#include\s*</i,
    /\busing\s+namespace\s+std/i,
    /\bfor\s*\(\s*int/i,
    /\breturn\s+0\s*;/i,
    /\bbool\s+\w+/i,
    /\{\s*$/m,
  ],
  sql: [
    /\bSELECT\s+/i,
    /\bFROM\s+\w+/i,
    /\bWHERE\s+/i,
    /\bINSERT\s+INTO/i,
    /\bUPDATE\s+\w+\s+SET/i,
    /\bDELETE\s+FROM/i,
    /\bCREATE\s+TABLE/i,
  ],
  html: [
    /<html[^>]*>/i,
    /<div[^>]*>/i,
    /<p[^>]*>/i,
    /<a\s+href=/i,
    /<\/\w+>/,
  ],
  css: [
    /\{[^}]*:[^}]*;[^}]*\}/,
    /\bcolor\s*:/i,
    /\bfont-size\s*:/i,
    /\bbackground(-color)?\s*:/i,
  ],
};

function detectCodeLanguage(text) {
  const results = {};
  for (const [lang, patterns] of Object.entries(CODE_LANGUAGE_PATTERNS)) {
    const matches = patterns.filter(p => p.test(text));
    if (matches.length > 0) {
      results[lang] = matches.length;
    }
  }
  return results;
}

function normalizeTableChoices(text) {
  return text
    // Handle table-style choices: "A. content1 B. content2" -> separate lines
    .replace(/([A-D])\.\s*(.+?)\s+([A-D])\.\s*/g, '$1. $2\n$3. ');
}

console.log('=== CODE DETECTION TESTS ===\n');

for (const test of testCases) {
  console.log(`--- ${test.name} ---`);
  console.log(`Expected: ${test.expected}`);
  
  const detected = detectCodeLanguage(test.input);
  console.log('Detected languages:', JSON.stringify(detected));
  
  if (test.name === 'Table-style choices') {
    const normalized = normalizeTableChoices(test.input);
    console.log('\nNormalized:');
    console.log(normalized);
  }
  
  console.log('\n');
}

// Test table normalization specifically
console.log('=== TABLE CHOICES NORMALIZATION ===\n');
const tableInput = `A. True B. False
C. 10 D. 20`;
console.log('Input:', tableInput);
console.log('Output:', normalizeTableChoices(tableInput));
