-- =============================================
-- NEO-EDU Exam Data Import
-- Generated at: 2026-01-19T06:48:46.579Z
-- =============================================

BEGIN;

-- =============================================
-- EXAMS
-- =============================================

INSERT INTO exams (id, title, slug, description, subject, year, source, type, duration, parts, published, "createdAt", "updatedAt")
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'Đề thi THPT Quốc gia môn Toán 2025 - Hà Nội',
  'thpt-toan-2025-hanoi',
  'Đề thi thử THPT Quốc gia môn Toán năm 2025 của Sở GD&ĐT Hà Nội',
  'Toán',
  2025,
  'Sở GD&ĐT Hà Nội',
  'STANDARD',
  90,
  '[{"name":"Phần 1: Trắc nghiệm","description":"35 câu trắc nghiệm, mỗi câu 0.2 điểm","questions":[]},{"name":"Phần 2: Đúng/Sai","description":"4 câu, mỗi câu có 4 ý","questions":[]}]',
  true,
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  year = EXCLUDED.year,
  source = EXCLUDED.source,
  type = EXCLUDED.type,
  duration = EXCLUDED.duration,
  parts = EXCLUDED.parts,
  published = EXCLUDED.published,
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO exams (id, title, slug, description, subject, year, source, type, duration, parts, published, "createdAt", "updatedAt")
VALUES (
  'exam_thpt_toan_2025_hcm',
  'Đề thi THPT Quốc gia môn Toán 2025 - TP.HCM',
  'thpt-toan-2025-hcm',
  'Đề thi thử THPT Quốc gia môn Toán năm 2025 của Sở GD&ĐT TP.HCM',
  'Toán',
  2025,
  'Sở GD&ĐT TP.HCM',
  'STANDARD',
  90,
  '[{"name":"Phần 1: Trắc nghiệm","description":"35 câu trắc nghiệm, mỗi câu 0.2 điểm","questions":[]},{"name":"Phần 2: Đúng/Sai","description":"4 câu, mỗi câu có 4 ý","questions":[]}]',
  true,
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  year = EXCLUDED.year,
  source = EXCLUDED.source,
  type = EXCLUDED.type,
  duration = EXCLUDED.duration,
  parts = EXCLUDED.parts,
  published = EXCLUDED.published,
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO exams (id, title, slug, description, subject, year, source, type, duration, parts, published, "createdAt", "updatedAt")
VALUES (
  'exam_thpt_toan_2024_bgh',
  'Đề thi THPT Quốc gia môn Toán 2024 - Bộ GD&ĐT',
  'thpt-toan-2024-bo',
  'Đề thi chính thức THPT Quốc gia môn Toán năm 2024 của Bộ GD&ĐT',
  'Toán',
  2024,
  'Bộ GD&ĐT',
  'STANDARD',
  90,
  '[{"name":"Phần 1: Trắc nghiệm","description":"35 câu trắc nghiệm, mỗi câu 0.2 điểm","questions":[]},{"name":"Phần 2: Đúng/Sai","description":"4 câu, mỗi câu có 4 ý","questions":[]}]',
  true,
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  subject = EXCLUDED.subject,
  year = EXCLUDED.year,
  source = EXCLUDED.source,
  type = EXCLUDED.type,
  duration = EXCLUDED.duration,
  parts = EXCLUDED.parts,
  published = EXCLUDED.published,
  "updatedAt" = EXCLUDED."updatedAt";

-- =============================================
-- QUESTIONS
-- =============================================

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_ham_so_01',
  'Cho hàm số $y = x^3 - 3x^2 + 2$. Hàm số đồng biến trên khoảng nào?',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $(-\infty; 0)$ và $(2; +\infty)$', 'B. $(0; 2)$', 'C. $(-\infty; 0)$', 'D. $(2; +\infty)$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_ham_so_02',
  'Đồ thị hàm số $y = \frac{x+1}{x-1}$ có tiệm cận đứng là đường thẳng:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $x = -1$', 'B. $x = 1$', 'C. $y = 1$', 'D. $y = -1$']::text[],
  'B',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_ham_so_03',
  'Cho hàm số $y = x^4 - 2x^2 + 1$. Số điểm cực trị của hàm số là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. 1', 'B. 2', 'C. 3', 'D. 4']::text[],
  'C',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_mu_log_01',
  'Nghiệm của phương trình $2^{x+1} = 8$ là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $x = 2$', 'B. $x = 3$', 'C. $x = 4$', 'D. $x = 1$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_mu_log_02',
  'Cho $\log_2 x = 3$. Giá trị của $x$ là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. 6', 'B. 8', 'C. 9', 'D. 12']::text[],
  'B',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_tich_phan_01',
  'Tính tích phân $\int_0^1 x^2 dx$:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{1}{2}$', 'B. $\frac{1}{3}$', 'C. $\frac{1}{4}$', 'D. $1$']::text[],
  'B',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_tich_phan_02',
  'Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = x^2$, trục hoành và hai đường thẳng $x = 0$, $x = 1$ bằng:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{1}{2}$', 'B. $\frac{1}{3}$', 'C. $\frac{2}{3}$', 'D. $1$']::text[],
  'B',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_hinh_hoc_01',
  'Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh $a$, SA vuông góc với đáy và $SA = a$. Thể tích khối chóp S.ABCD bằng:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{a^3}{3}$', 'B. $\frac{a^3}{2}$', 'C. $a^3$', 'D. $\frac{a^3}{6}$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_hinh_hoc_02',
  'Trong không gian $Oxyz$, cho điểm $A(1; 2; 3)$ và mặt phẳng $(P): x + y + z - 1 = 0$. Khoảng cách từ $A$ đến $(P)$ bằng:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{5}{\sqrt{3}}$', 'B. $\frac{5\sqrt{3}}{3}$', 'C. $5\sqrt{3}$', 'D. $\sqrt{3}$']::text[],
  'B',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_hinh_hoc_03',
  'Trong không gian $Oxyz$, phương trình mặt cầu tâm $I(1; -2; 3)$ bán kính $R = 4$ là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $(x-1)^2 + (y+2)^2 + (z-3)^2 = 16$', 'B. $(x+1)^2 + (y-2)^2 + (z+3)^2 = 16$', 'C. $(x-1)^2 + (y+2)^2 + (z-3)^2 = 4$', 'D. $(x+1)^2 + (y-2)^2 + (z+3)^2 = 4$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_xstk_01',
  'Gieo một con xúc xắc cân đối hai lần. Xác suất để tổng số chấm xuất hiện bằng 7 là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{1}{6}$', 'B. $\frac{1}{12}$', 'C. $\frac{5}{36}$', 'D. $\frac{1}{36}$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_xstk_02',
  'Trong một hộp có 5 bi đỏ và 3 bi xanh. Lấy ngẫu nhiên 2 bi. Xác suất lấy được 2 bi cùng màu là:',
  'MULTIPLE_CHOICE',
  'COMMON',
  ARRAY['A. $\frac{13}{28}$', 'B. $\frac{15}{28}$', 'C. $\frac{10}{28}$', 'D. $\frac{3}{28}$']::text[],
  'A',
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_tf_01',
  'Cho hàm số $f(x) = x^3 - 3x + 2$. Xét tính đúng sai của các mệnh đề sau:',
  'TRUE_FALSE_GROUP',
  'COMMON',
  ARRAY[]::text[],
  NULL,
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_01_a',
  'q_toan_tf_01',
  'Hàm số $f(x)$ có hai điểm cực trị',
  true,
  1
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_01_b',
  'q_toan_tf_01',
  'Giá trị cực đại của hàm số là $4$',
  true,
  2
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_01_c',
  'q_toan_tf_01',
  'Đồ thị hàm số cắt trục hoành tại 3 điểm phân biệt',
  false,
  3
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_01_d',
  'q_toan_tf_01',
  'Hàm số nghịch biến trên khoảng $(-1; 1)$',
  true,
  4
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO questions (id, content, type, track, choices, "correctAnswer", "createdAt", "updatedAt")
VALUES (
  'q_toan_tf_02',
  'Cho hình chóp S.ABC có đáy ABC là tam giác đều cạnh $a$, SA vuông góc với đáy và $SA = a\sqrt{3}$. Xét tính đúng sai của các mệnh đề sau:',
  'TRUE_FALSE_GROUP',
  'COMMON',
  ARRAY[]::text[],
  NULL,
  '2026-01-19T06:48:46.579Z',
  '2026-01-19T06:48:46.579Z'
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  type = EXCLUDED.type,
  track = EXCLUDED.track,
  choices = EXCLUDED.choices,
  "correctAnswer" = EXCLUDED."correctAnswer",
  "updatedAt" = EXCLUDED."updatedAt";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_02_a',
  'q_toan_tf_02',
  'Diện tích đáy bằng $\frac{a^2\sqrt{3}}{4}$',
  true,
  1
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_02_b',
  'q_toan_tf_02',
  'Thể tích khối chóp bằng $\frac{a^3}{4}$',
  true,
  2
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_02_c',
  'q_toan_tf_02',
  'Góc giữa SC và mặt phẳng đáy bằng $60°$',
  true,
  3
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

INSERT INTO sub_questions (id, "questionId", content, "isCorrect", "order")
VALUES (
  'q_toan_tf_02_d',
  'q_toan_tf_02',
  'Diện tích xung quanh của hình chóp bằng $\frac{3a^2}{2}$',
  false,
  4
) ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  "isCorrect" = EXCLUDED."isCorrect",
  "order" = EXCLUDED."order";

-- =============================================
-- EXAM_QUESTIONS (linking exams to questions)
-- =============================================

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_ham_so_01',
  1,
  1,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_ham_so_02',
  1,
  2,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_ham_so_03',
  1,
  3,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_mu_log_01',
  1,
  4,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_mu_log_02',
  1,
  5,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_tich_phan_01',
  1,
  6,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_tich_phan_02',
  1,
  7,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_hinh_hoc_01',
  1,
  8,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_hinh_hoc_02',
  1,
  9,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_hinh_hoc_03',
  1,
  10,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_xstk_01',
  1,
  11,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_xstk_02',
  1,
  12,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_tf_01',
  2,
  1,
  1
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hanoi',
  'q_toan_tf_02',
  2,
  2,
  1
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_ham_so_01',
  1,
  1,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_ham_so_02',
  1,
  2,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_mu_log_01',
  1,
  3,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_tich_phan_01',
  1,
  4,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_hinh_hoc_01',
  1,
  5,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2025_hcm',
  'q_toan_tf_01',
  2,
  1,
  1
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2024_bgh',
  'q_toan_ham_so_01',
  1,
  1,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2024_bgh',
  'q_toan_ham_so_03',
  1,
  2,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2024_bgh',
  'q_toan_xstk_01',
  1,
  3,
  0.2
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

INSERT INTO exam_questions ("examId", "questionId", "partNumber", "order", points)
VALUES (
  'exam_thpt_toan_2024_bgh',
  'q_toan_tf_02',
  2,
  1,
  1
) ON CONFLICT ("examId", "questionId") DO UPDATE SET
  "partNumber" = EXCLUDED."partNumber",
  "order" = EXCLUDED."order",
  points = EXCLUDED.points;

COMMIT;

-- =============================================
-- Import completed successfully!
-- =============================================