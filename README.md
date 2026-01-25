# NEO-EDU - Nền tảng Giáo dục Trực tuyến

NEO-EDU là nền tảng giáo dục trực tuyến hiện đại, được xây dựng với Next.js 16, giúp học sinh ôn thi và học tập hiệu quả.

## ✨ Tính năng

- 📚 **Học tập theo chủ đề** - Nội dung được tổ chức theo môn học và chủ đề
- 📝 **Thi thử** - Đề thi thử với nhiều dạng câu hỏi
- 🤖 **AI Tutor** - Trợ lý AI giúp giải đáp thắc mắc
- 📊 **Dashboard** - Thống kê tiến độ học tập
- 🏆 **Gamification** - Hệ thống thành tích và xếp hạng
- 🎴 **Flashcards** - Học từ vựng với spaced repetition
- 👨‍💼 **Admin Dashboard** - Quản lý người dùng và nội dung

## 🚀 Cài đặt

### Yêu cầu

- Node.js 22+
- PostgreSQL (hoặc Supabase)
- npm hoặc pnpm

### Cài đặt nhanh

```bash
# Clone repo
git clone https://github.com/New-Era-Orientation/New-Era-Orientation.git
cd New-Era-Orientation

# Cài đặt dependencies
npm install

# Copy file môi trường
cp .env.example .env

# Cấu hình database trong .env

# Đẩy schema lên database
npm run db:push

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## 📁 Cấu trúc dự án

```
neo-next/
├── src/
│   ├── app/              # App Router pages
│   │   ├── api/          # API routes
│   │   ├── admin/        # Admin pages
│   │   ├── dashboard/    # User dashboard
│   │   ├── exam/         # Exam pages
│   │   └── study/        # Study pages
│   ├── client/           # Client components
│   │   ├── components/   # UI components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   └── lib/          # Client utilities
│   └── server/           # Server code
│       ├── auth/         # Authentication
│       └── db/           # Database
├── prisma/               # Prisma schema
├── public/               # Static files
└── scripts/              # Build scripts
```

## 🛠 Scripts

```bash
npm run dev          # Chạy development server
npm run build        # Build production
npm run start        # Chạy production server
npm run lint         # Kiểm tra linting
npm run test         # Chạy tests
npm run test:run     # Chạy tests một lần
npm run db:push      # Đẩy schema lên database
npm run db:generate  # Generate Prisma Client
npm run db:studio    # Mở Prisma Studio
```

## 📥 Import/Export Dữ liệu

### 🎯 Tổng quan cấu trúc dữ liệu

```
┌─────────────────────────────────────────────────────────────────┐
│                     CẤU TRÚC NỘI DUNG                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏫 SCHOOL (Trường)                                            │
│     └── 📚 SUBJECT (Môn học)                                   │
│            └── 📑 CHAPTER (Chương)                             │
│                   └── 📝 TOPIC (Bài học)                       │
│                          └── ❓ QUESTION (Câu hỏi)             │
│                                                                 │
│  📋 EXAM (Đề thi) ─────────────────┐                           │
│     └── 🔗 EXAM_QUESTIONS ─────────┴── ❓ QUESTION             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🚀 Cách nhanh nhất: Admin Panel

1. Truy cập **Admin Panel** → **Import/Export**
2. **Upload file** JSON hoặc Excel
3. Hệ thống **tự động phân tích** và mapping
4. **Xác nhận** → Hoàn tất!

> 📖 Xem hướng dẫn chi tiết: [Admin Panel → Import/Export → Hướng dẫn]

---

### 📄 Import từ JSON

#### Template cơ bản

```json
{
  "exam": {
    "title": "Đề thi Toán 12 - Giữa kỳ 1",
    "duration": 90,
    "subject": "Toán",
    "parts": [
      {
        "name": "Phần 1: Trắc nghiệm",
        "questions": [
          {
            "type": "MULTIPLE_CHOICE",
            "content": "Giải: 2x + 5 = 11",
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

#### Các trường metadata

| Trường | Bắt buộc | Mô tả |
|--------|:--------:|-------|
| `title` | ✅ | Tên đề thi |
| `duration` | ✅ | Thời gian (phút) |
| `subject` | ❌ | Tên môn học |
| `province` | ❌ | Tỉnh/TP |
| `school` | ❌ | Tên trường |
| `year` | ❌ | Năm thi |

---

### 📊 Import từ Excel

**Sheet 1: Metadata**
| Key | Value |
|-----|-------|
| title | Đề thi Toán 12 |
| duration | 90 |
| subject | Toán |

**Sheet 2: Questions**
| Part | Question | Type | Option | IsCorrect |
|------|----------|------|--------|-----------|
| Phần 1 | Giải 2x+5=11 | MULTIPLE_CHOICE | A. x=2 | false |
| | | | B. x=3 | true |
| | | | C. x=4 | false |

---

### 🔧 Import bằng Terminal (Nâng cao)

```bash
# Cách 1: Chạy file SQL trực tiếp
npx prisma db execute --file ./data/ten-file.sql

