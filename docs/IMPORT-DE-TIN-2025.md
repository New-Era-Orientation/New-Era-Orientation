# Import Ngân Hàng Đề Tin Học 2025

## Tổng Quan

Script import đề thi Tin học THPT từ folder ngân hàng đề 2025 vào database NEO Education.

**Tính năng chính:**
- Scan và phân loại đề thi theo tỉnh/thành
- Parse nội dung đề từ file DOCX
- **Trích xuất hình ảnh** từ đề thi
- **Phát hiện và chuyển đổi công thức LaTeX**
- Matching tự động file đề với file đáp án

## Cấu Trúc File

```
scripts/
├── import-de-tin-2025.cjs      # Script chính (scan, parse, stats)
├── parse-tin-hoc-exam.ts       # Module parse đề thi (TypeScript)
├── import-exam-bank.ts         # Import batch vào database
├── scan-exam-folder.cjs        # Scan folder đơn giản
└── test-parse-exam.cjs         # Test parse 1 file

data/
├── de-tin-2025-scan.json       # Kết quả scan
└── exam-tin-hoc-template.json  # Template JSON đề thi
```

## Commands

### 1. Scan Ngân Hàng Đề

Scan folder và hiển thị danh sách đề thi với thống kê.

```bash
node scripts/import-de-tin-2025.cjs scan "C:\path\to\2025"
```

Output:
- Danh sách đề theo tỉnh/thành
- Trạng thái có/không có đáp án
- Thống kê tổng hợp
- Lưu kết quả vào `data/de-tin-2025-scan.json`

### 2. Parse 1 File Đề

Parse file docx và xuất JSON.

```bash
# Parse cơ bản (chỉ text)
node scripts/import-de-tin-2025.cjs parse "exam.docx"

# Parse với hình ảnh và công thức LaTeX
node scripts/import-de-tin-2025.cjs parse -m "exam.docx"
node scripts/import-de-tin-2025.cjs parse --with-media "exam.docx"
```

**Output cơ bản:**
- Thông tin metadata (tỉnh, mã đề, lần thi)
- Số câu hỏi Part 1, Part 2
- Số câu có đáp án
- Mẫu câu hỏi
- Lưu kết quả vào `<filename>-parsed.json`

**Output với media (-m):**
- Tất cả thông tin trên, cộng thêm:
- 🖼️ Số hình ảnh tìm thấy
- 📐 Số câu hỏi có công thức
- Hình ảnh lưu vào folder `images/`
- Lưu kết quả vào `<filename>-parsed-media.json`

### 3. Xem Thống Kê

Hiển thị thống kê từ file scan đã lưu.

```bash
node scripts/import-de-tin-2025.cjs stats
```

### 4. Import Vào Database

(Cần cấu hình DATABASE_URL)

```bash
npx tsx scripts/import-exam-bank.ts import "C:\path\to\2025"
```

## Hỗ Trợ Hình Ảnh và Công Thức

### Trích Xuất Hình Ảnh

Khi dùng flag `-m` hoặc `--with-media`:

1. **Hình ảnh** trong file DOCX được:
   - Trích xuất và gán ID unique (MD5 hash)
   - Chuyển thành base64 hoặc lưu file riêng
   - Liên kết với câu hỏi tương ứng

2. **Format hình ảnh hỗ trợ:**
   - PNG, JPEG, GIF, BMP, WMF, EMF

3. **Output:**
   - Hình ảnh lưu trong folder `images/`
   - JSON chứa reference đến các hình ảnh

### Công Thức LaTeX

Script tự động phát hiện và chuyển đổi các pattern:

