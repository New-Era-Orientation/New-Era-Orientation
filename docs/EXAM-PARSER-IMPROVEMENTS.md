# Giải pháp xử lý đáp án đúng, hình ảnh, ký tự đặc biệt

## 1. Vấn đề hiện tại

### Đáp án đúng
- Mammoth chuyển DOCX sang HTML nhưng **không giữ được highlight/background color**
- Các cách đánh dấu đáp án thường gặp:
  - **In đậm** (`<strong>`) ✅ Detect được
  - **Tô màu chữ** (đỏ, xanh lá) - Một số detect được
  - **Highlight/tô nền** ❌ Không detect được 
  - **Gạch chân** (`<u>`) ✅ Detect được
  - **Bảng đáp án riêng** ở cuối file

### Hình ảnh
- Mammoth extract được hình ảnh ✅
- Nhưng chưa gắn hình với câu hỏi cụ thể ❌

### Ký tự đặc biệt  
- HTML entities (`&lt;`, `&gt;`) ✅ Được chuyển đổi
- Math formulas (fractions, superscript) - Có thể mất định dạng

## 2. Giải pháp đề xuất

### A. Detect đáp án đúng từ HTML

```typescript
interface AnswerMarker {
  type: 'bold' | 'underline' | 'color' | 'highlight' | 'table';
  confidence: number;
}

function detectCorrectAnswers(html: string, questions: Question[]): Question[] {
  // 1. Check for bold choice labels: <strong>A.</strong>
  // 2. Check for underlined choices: <u>A. content</u>
  // 3. Check for colored text: style="color:red"
  // 4. Check for answer table at end of document
  // 5. Check for "Đáp án: A" pattern in text
}
```

### B. Sử dụng Office Open XML trực tiếp

Thay vì dùng mammoth, parse trực tiếp file DOCX (là ZIP chứa XML):

```typescript
import JSZip from 'jszip';
import { parseStringPromise } from 'xml2js';

async function parseDocxDirectly(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const doc = await parseStringPromise(documentXml);
  
  // Parse w:highlight for background color
  // Parse w:color for text color  
  // Parse w:b for bold
  // Parse w:u for underline
}
```

### C. Gắn hình ảnh với câu hỏi

```typescript
function associateImagesWithQuestions(html: string, images: Map, questions: Question[]) {
  // Parse HTML to find image positions relative to question numbers
  // If image appears between "Câu X" and "Câu X+1", associate with question X
}
```

### D. Manual correction trong Editor

Thêm tính năng cho người dùng:
- Click vào đáp án để đánh dấu đúng/sai
- Kéo thả hình ảnh vào câu hỏi tương ứng
- Preview và chỉnh sửa trước khi import

## 3. Implementation Plan

### Phase 1: Cải thiện detection (Quick wins)
- [ ] Detect bold answer labels `<strong>A.</strong>`
- [ ] Detect answer table at end
- [ ] Detect "Đáp án:" pattern
- [ ] Parse HTML entities properly

### Phase 2: Direct DOCX parsing
- [ ] Install jszip, xml2js
- [ ] Parse document.xml for styling info
- [ ] Extract highlight/background colors
- [ ] Extract text colors

### Phase 3: Image association
- [ ] Track image positions in HTML
- [ ] Associate with nearest question
- [ ] Allow manual reassignment in editor

### Phase 4: Editor enhancements
- [ ] Visual answer marking (click to toggle)
- [ ] Image drag-drop to questions
- [ ] Preview mode before import

## 4. Text Normalization (Implemented)

### Part 1: Multiple Choice (A, B, C, D)
- Pattern: `([.?])([A-D])\.` → Add newline before choice label
- Pattern: `([)>])([A-D])\.` → Handle HTML closing tags before choices
- Pattern: `(Vietnamese letter)([A-D])\.` → Handle choices without space

### Part 2: True/False Statements (a, b, c, d)  
- Pattern: `([.?!:])\s*([a-d])\)` → Add newline before statement label
- Pattern: `(Vietnamese letter)([a-d])\)` → Handle statements without space
- Whitespace normalization: `[^\S\n]+` → single space (preserve newlines)

### Instruction Keywords (Skip these lines)
Parser skips lines matching:
- `Thí sinh trả lời/chọn/làm` - Exam instructions
- `Trong mỗi ý` - Part 2 format explanation
- `chọn đúng hoặc sai` - True/False instructions
- `Phần riêng/chung` - Section headers
- `Định hướng` - Orientation headers
- `Thí sinh chỉ chọn` - Selection instructions
- `Chọn một trong` - Choice instructions

### True/False Introduction Keywords
These phrases introduce a/b/c/d statements:
- `Dưới đây là một số nhận xét` 
- `Một số người/học sinh nhận xét`
- `nhận xét sau/dưới đây`
- `các ý kiến sau`
