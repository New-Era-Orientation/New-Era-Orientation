/**
 * Script Seed Study Content - Tin học 12
 * 
 * Sử dụng: npx tsx scripts/seed-study-content.ts
 */

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TopicData {
    name: string;
    slug: string;
    content: string;
    duration?: number;
}

interface ChapterData {
    name: string;
    slug: string;
    description: string;
    topics: TopicData[];
}

interface SubjectData {
    name: string;
    slug: string;
    description: string;
    icon: string;
    chapters: ChapterData[];
}

const studyData: SubjectData[] = [
    {
        name: "Tin học 12",
        slug: "tin-hoc-12",
        description: "Chương trình Tin học lớp 12 theo chương trình GDPT 2018",
        icon: "💻",
        chapters: [
            {
                name: "Chương 1: Giới thiệu về Khoa học máy tính",
                slug: "gioi-thieu-khmt",
                description: "Tổng quan về Khoa học máy tính và các lĩnh vực nghiên cứu",
                topics: [
                    {
                        name: "Bài 1: Khoa học máy tính là gì?",
                        slug: "khoa-hoc-may-tinh-la-gi",
                        content: `# Khoa học máy tính là gì?

## 1. Định nghĩa
Khoa học máy tính (Computer Science) là ngành khoa học nghiên cứu về lý thuyết, thực nghiệm và kỹ thuật tạo nên nền tảng cho việc thiết kế và sử dụng máy tính.

## 2. Các lĩnh vực chính
- **Lý thuyết tính toán**: Nghiên cứu về thuật toán, độ phức tạp
- **Kỹ thuật phần mềm**: Phát triển và bảo trì phần mềm
- **Trí tuệ nhân tạo**: Mô phỏng trí thông minh con người
- **Mạng máy tính**: Kết nối và truyền thông
- **An ninh mạng**: Bảo vệ thông tin và hệ thống

## 3. Tầm quan trọng
Khoa học máy tính đóng vai trò quan trọng trong mọi lĩnh vực của đời sống hiện đại.`,
                        duration: 45,
                    },
                    {
                        name: "Bài 2: Các lĩnh vực ứng dụng của Tin học",
                        slug: "cac-linh-vuc-ung-dung",
                        content: `# Các lĩnh vực ứng dụng của Tin học

## 1. Giáo dục
- E-learning, học trực tuyến
- Phần mềm học tập
- Quản lý giáo dục

## 2. Y tế
- Hồ sơ bệnh án điện tử
- Chẩn đoán hỗ trợ AI
- Telemedicine

## 3. Kinh doanh
- Thương mại điện tử
- Quản lý doanh nghiệp (ERP)
- Phân tích dữ liệu

## 4. Giải trí
- Trò chơi điện tử
- Streaming media
- Mạng xã hội`,
                        duration: 45,
                    },
                ],
            },
            {
                name: "Chương 2: Thuật toán và Lập trình",
                slug: "thuat-toan-lap-trinh",
                description: "Nền tảng về thuật toán và kỹ năng lập trình Python",
                topics: [
                    {
                        name: "Bài 3: Thuật toán và biểu diễn thuật toán",
                        slug: "thuat-toan-va-bieu-dien",
                        content: `# Thuật toán và biểu diễn thuật toán

## 1. Khái niệm thuật toán
Thuật toán là tập hợp hữu hạn các bước có thứ tự để giải quyết một bài toán.

## 2. Đặc trưng của thuật toán
- **Tính xác định**: Mỗi bước phải rõ ràng
- **Tính hữu hạn**: Phải dừng sau số bước hữu hạn
- **Tính đúng đắn**: Cho kết quả đúng
- **Tính phổ dụng**: Áp dụng cho nhiều bộ dữ liệu

## 3. Cách biểu diễn
1. **Ngôn ngữ tự nhiên**: Mô tả bằng lời
2. **Sơ đồ khối**: Dùng hình vẽ
3. **Mã giả (Pseudocode)**: Ngôn ngữ gần với code
4. **Ngôn ngữ lập trình**: Python, C++,...`,
                        duration: 45,
                    },
                    {
                        name: "Bài 4: Cấu trúc dữ liệu cơ bản",
                        slug: "cau-truc-du-lieu-co-ban",
                        content: `# Cấu trúc dữ liệu cơ bản

## 1. List (Danh sách)
\`\`\`python
# Khai báo list
ds = [1, 2, 3, 4, 5]

# Truy cập phần tử
print(ds[0])  # 1

# Thêm phần tử
ds.append(6)

# Độ dài
print(len(ds))  # 6
\`\`\`

## 2. Tuple (Bộ)
\`\`\`python
# Tuple không thể thay đổi
t = (1, 2, 3)
print(t[0])  # 1
\`\`\`

## 3. Dictionary (Từ điển)
\`\`\`python
# Lưu trữ cặp key-value
d = {"name": "An", "age": 18}
print(d["name"])  # An
\`\`\`

## 4. Set (Tập hợp)
\`\`\`python
# Không có phần tử trùng
s = {1, 2, 3, 3}
print(s)  # {1, 2, 3}
\`\`\``,
                        duration: 60,
                    },
                    {
                        name: "Bài 5: Hàm trong Python",
                        slug: "ham-trong-python",
                        content: `# Hàm trong Python

## 1. Định nghĩa hàm
\`\`\`python
def ten_ham(tham_so1, tham_so2):
    # Thân hàm
    return ket_qua
\`\`\`

## 2. Ví dụ
\`\`\`python
def tinh_tong(a, b):
    return a + b

# Gọi hàm
kq = tinh_tong(3, 5)
print(kq)  # 8
\`\`\`

## 3. Tham số mặc định
\`\`\`python
def chao(ten, loi_chao="Xin chào"):
    print(f"{loi_chao}, {ten}!")

chao("An")  # Xin chào, An!
chao("An", "Hello")  # Hello, An!
\`\`\`

## 4. Hàm đệ quy
\`\`\`python
def giai_thua(n):
    if n <= 1:
        return 1
    return n * giai_thua(n - 1)

print(giai_thua(5))  # 120
\`\`\``,
                        duration: 60,
                    },
                    {
                        name: "Bài 6: Thuật toán tìm kiếm",
                        slug: "thuat-toan-tim-kiem",
                        content: `# Thuật toán tìm kiếm

## 1. Tìm kiếm tuần tự (Linear Search)
\`\`\`python
def tim_kiem_tuan_tu(ds, x):
    for i in range(len(ds)):
        if ds[i] == x:
            return i
    return -1

# Độ phức tạp: O(n)
\`\`\`

## 2. Tìm kiếm nhị phân (Binary Search)
\`\`\`python
def tim_kiem_nhi_phan(ds, x):
    left, right = 0, len(ds) - 1
    while left <= right:
        mid = (left + right) // 2
        if ds[mid] == x:
            return mid
        elif ds[mid] < x:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# Độ phức tạp: O(log n)
# Yêu cầu: Danh sách đã sắp xếp
\`\`\`

## 3. So sánh
| Thuật toán | Độ phức tạp | Yêu cầu |
|------------|-------------|---------|
| Tuần tự | O(n) | Không |
| Nhị phân | O(log n) | Đã sắp xếp |`,
                        duration: 60,
                    },
                    {
                        name: "Bài 7: Thuật toán sắp xếp",
                        slug: "thuat-toan-sap-xep",
                        content: `# Thuật toán sắp xếp

## 1. Sắp xếp nổi bọt (Bubble Sort)
\`\`\`python
def bubble_sort(ds):
    n = len(ds)
    for i in range(n):
        for j in range(0, n - i - 1):
            if ds[j] > ds[j + 1]:
                ds[j], ds[j + 1] = ds[j + 1], ds[j]
    return ds

# Độ phức tạp: O(n²)
\`\`\`

## 2. Sắp xếp chọn (Selection Sort)
\`\`\`python
def selection_sort(ds):
    n = len(ds)
    for i in range(n):
        min_idx = i
        for j in range(i + 1, n):
            if ds[j] < ds[min_idx]:
                min_idx = j
        ds[i], ds[min_idx] = ds[min_idx], ds[i]
    return ds

# Độ phức tạp: O(n²)
\`\`\`

## 3. Sắp xếp chèn (Insertion Sort)
\`\`\`python
def insertion_sort(ds):
    for i in range(1, len(ds)):
        key = ds[i]
        j = i - 1
        while j >= 0 and ds[j] > key:
            ds[j + 1] = ds[j]
            j -= 1
        ds[j + 1] = key
    return ds

# Độ phức tạp: O(n²)
\`\`\``,
                        duration: 60,
                    },
                ],
            },
            {
                name: "Chương 3: Cơ sở dữ liệu",
                slug: "co-so-du-lieu",
                description: "Kiến thức về cơ sở dữ liệu và SQL",
                topics: [
                    {
                        name: "Bài 8: Giới thiệu về Cơ sở dữ liệu",
                        slug: "gioi-thieu-csdl",
                        content: `# Giới thiệu về Cơ sở dữ liệu

## 1. Khái niệm
Cơ sở dữ liệu (Database) là tập hợp các dữ liệu có tổ chức, được lưu trữ và truy cập một cách có hệ thống.

## 2. Hệ quản trị CSDL (DBMS)
- MySQL
- PostgreSQL  
- SQLite
- SQL Server
- Oracle

## 3. Mô hình dữ liệu
### 3.1 Mô hình quan hệ (Relational)
- Dữ liệu được tổ chức thành bảng
- Các bảng có quan hệ với nhau
- Sử dụng SQL để truy vấn

### 3.2 Mô hình NoSQL
- Document (MongoDB)
- Key-Value (Redis)
- Graph (Neo4j)`,
                        duration: 45,
                    },
                    {
                        name: "Bài 9: Ngôn ngữ SQL cơ bản",
                        slug: "sql-co-ban",
                        content: `# Ngôn ngữ SQL cơ bản

## 1. SELECT - Truy vấn dữ liệu
\`\`\`sql
-- Lấy tất cả cột
SELECT * FROM hoc_sinh;

-- Lấy cột cụ thể
SELECT ho_ten, diem FROM hoc_sinh;

-- Có điều kiện
SELECT * FROM hoc_sinh WHERE diem >= 8;

-- Sắp xếp
SELECT * FROM hoc_sinh ORDER BY diem DESC;
\`\`\`

## 2. INSERT - Thêm dữ liệu
\`\`\`sql
INSERT INTO hoc_sinh (ho_ten, lop, diem)
VALUES ('Nguyễn Văn A', '12A1', 8.5);
\`\`\`

## 3. UPDATE - Cập nhật
\`\`\`sql
UPDATE hoc_sinh
SET diem = 9.0
WHERE ho_ten = 'Nguyễn Văn A';
\`\`\`

## 4. DELETE - Xóa
\`\`\`sql
DELETE FROM hoc_sinh
WHERE diem < 5;
\`\`\``,
                        duration: 60,
                    },
                ],
            },
            {
                name: "Chương 4: Mạng máy tính và Internet",
                slug: "mang-may-tinh",
                description: "Kiến thức về mạng máy tính và ứng dụng Internet",
                topics: [
                    {
                        name: "Bài 10: Mạng máy tính",
                        slug: "mang-may-tinh-co-ban",
                        content: `# Mạng máy tính

## 1. Khái niệm
Mạng máy tính là hệ thống các máy tính được kết nối với nhau để chia sẻ tài nguyên và thông tin.

## 2. Phân loại theo phạm vi
- **LAN (Local Area Network)**: Mạng cục bộ
- **WAN (Wide Area Network)**: Mạng diện rộng
- **MAN (Metropolitan Area Network)**: Mạng đô thị

## 3. Mô hình OSI
1. Physical (Vật lý)
2. Data Link (Liên kết dữ liệu)
3. Network (Mạng)
4. Transport (Vận chuyển)
5. Session (Phiên)
6. Presentation (Trình diễn)
7. Application (Ứng dụng)

## 4. Giao thức TCP/IP
- IP: Định địa chỉ và định tuyến
- TCP: Truyền dữ liệu tin cậy
- HTTP/HTTPS: Web
- FTP: Truyền file`,
                        duration: 60,
                    },
                    {
                        name: "Bài 11: An toàn thông tin",
                        slug: "an-toan-thong-tin",
                        content: `# An toàn thông tin

## 1. Các mối đe dọa
- **Virus**: Chương trình độc hại tự nhân bản
- **Malware**: Phần mềm độc hại
- **Phishing**: Lừa đảo qua email/website giả
- **Ransomware**: Mã hóa dữ liệu đòi tiền chuộc

## 2. Biện pháp bảo vệ
### 2.1 Mật khẩu mạnh
- Ít nhất 12 ký tự
- Kết hợp chữ hoa, thường, số, ký tự đặc biệt
- Không dùng thông tin cá nhân

### 2.2 Cập nhật phần mềm
- Hệ điều hành
- Trình duyệt
- Phần mềm diệt virus

### 2.3 Sao lưu dữ liệu
- Backup định kỳ
- Lưu nhiều nơi (cloud, ổ cứng ngoài)

## 3. Quyền riêng tư
- Bảo vệ thông tin cá nhân
- Cẩn thận khi chia sẻ trên mạng xã hội`,
                        duration: 45,
                    },
                ],
            },
        ],
    },
];