| Pattern Input | LaTeX Output |
|--------------|--------------|
| `O(n)`, `O(n²)` | `$O(n)$`, `$O(n²)$` |
| `2^n`, `n^2` | `$2^{n}$`, `$n^{2}$` |
| `log2(n)`, `log(n)` | `$\log_{2}(n)$`, `$\log(n)$` |
| `a_i`, `A_n` | `$a_{i}$`, `$A_{n}$` |
| `1/2`, `3/4` | `$\frac{1}{2}$`, `$\frac{3}{4}$` |
| `≤`, `≥`, `≠` | `$\leq$`, `$\geq$`, `$\neq$` |
| `→`, `←`, `↔` | `$\rightarrow$`, `$\leftarrow$`, `$\leftrightarrow$` |
| `∈`, `∧`, `∨` | `$\in$`, `$\land$`, `$\lor$` |

### Cấu Trúc JSON Output (Media Mode)

```json
{
  "filePath": "exam.docx",
  "province": "An Giang",
  "questionCount": 28,
  "totalImages": 18,
  "questionsWithImages": 7,
  "questionsWithFormulas": 1,
  "questions": [
    {
      "order": 1,
      "content": "Cho đoạn mã HTML...",
      "images": ["img_d0b07c35.png", "img_e030b972.png"],
      "formulas": [
        {"type": "latex", "content": "O(n)", "raw": "O(n)"}
      ],
      "choices": [...],
      "correctAnswer": "A"
    }
  ],
  "images": [
    {"id": "img_d0b07c35.png", "contentType": "image/png", "path": "images/img_d0b07c35.png"}
  ]
}
```

## Cấu Trúc Đề Thi THPT Tin Học 2025

### Phần 1: Trắc nghiệm nhiều lựa chọn (24 câu - 6 điểm)
- 24 câu × 0.25 điểm
- Track: COMMON (chung cho tất cả)

### Phần 2: Trắc nghiệm đúng sai (6 câu - 4 điểm)
- **2A. Phần chung** (bắt buộc): Câu 1-2 (2 điểm)
- **2B. Phần riêng** (chọn 1):
  - KHMT (Khoa học máy tính): Câu 3-4 (2 điểm)
  - THUD (Tin học ứng dụng): Câu 5-6 (2 điểm)

## Định Dạng File Đề Thi

### File Đề
- `.docx` hoặc `.doc`
- Tên file: `<TÊN_TỈNH>.docx`, `<TÊN_TỈNH> LẦN <N>.docx`, `<TÊN> - MĐỀ <CODE>.docx`
- Ví dụ: `BẮC GIANG.docx`, `CẦN THƠ LẦN 1 - MĐỀ 5425.docx`

### File Đáp Án
- Tên tương tự file đề + suffix: `-ĐA`, `-ĐÁP ÁN`, `- ĐA`
- Ví dụ: `BẮC GIANG-ĐA.docx`, `CẦN THƠ LẦN 1 - MĐỀ 5425 - ĐÁP ÁN.docx`

### Inline Answers
Một số đề có đáp án tích hợp trong file đề dạng:
```
Đáp án đúng: A
```

## Mapping Tỉnh/Thành

Script tự động nhận diện tỉnh/thành từ:
1. Đường dẫn folder
2. Tên file (cả tiếng Việt có dấu và không dấu)
3. Pattern "SỞ <TÊN>"

Hỗ trợ 63 tỉnh/thành Việt Nam.

## Database Schema

### Bảng chính:
- `exams` - Thông tin đề thi
- `questions` - Câu hỏi
- `question_options` - Các lựa chọn/mệnh đề
- `exam_questions` - Liên kết exam-question

### Question Types:
- `MULTIPLE_CHOICE` - Trắc nghiệm
- `TRUE_FALSE_GROUP` - Đúng sai nhóm

## Troubleshooting

### Unicode Issues
Nếu gặp vấn đề hiển thị tiếng Việt:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

### Module Not Found
```bash
npm install
```

### Database Connection
Kiểm tra file `.env`:
```
DATABASE_URL=postgresql://...
```

## Thống Kê Ngân Hàng Đề 2025

- **Tổng số đề**: 96
- **Đề Sở GD&ĐT**: 0
- **Đề các trường**: 96  
- **Có đáp án**: 44 (46%)
- **Số tỉnh/thành**: 10+

---

Cập nhật: 2025-01-27