# Cách 2: Chạy script TypeScript
npx tsx scripts/import-exams.ts

# Cách 3: Convert JSON → SQL → Execute
npx tsx scripts/json-to-sql.ts
npx prisma db execute --file ./data/output.sql
```

---

### 📋 Thêm dữ liệu bằng SQL

<details>
<summary>📚 Thêm Môn học (Subject)</summary>

```sql
INSERT INTO "subjects" (id, name, slug, code, description, icon, "order", "practiceMode", "schoolId")
VALUES (
  'subj_xxxx',           -- ID unique
  'Triết học Mác-Lênin', -- Tên môn
  'triet-mac-lenin',     -- Slug (URL-friendly)
  'TRIET',               -- Mã môn (optional)
  'Mô tả môn học',       -- Mô tả
  '📖',                  -- Icon emoji
  1,                     -- Thứ tự hiển thị
  'QUESTION_IDS',        -- Mode: QUESTION_IDS hoặc TOPIC_BASED
  'school_utt'           -- ID trường (null = môn THPT chung)
);
```
</details>

<details>
<summary>📑 Thêm Chương (Chapter)</summary>

```sql
INSERT INTO "chapters" (id, "subjectId", name, slug, description, "order")
VALUES (
  'chap_xxxx',
  'subj_triet_mac_lenin',
  'Chương 1: Triết học và vai trò của nó',
  'chuong-1',
  'Mô tả chương',
  1
);
```
</details>

<details>
<summary>📝 Thêm Bài học (Topic)</summary>

```sql
INSERT INTO "topics" (id, "chapterId", name, slug, content, "videoUrl", duration, "order")
VALUES (
  'topic_xxxx',
  'chap_xxxx',
  'Bài 1: Khái niệm triết học',
  'bai-1',
  'Nội dung bài học (Markdown)',
  'https://youtube.com/...',
  30,
  1
);
```
</details>

<details>
<summary>❓ Thêm Câu hỏi (Question)</summary>

```sql
-- Bước 1: Thêm câu hỏi
INSERT INTO "questions" (id, content, explanation, "typeId", difficulty, "subjectId")
VALUES (
  'q_xxxx',
  'Triết học là gì?',
  'Giải thích đáp án...',
  'MULTIPLE_CHOICE',
  'MEDIUM',
  'subj_triet'
);

-- Bước 2: Thêm các đáp án
INSERT INTO "question_options" (id, "questionId", content, "isCorrect", "order")
VALUES
  ('opt_1', 'q_xxxx', 'A. Khoa học về tự nhiên', false, 0),
  ('opt_2', 'q_xxxx', 'B. Hệ thống tri thức lý luận chung nhất', true, 1),
  ('opt_3', 'q_xxxx', 'C. Môn học về đạo đức', false, 2),
  ('opt_4', 'q_xxxx', 'D. Nghiên cứu về con người', false, 3);
```
</details>

<details>
<summary>📋 Tạo Đề thi (Exam)</summary>

```sql
-- Bước 1: Tạo đề thi
INSERT INTO "exams" (id, title, slug, description, "subjectId", type, duration, "totalPoints", published)
VALUES (
  'exam_xxxx',
  'Đề thi giữa kỳ Triết học 2025',
  'de-thi-giua-ky-triet-2025',
  'Đề thi giữa kỳ môn Triết học Mác-Lênin',
  'subj_triet',
  'MIDTERM',
  60,
  10,
  true
);

-- Bước 2: Gắn câu hỏi vào đề
INSERT INTO "exam_questions" (id, "examId", "questionId", "order", points)
VALUES
  ('eq_1', 'exam_xxxx', 'q_001', 1, 0.5),
  ('eq_2', 'exam_xxxx', 'q_002', 2, 0.5);
```
</details>

---

### ⚠️ Lưu ý quan trọng

| Tip | Mô tả |
|-----|-------|
| 💾 **Backup trước** | `pg_dump -h HOST -U USER -d DB > backup.sql` |
| 🔄 **Dùng Transaction** | Wrap SQL trong `BEGIN; ... COMMIT;` |
| ✅ **Validate JSON** | Dùng [jsonlint.com](https://jsonlint.com) |
| 📝 **Xem template** | `data/exam-tin-hoc-template.json` |

### 📊 Scripts kiểm tra

```bash
npx tsx scripts/check-data.ts       # Kiểm tra tổng quan
npx tsx scripts/check-questions.ts  # Đếm câu hỏi
npx tsx scripts/list-subjects.ts    # Liệt kê môn học
```

## 🐳 Docker

```bash
# Build và chạy với Docker Compose
docker compose up -d

# Chỉ build
docker build -t neo-edu .
```

## 📦 Tech Stack

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma 7
- **Auth**: NextAuth.js v5
- **Styling**: Tailwind CSS 4
- **Testing**: Vitest + Testing Library
- **AI**: OpenAI API

## 🚀 Deployment

### Vercel (Khuyến nghị)

1. Push code lên GitHub
2. Import project vào Vercel
3. Cấu hình environment variables
4. Deploy

### Docker

```bash
docker compose up -d
```

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