async function main() {
    console.log("🚀 Starting Study Content Seed Script\n");
    console.log("=".repeat(50));

    for (const subjectData of studyData) {
        console.log(`\n📚 Subject: ${subjectData.name}`);

        // Check if subject exists
        let subject = await prisma.subject.findUnique({
            where: { slug: subjectData.slug },
        });

        if (subject) {
            console.log(`   ⏭️  Subject already exists, updating...`);
        } else {
            subject = await prisma.subject.create({
                data: {
                    name: subjectData.name,
                    slug: subjectData.slug,
                    description: subjectData.description,
                    icon: subjectData.icon,
                },
            });
            console.log(`   ✅ Created subject: ${subject.id}`);
        }

        // Process chapters
        for (let i = 0; i < subjectData.chapters.length; i++) {
            const chapterData = subjectData.chapters[i];
            console.log(`   📖 Chapter ${i + 1}: ${chapterData.name}`);

            let chapter = await prisma.chapter.findUnique({
                where: {
                    subjectId_slug: {
                        subjectId: subject.id,
                        slug: chapterData.slug,
                    },
                },
            });

            if (!chapter) {
                chapter = await prisma.chapter.create({
                    data: {
                        subjectId: subject.id,
                        name: chapterData.name,
                        slug: chapterData.slug,
                        description: chapterData.description,
                        order: i + 1,
                    },
                });
                console.log(`      ✅ Created chapter`);
            }

            // Process topics
            for (let j = 0; j < chapterData.topics.length; j++) {
                const topicData = chapterData.topics[j];

                const existingTopic = await prisma.topic.findUnique({
                    where: {
                        chapterId_slug: {
                            chapterId: chapter.id,
                            slug: topicData.slug,
                        },
                    },
                });

                if (!existingTopic) {
                    await prisma.topic.create({
                        data: {
                            chapterId: chapter.id,
                            name: topicData.name,
                            slug: topicData.slug,
                            content: topicData.content,
                            duration: topicData.duration || 45,
                            order: j + 1,
                        },
                    });
                }
            }
            console.log(`      ✅ ${chapterData.topics.length} topics`);
        }
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Study content seeded successfully!");
    console.log("=".repeat(50));
}

main()
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
