# 📚 Hướng dẫn Import/Export Dữ liệu

> Quản lý đề thi, câu hỏi và nội dung học tập trong NEO-EDU

---

## 🎯 Tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                    LUỒNG DỮ LIỆU                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   📁 File JSON/Excel                                    │
│         │                                               │
│         ▼                                               │
│   ┌─────────────┐    ┌─────────────┐                   │
│   │   IMPORT    │───▶│  DATABASE   │                   │
│   │   Phân tích │    │  PostgreSQL │                   │
│   │   + Mapping │    └──────┬──────┘                   │
│   └─────────────┘           │                          │
│                             ▼                          │
│                    ┌─────────────┐                     │
│                    │   EXPORT    │───▶ 📁 File        │
│                    │  JSON/Excel │                     │
│                    └─────────────┘                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📥 IMPORT - Nhập dữ liệu

### Bước 1: Chuẩn bị file

#### 📄 Định dạng JSON (Khuyến nghị)

```json
{
  "exam": {
    "title": "Đề thi Toán 12 - Giữa kỳ 1",
    "duration": 90,
    "year": 2025,
    "province": "Hà Nội",
    "school": "THPT Chu Văn An",
    "subject": "Toán",
    "parts": [
      {
        "name": "Phần 1: Trắc nghiệm",
        "questions": [
          {
            "type": "MULTIPLE_CHOICE",
            "content": "Câu 1: Giải phương trình 2x + 5 = 11",
            "choices": [
              { "content": "A. x = 2", "isCorrect": false },
              { "content": "B. x = 3", "isCorrect": true },
              { "content": "C. x = 4", "isCorrect": false },
              { "content": "D. x = 5", "isCorrect": false }
            ]
          }
        ]
      }
    ]
  }
}
```

#### 📊 Định dạng Excel

**Sheet 1: "Metadata"**
| Key | Value |
|-----|-------|
| title | Đề thi Toán 12 - Giữa kỳ 1 |
| duration | 90 |
| province | Hà Nội |
| school | THPT Chu Văn An |
| subject | Toán |

**Sheet 2: "Questions"**
| Part | Question | Type | Option | IsCorrect |
|------|----------|------|--------|-----------|
| Phần 1 | Giải 2x + 5 = 11 | MULTIPLE_CHOICE | A. x = 2 | false |
| | | | B. x = 3 | true |
| | | | C. x = 4 | false |

---

### Bước 2: Upload & Phân tích

```
┌────────────────────────────────────────────────────────┐
│  1. UPLOAD                                             │
│  ───────────                                           │
│  📁 Chọn file JSON hoặc Excel                          │
│                    ↓                                   │
│  2. PHÂN TÍCH TỰ ĐỘNG                                  │
│  ────────────────────                                  │
│  • Đọc metadata (tên đề, thời gian...)                │
│  • Đếm số câu hỏi                                      │
│  • Kiểm tra Tỉnh/Trường/Môn trong DB                  │
│                    ↓                                   │
│  3. MAPPING                                            │
│  ──────────                                            │
│  ✅ Matched    → Tự động liên kết                     │
│  ⚠️ Cần chọn  → Chọn từ danh sách gợi ý              │
│  🆕 Tạo mới   → Tạo trường học mới                    │
│                    ↓                                   │
│  4. XÁC NHẬN & IMPORT                                  │
│  ────────────────────                                  │
│  🎉 Hoàn tất!                                          │
└────────────────────────────────────────────────────────┘
```

---

### Bước 3: Xử lý Mapping

| Trạng thái | Biểu tượng | Ý nghĩa | Hành động |
|------------|------------|---------|-----------|
| **Matched** | ✅ | Tìm thấy trong DB | Không cần làm gì |
| **Cần chọn** | ⚠️ | Có nhiều kết quả tương tự | Chọn 1 từ danh sách |
| **Không tìm thấy** | ❌ | Không có trong DB | Tạo mới (nếu là Trường) |

**Quy tắc:**
- 🏛️ **Tỉnh/TP**: Phải khớp chính xác 63 tỉnh thành Việt Nam
- 📖 **Môn học**: Phải tồn tại sẵn trong hệ thống
- 🏫 **Trường**: Có thể tạo mới nếu chưa có

---

## 📤 EXPORT - Xuất dữ liệu

### Các định dạng hỗ trợ

| Định dạng | Mô tả | Dùng khi |
|-----------|-------|----------|
| **JSON** | Structured data | Lập trình, API |
| **Excel** | Bảng tính | Chia sẻ, in ấn |

### Cách export

1. Vào **Admin Panel** → **Import/Export**
2. Chọn đề thi cần export
3. Click **JSON** hoặc **Excel**
4. File sẽ tự động download

---

## 🔧 IMPORT NÂNG CAO (Terminal)

### Sử dụng SQL trực tiếp

```bash
# Chạy file SQL
npx prisma db execute --file ./data/ten-file.sql
```

### Sử dụng Script TypeScript

```bash
# Import đề thi
npx tsx scripts/import-exams.ts

# Import môn học cụ thể
npx tsx scripts/import-triet-utt.ts
```

### Chuyển JSON → SQL

```bash
# Bước 1: Convert
npx tsx scripts/json-to-sql.ts

# Bước 2: Execute
npx prisma db execute --file ./data/output.sql
```

---

## 📋 Loại câu hỏi được hỗ trợ

### 1️⃣ MULTIPLE_CHOICE (Trắc nghiệm)

```json
{
  "type": "MULTIPLE_CHOICE",
  "content": "Nội dung câu hỏi?",
  "choices": [
    { "content": "A. Đáp án A", "isCorrect": false },
    { "content": "B. Đáp án B", "isCorrect": true },
    { "content": "C. Đáp án C", "isCorrect": false },
    { "content": "D. Đáp án D", "isCorrect": false }
  ]
}
```

### 2️⃣ TRUE_FALSE_GROUP (Đúng/Sai)

```json
{
  "type": "TRUE_FALSE_GROUP",
  "content": "Xét các mệnh đề sau:",
  "statements": [
    { "content": "a) Mệnh đề 1", "isCorrect": true },
    { "content": "b) Mệnh đề 2", "isCorrect": false },
    { "content": "c) Mệnh đề 3", "isCorrect": true },
    { "content": "d) Mệnh đề 4", "isCorrect": false }
  ]
}
```

---

## ⚠️ Lỗi thường gặp & Cách khắc phục

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| "Môn học không tồn tại" | Subject chưa có trong DB | Thêm môn học trước |
| "Tỉnh không hợp lệ" | Tên tỉnh sai chính tả | Kiểm tra lại tên đúng |
| "File không hợp lệ" | Sai cấu trúc JSON | Validate JSON online |
| "Encoding lỗi" | File không phải UTF-8 | Lưu lại với UTF-8 |

---

## 💡 Mẹo hay

1. **Validate JSON trước**: Dùng [jsonlint.com](https://jsonlint.com)
2. **Template có sẵn**: Xem `data/exam-tin-hoc-template.json`
3. **Backup trước import**: `pg_dump -h HOST -U USER -d DB > backup.sql`
4. **Dùng Transaction**: Wrap SQL trong `BEGIN; ... COMMIT;`

---

## 📁 File mẫu

- **JSON Template**: `data/exam-tin-hoc-template.json`
- **SQL Sample**: `data/exams-seed.sql`
- **Scripts**: `scripts/import-*.ts`
