# Hướng dẫn Import Đề thi & Câu hỏi

NEO-EDU hỗ trợ import đề thi từ file **JSON** hoặc **Excel (.xlsx)**.

---

## 📄 Định dạng JSON

### Cấu trúc file

```json
{
  "exam": {
    "title": "Đề thi Toán 12 - Kỳ 1",
    "description": "Đề thi giữa kỳ 1 năm học 2024-2025",
    "duration": 90,
    "year": 2024,
    "province": "Hà Nội",
    "school": "THPT Chu Văn An",
    "subject": "Toán",
    "type": "STANDARD",
    "parts": [
      {
        "name": "Phần 1: Trắc nghiệm",
        "order": 1,
        "questions": [
          {
            "type": "MULTIPLE_CHOICE",
            "content": "Giải phương trình: 2x + 5 = 11",
            "order": 1,
            "choices": [
              { "content": "x = 2", "isCorrect": false },
              { "content": "x = 3", "isCorrect": true },
              { "content": "x = 4", "isCorrect": false },
              { "content": "x = 5", "isCorrect": false }
            ]
          },
          {
            "type": "TRUE_FALSE_GROUP",
            "content": "Cho hàm số y = x². Xác định đúng/sai:",
            "order": 2,
            "statements": [
              { "content": "Hàm số đồng biến trên R", "isCorrect": false },
              { "content": "Đồ thị đi qua gốc tọa độ", "isCorrect": true },
              { "content": "y ≥ 0 với mọi x", "isCorrect": true },
              { "content": "Hàm số là hàm chẵn", "isCorrect": true }
            ]
          }
        ]
      }
    ]
  }
}
```

### Các trường Meta

| Trường | Bắt buộc | Mô tả |
|--------|----------|-------|
| `title` | ✅ | Tên đề thi |
| `duration` | ✅ | Thời gian làm bài (phút) |
| `description` | ❌ | Mô tả đề thi |
| `year` | ❌ | Năm thi |
| `province` | ❌ | Tỉnh/Thành phố (tên đầy đủ) |
| `school` | ❌ | Tên trường |
| `subject` | ❌ | Tên môn học |
| `type` | ❌ | Loại đề: `STANDARD`, `HSG`, `MOCK` |

### Loại câu hỏi

- **MULTIPLE_CHOICE**: Trắc nghiệm nhiều lựa chọn (sử dụng `choices`)
- **TRUE_FALSE_GROUP**: Đúng/Sai theo nhóm (sử dụng `statements`)

---

## 📊 Định dạng Excel (.xlsx)

### Cấu trúc Workbook

Tạo file Excel với **2 sheet**:

#### Sheet 1: "Metadata"

| Cột A | Cột B |
|-------|-------|
| title | Đề thi Toán 12 - Kỳ 1 |
| duration | 90 |
| year | 2024 |
| province | Hà Nội |
| school | THPT Chu Văn An |
| subject | Toán |
| type | STANDARD |

#### Sheet 2: "Questions"

| Part | Question | Type | Option | IsCorrect |
|------|----------|------|--------|-----------|
| Phần 1 | Giải phương trình: 2x + 5 = 11 | MULTIPLE_CHOICE | x = 2 | false |
| | | | x = 3 | true |
| | | | x = 4 | false |
| | | | x = 5 | false |
| Phần 1 | Cho hàm số y = x². Xác định: | TRUE_FALSE_GROUP | Hàm số đồng biến trên R | false |
| | | | Đồ thị đi qua gốc tọa độ | true |

### Quy tắc Excel

1. **Câu hỏi mới**: Điền nội dung vào cột `Question`
2. **Thêm đáp án**: Để trống cột `Question`, chỉ điền `Option` và `IsCorrect`
3. **Phần mới**: Thay đổi giá trị cột `Part`

---

## 🔄 Quy trình Import

1. **Upload file** (JSON hoặc Excel)
2. **Hệ thống phân tích**:
   - Đếm số câu hỏi
   - Kiểm tra Tỉnh/Trường/Môn có tồn tại trong DB không
3. **Xem xét mapping**:
   - ✅ **Matched**: Tự động liên kết
   - ⚠️ **Needs Selection**: Chọn từ danh sách gợi ý
   - 🆕 **Create New**: Tạo mới (chỉ cho Trường)
4. **Xác nhận & Import**

---

## ⚠️ Lưu ý

- **Tỉnh/Thành phố**: Phải khớp chính xác với danh sách 63 tỉnh thành
- **Môn học**: Phải tồn tại trong hệ thống (không tự động tạo mới)
- **Trường**: Có thể tạo mới nếu chưa tồn tại
- **Unicode**: Đảm bảo file được lưu với encoding UTF-8
