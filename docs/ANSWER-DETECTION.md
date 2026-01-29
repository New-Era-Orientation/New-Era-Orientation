# Exam Parser - Hướng dẫn xử lý đáp án

## Tổng quan

Document này mô tả các cách đánh dấu đáp án đúng trong file DOCX và cách parser xử lý.

## Các phương pháp đánh dấu đáp án

Giáo viên có thể đánh dấu đáp án đúng bằng nhiều cách khác nhau:

### 1. **Màu chữ (w:color)**
- **Đỏ (FF0000)**: Phổ biến nhất - 78+ lần trong file Bạc Liêu
- **Xanh dương (0000FF)**: Ít phổ biến hơn
- **Xanh lá (00FF00)**: Hiếm

### 2. **Highlight/Tô nền (w:highlight)**
- **Yellow**: Phổ biến
- **Cyan**: Có trong một số file
- **Green**: Hiếm

### 3. **Bold (w:b)**
- Đáp án được in đậm
- Confidence thấp hơn vì có thể bold để nhấn mạnh

### 4. **Underline (w:u)**  
- Gạch chân đáp án đúng
- Confidence thấp nhất

### 5. **Bảng đáp án cuối đề**
- Format: "1-A, 2-B, 3-C..."
- Hoặc bảng với cột Câu | Đáp án

## Cấu trúc đề thi

### Phần I: Trắc nghiệm nhiều lựa chọn (Câu 1-28)
- 4 đáp án: A, B, C, D
- Chỉ 1 đáp án đúng

### Phần II: Đúng/Sai (Câu 1-4 hoặc 4-7)
- Mỗi câu có 4 ý nhỏ: a), b), c), d)  
- Mỗi ý có thể Đúng hoặc Sai
- Đáp án được đánh dấu riêng cho từng ý

## Implementation

### Files chính:
- `src/lib/docx-xml-parser.ts`: Parse trực tiếp DOCX XML để detect highlight, color
- `src/app/api/admin/exam-editor/parse/route.ts`: API endpoint với multi-method detection

### Priority detection:
1. Answer table > 
2. XML highlight >
3. XML color (red/blue) >
4. HTML styling >
5. Bold/Underline

### Stats trả về:
```json
{
  "stats": {
    "questionCount": 40,
    "withAnswers": 38,
    "answersFromText": 5,
    "answersFromHtmlStyling": 10,
    "answersFromXmlParsing": 23,
    "answersFromTable": 0
  }
}
```

## Test files phân tích

| File | Màu đỏ | Highlight | Bold | Ghi chú |
|------|--------|-----------|------|---------|
| BẠC LIÊU - ĐÁP ÁN.docx | 78x FF0000 | 0 | 105 | Đáp án tô đỏ |
| test-answer.docx | 98x FF0000 | 1x yellow | 107 | Đỏ + 1 highlight |
| test-answer2.docx | 82x FF0000 | 0 | 153 | Đáp án tô đỏ |

## Known Issues

1. **Phần II Đúng/Sai**: Mỗi câu có nhiều đáp án đỏ (a,b,c,d đều có thể đúng)
2. **Formatting không nhất quán**: Một số file đánh dấu cả nội dung, không chỉ label
3. **mammoth không hỗ trợ highlight**: Cần parse XML trực tiếp

## Scripts hỗ trợ

- `scripts/analyze-answer-markers.js`: Phân tích các cách đánh dấu trong file DOCX
- `scripts/test-answer-detection.js`: Test parser với các file mẫu
