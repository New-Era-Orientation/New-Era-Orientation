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
git clone https://github.com/your-org/neo-next.git
cd neo-next

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

## 📥 Cập nhật Nội dung Học tập & Ngân hàng Đề

Hệ thống nội dung được tổ chức theo cấu trúc: **School → Subject → Chapter → Topic → Question**

### 📚 1. Thêm Môn học (Subject)

```sql
-- Thêm môn học mới
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

### 📑 2. Thêm Chương (Chapter)

```sql
INSERT INTO "chapters" (id, "subjectId", name, slug, description, "order")
VALUES (
  'chap_xxxx',
  'subj_triet_mac_lenin',  -- ID môn học
  'Chương 1: Triết học và vai trò của nó',
  'chuong-1',
  'Mô tả chương',
  1
);
```

### 📝 3. Thêm Chủ đề/Bài học (Topic)

```sql
INSERT INTO "topics" (id, "chapterId", name, slug, content, metadata, "videoUrl", duration, "order")
VALUES (
  'topic_xxxx',
  'chap_xxxx',              -- ID chương
  'Bài 1: Khái niệm triết học',
  'bai-1',
  'Nội dung bài học (Markdown)',
  '{"keywords": ["triết học", "thế giới quan"]}',
  'https://youtube.com/...', -- Video (optional)
  30,                        -- Thời lượng phút
  1
);
```

### ❓ 4. Thêm Câu hỏi vào Ngân hàng đề

#### 4.1. Câu hỏi trắc nghiệm (Multiple Choice)

```sql
-- Bước 1: Thêm câu hỏi
INSERT INTO "questions" (id, content, explanation, "typeId", difficulty, "subjectId", "chapterId", "topicId", tags)
VALUES (
  'q_xxxx',
  'Triết học là gì?',
  'Giải thích đáp án...',
  'MULTIPLE_CHOICE',
  'MEDIUM',              -- EASY, MEDIUM, HARD, EXPERT
  'subj_triet',
  'chap_1',              -- Optional
  'topic_1',             -- Optional
  ARRAY['triết học', 'khái niệm']
);

-- Bước 2: Thêm các đáp án
INSERT INTO "question_options" (id, "questionId", content, "isCorrect", "order")
VALUES
  ('opt_1', 'q_xxxx', 'A. Khoa học về tự nhiên', false, 0),
  ('opt_2', 'q_xxxx', 'B. Hệ thống tri thức lý luận chung nhất về thế giới', true, 1),
  ('opt_3', 'q_xxxx', 'C. Môn học về đạo đức', false, 2),
  ('opt_4', 'q_xxxx', 'D. Nghiên cứu về con người', false, 3);
```

#### 4.2. Câu hỏi đúng/sai (True/False)

```sql
INSERT INTO "questions" (id, content, "typeId", difficulty, "subjectId")
VALUES ('q_tf_xxx', 'Triết học là khoa học của mọi khoa học', 'TRUE_FALSE', 'EASY', 'subj_triet');

INSERT INTO "question_options" (id, "questionId", content, "isCorrect", "order")
VALUES
  ('opt_tf_1', 'q_tf_xxx', 'Đúng', false, 0),
  ('opt_tf_2', 'q_tf_xxx', 'Sai', true, 1);
```

### 📋 5. Tạo Đề thi (Exam)

```sql
-- Bước 1: Tạo đề thi
INSERT INTO "exams" (id, title, slug, description, "subjectId", type, duration, "totalPoints", "passingScore", published)
VALUES (
  'exam_xxxx',
  'Đề thi giữa kỳ Triết học 2025',
  'de-thi-giua-ky-triet-2025',
  'Đề thi giữa kỳ môn Triết học Mác-Lênin',
  'subj_triet',
  'MIDTERM',             -- PRACTICE, MIDTERM, FINAL, MOCK
  60,                    -- Thời gian (phút)
  10,                    -- Tổng điểm
  5,                     -- Điểm đạt
  true                   -- Xuất bản
);

-- Bước 2: Thêm câu hỏi vào đề thi
INSERT INTO "exam_questions" (id, "examId", "questionId", "order", points)
VALUES
  ('eq_1', 'exam_xxxx', 'q_001', 1, 0.5),
  ('eq_2', 'exam_xxxx', 'q_002', 2, 0.5),
  ('eq_3', 'exam_xxxx', 'q_003', 3, 1.0);
```

### 🔄 6. Import hàng loạt từ JSON

#### Template JSON cho đề thi
Xem file mẫu: [data/exam-tin-hoc-template.json](data/exam-tin-hoc-template.json)

```json
{
  "exam": {
    "id": "exam_xxx",
    "title": "Tên đề thi",
    "subject": "Tên môn",
    "duration": 60,
    "parts": [...]
  },
  "questions": {
    "part1": [
      {
        "id": "q01",
        "content": "Nội dung câu hỏi",
        "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "A",
        "points": 0.25
      }
    ]
  }
}
```

#### Chạy import

```bash
# Import đề thi từ JSON
npx tsx scripts/import-exams.ts

# Hoặc chuyển JSON sang SQL rồi execute
npx tsx scripts/json-to-sql.ts
npx prisma db execute --file ./data/output.sql
```

### 🏫 7. Thêm Trường học (School)

```sql
INSERT INTO "schools" (id, name, slug, code, domain, logo, "provinceId")
VALUES (
  'school_utt',
  'Đại học Giao thông Vận tải',
  'utt',
  'UTT',
  'utt.edu.vn',
  '/logos/utt.png',
  'province_hanoi'       -- Tỉnh/TP
);
```

### ⚡ Phương pháp Import

| Phương pháp | Khi nào dùng | Lệnh |
|-------------|--------------|------|
| **SQL trực tiếp** | Import < 100 records | `npx prisma db execute --file ./data/file.sql` |
| **Script TS** | Logic phức tạp, cần validate | `npx tsx scripts/import-xxx.ts` |
| **JSON → SQL** | Dữ liệu có sẵn dạng JSON | `npx tsx scripts/json-to-sql.ts` |

### ⚠️ Lưu ý quan trọng

1. **Backup trước khi import**: Luôn backup database trước khi thực hiện import lớn
   ```bash
   pg_dump -h HOST -U USER -d DATABASE > backup.sql
   ```

2. **Kiểm tra dữ liệu**: Chạy script kiểm tra sau khi import
   ```bash
   npx tsx scripts/check-data.ts
   npx tsx scripts/check-questions.ts
   ```

3. **Transaction**: Các file SQL nên wrap trong transaction để rollback nếu có lỗi
   ```sql
   BEGIN;
   -- INSERT statements
   COMMIT;
   ```

4. **Kết nối Supabase**: Nếu dùng Supabase, đảm bảo:
   - Sử dụng connection string với `?pgbouncer=true` cho pooled connection
   - Hoặc dùng direct connection cho bulk operations
   - Set `statement_timeout` nếu cần cho queries lớn

5. **Conflict handling**: Sử dụng `ON CONFLICT` để xử lý duplicate
   ```sql
   INSERT INTO "questions" (id, content, ...)
   VALUES (...)
   ON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;
   ```

### 📊 Scripts hữu ích

| Script | Mô tả |
|--------|-------|
| `check-data.ts` | Kiểm tra tổng quan dữ liệu |
| `check-questions.ts` | Kiểm tra số lượng câu hỏi |
| `check-subjects.ts` | Kiểm tra môn học |
| `check-topics.ts` | Kiểm tra chủ đề |
| `list-subjects.ts` | Liệt kê tất cả môn học |
| `assign-questions-to-topics.ts` | Gán câu hỏi vào chủ đề |

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

