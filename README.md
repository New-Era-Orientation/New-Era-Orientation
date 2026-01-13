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

