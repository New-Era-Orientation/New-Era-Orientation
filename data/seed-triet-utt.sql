-- Import data from triet-utt project
-- Run after seeding provinces

-- Insert Schools (UTT, PTIT)
INSERT INTO schools (id, name, code, "provinceId", "createdAt", "updatedAt")
VALUES 
    ('school_utt', 'Đại học Công nghệ GTVT', 'UTT', 1, NOW(), NOW()),
    ('school_ptit', 'Học viện Công nghệ Bưu chính Viễn thông', 'PTIT', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Subjects
INSERT INTO subjects (id, name, slug, code, description, icon, "order", "schoolId", "createdAt", "updatedAt")
VALUES
    -- UTT Subjects
    ('subj_triet_mac_lenin', 'Triết học Mác-Lênin', 'triet-hoc-mac-lenin', 'TRIET', 'Triết học Mác-Lênin - Đại học Công nghệ GTVT', '📚', 10, 'school_utt', NOW(), NOW()),
    ('subj_kinh_te_hoc', 'Kinh tế học', 'kinh-te-hoc', 'KTH', 'Kinh tế học - Đại học Công nghệ GTVT', '📈', 11, 'school_utt', NOW(), NOW()),
    ('subj_logistics', 'Đại cương Logistics và Chuỗi cung ứng', 'logistics-chuoi-cung-ung', 'LOG', 'Đại cương Logistics và Chuỗi cung ứng - Đại học Công nghệ GTVT', '📦', 12, 'school_utt', NOW(), NOW()),
    -- PTIT Subjects
    ('subj_phap_luat', 'Pháp luật đại cương', 'phap-luat-dai-cuong', 'PLDC', 'Pháp luật đại cương - Học viện Công nghệ Bưu chính Viễn thông', '⚖️', 20, 'school_ptit', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- TRIẾT HỌC MÁC-LÊNIN - Chapters
-- =============================================
INSERT INTO chapters (id, "subjectId", name, slug, description, "order", "createdAt", "updatedAt")
VALUES
    ('ch_triet_1', 'subj_triet_mac_lenin', 'Triết học và Vấn đề cơ bản', 'triet-hoc-mac-lenin-chuong-1', 'Chương 1: Triết học và Vấn đề cơ bản', 1, NOW(), NOW()),
    ('ch_triet_2', 'subj_triet_mac_lenin', 'Phép biện chứng duy vật', 'triet-hoc-mac-lenin-chuong-2', 'Chương 2: Phép biện chứng duy vật', 2, NOW(), NOW()),
    ('ch_triet_3', 'subj_triet_mac_lenin', 'Chủ nghĩa duy vật lịch sử', 'triet-hoc-mac-lenin-chuong-3', 'Chương 3: Chủ nghĩa duy vật lịch sử', 3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Triết học - Topics (Chương 1)
INSERT INTO topics (id, "chapterId", name, slug, content, metadata, "order", "createdAt", "updatedAt")
VALUES
    ('topic_triet_1', 'ch_triet_1', 'Nguồn gốc, Khái niệm, Vấn đề cơ bản của triết học', 'nguon-goc-khai-niem-van-de-co-ban-cua-triet-hoc', 
     '<b>Triết học:</b> Hệ thống tri thức lý luận chung nhất về thế giới, về vị trí và vai trò của con người trong thế giới.<br><br><b>Vấn đề cơ bản của triết học:</b> Mối quan hệ giữa Vật chất và Ý thức (Tư duy và Tồn tại).<br><ul><li><b>Mặt thứ nhất (Bản thể luận):</b> Vật chất và Ý thức, cái nào có trước, cái nào quyết định cái nào?</li><li><b>Mặt thứ hai (Nhận thức luận):</b> Con người có khả năng nhận thức được thế giới không?</li></ul><h3>🎯 Mục tiêu học tập</h3><ul><li>Hiểu nguồn gốc ra đời và định nghĩa triết học</li><li>Nắm vững vấn đề cơ bản của triết học</li><li>Phân biệt mặt bản thể luận và nhận thức luận</li></ul><h3>💡 Mẹo ghi nhớ</h3><ul><li>🧠 <b>VĐCB:</b> Tư duy - Tồn tại (Ý thức - Vật chất)</li><li>📌 <b>2 Mặt:</b> Cái nào trước? | Nhận thức được không?</li></ul>',
     '{"icon": "🌍", "keywords": ["nguồn gốc triết học", "khái niệm triết học", "vấn đề cơ bản", "vật chất", "ý thức"]}',
     1, NOW(), NOW()),
    
    ('topic_triet_2', 'ch_triet_1', 'Các trường phái triết học', 'cac-truong-phai-triet-hoc',
     '<b>Trường phái triết học:</b> Phân loại dựa trên cách giải quyết vấn đề cơ bản của triết học.<br><br><b>Theo mặt thứ nhất:</b><ul><li><b>Chủ nghĩa duy vật:</b> Vật chất có trước, quyết định ý thức</li><li><b>Chủ nghĩa duy tâm:</b> Ý thức có trước, quyết định vật chất</li></ul><br><b>Theo mặt thứ hai:</b><ul><li><b>Khả tri luận:</b> Con người có thể nhận thức được thế giới</li><li><b>Bất khả tri luận:</b> Con người không thể nhận thức được thế giới</li></ul><h3>🎯 Mục tiêu học tập</h3><ul><li>Phân biệt Chủ nghĩa duy vật và Chủ nghĩa duy tâm</li><li>Hiểu rõ Khả tri luận và Bất khả tri luận</li></ul><h3>💡 Mẹo ghi nhớ</h3><ul><li>💡 <b>Duy vật:</b> VC có trước | <b>Duy tâm:</b> YT có trước</li><li>📌 <b>Khả tri:</b> Biết được | <b>Bất khả tri:</b> Không biết được</li></ul>',
     '{"icon": "⚖️", "keywords": ["duy vật", "duy tâm", "khả tri", "bất khả tri"]}',
     2, NOW(), NOW()),
    
    ('topic_triet_3', 'ch_triet_1', 'Phương pháp luận: Biện chứng và Siêu hình', 'phuong-phap-luan-bien-chung-va-sieu-hinh',
     '<b>Phương pháp biện chứng:</b><ul><li>Xem xét sự vật trong mối liên hệ phổ biến</li><li>Thừa nhận sự vận động, phát triển</li><li>Nguồn gốc phát triển: Mâu thuẫn nội tại</li></ul><br><b>Phương pháp siêu hình:</b><ul><li>Xem xét sự vật cô lập, tách rời</li><li>Phủ nhận sự vận động, phát triển</li><li>Nguồn gốc: Tác động bên ngoài</li></ul><h3>💡 Mẹo ghi nhớ</h3><ul><li>🔗 <b>Biện chứng:</b> Liên hệ + Vận động + Mâu thuẫn</li><li>📦 <b>Siêu hình:</b> Cô lập + Đứng yên + Bên ngoài</li></ul>',
     '{"icon": "🔄", "keywords": ["biện chứng", "siêu hình", "phương pháp luận"]}',
     3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- KINH TẾ HỌC - Chapters
-- =============================================
INSERT INTO chapters (id, "subjectId", name, slug, description, "order", "createdAt", "updatedAt")
VALUES
    ('ch_kth_1', 'subj_kinh_te_hoc', 'Tổng hợp câu hỏi trắc nghiệm', 'kinh-te-hoc-chuong-1', 'Tổng hợp câu hỏi trắc nghiệm Kinh tế học', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Kinh tế học - Topics
INSERT INTO topics (id, "chapterId", name, slug, content, metadata, "order", "createdAt", "updatedAt")
VALUES
    ('topic_kth_1', 'ch_kth_1', 'Nguyên lý cơ bản & Khan hiếm', 'nguyen-ly-co-ban-khan-hiem',
     '<b>Kinh tế học:</b> Nghiên cứu sự phân bổ các tài nguyên khan hiếm cho sản xuất và phân phối hàng hóa dịch vụ.<br><br><b>Các khái niệm cơ bản:</b><ul><li><b>Khan hiếm:</b> Nguồn lực có hạn, nhu cầu vô hạn → Phải lựa chọn</li><li><b>Chi phí cơ hội:</b> Giá trị của phương án tốt nhất bị bỏ qua</li><li><b>Đường PPF:</b> Giới hạn khả năng sản xuất, minh họa sự đánh đổi</li></ul><h3>💡 Mẹo ghi nhớ</h3><ul><li>🧠 <b>Khan hiếm:</b> Vấn đề cơ bản nhất của kinh tế học</li><li>📌 <b>Chi phí cơ hội:</b> Không chỉ tiền, còn cả thời gian</li></ul>',
     '{"icon": "🌍", "keywords": ["khan hiếm", "chi phí cơ hội", "PPF"]}',
     1, NOW(), NOW()),
    
    ('topic_kth_2', 'ch_kth_1', 'Cung - Cầu & Cân bằng thị trường', 'cung-cau-can-bang-thi-truong',
     '<b>Cầu:</b> Số lượng hàng hóa người tiêu dùng muốn mua ở mỗi mức giá.<br><br><b>Cung:</b> Số lượng hàng hóa người sản xuất muốn bán ở mỗi mức giá.<br><br><b>Quy luật:</b><ul><li>Giá tăng → Cầu giảm, Cung tăng</li><li>Giá giảm → Cầu tăng, Cung giảm</li></ul><br><b>Hàng thay thế:</b> Giá X tăng → Cầu Y tăng<br><b>Hàng bổ sung:</b> Giá X tăng → Cầu Y giảm<h3>💡 Mẹo ghi nhớ</h3><ul><li>🧠 <b>Di chuyển dọc:</b> Do giá bản thân hàng hóa</li><li>📌 <b>Dịch chuyển:</b> Do yếu tố khác (thu nhập, thị hiếu...)</li></ul>',
     '{"icon": "📈", "keywords": ["cung", "cầu", "cân bằng", "thay thế", "bổ sung"]}',
     2, NOW(), NOW()),
    
    ('topic_kth_3', 'ch_kth_1', 'Độ co dãn (Elasticity)', 'do-co-dan-elasticity',
     '<b>Độ co dãn của cầu theo giá (Ed):</b><br>Ed = % thay đổi lượng cầu / % thay đổi giá<br><br><b>Phân loại:</b><ul><li>Ed > 1: Co dãn nhiều → Giảm giá làm tăng doanh thu</li><li>Ed < 1: Co dãn ít → Giảm giá làm giảm doanh thu</li><li>Ed = 1: Co dãn đơn vị</li></ul><br><b>Độ co dãn theo thu nhập:</b><ul><li>Hàng bình thường: > 0</li><li>Hàng cấp thấp: < 0</li></ul>',
     '{"icon": "📏", "keywords": ["co dãn", "elasticity", "doanh thu"]}',
     3, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- LOGISTICS - Chapters
-- =============================================
INSERT INTO chapters (id, "subjectId", name, slug, description, "order", "createdAt", "updatedAt")
VALUES
    ('ch_log_1', 'subj_logistics', 'Tổng quan về Logistics', 'logistics-chuoi-cung-ung-chuong-1', 'Chương 1: Tổng quan về Logistics', 1, NOW(), NOW()),
    ('ch_log_2', 'subj_logistics', 'Quy trình và Chi phí Logistics', 'logistics-chuoi-cung-ung-chuong-2', 'Chương 2: Quy trình và Chi phí Logistics', 2, NOW(), NOW()),
    ('ch_log_3', 'subj_logistics', 'Tổ chức và Kiểm soát Logistics', 'logistics-chuoi-cung-ung-chuong-3', 'Chương 3: Tổ chức và Kiểm soát Logistics', 3, NOW(), NOW()),
    ('ch_log_4', 'subj_logistics', 'Chuỗi cung ứng', 'logistics-chuoi-cung-ung-chuong-4', 'Chương 4: Chuỗi cung ứng', 4, NOW(), NOW()),
    ('ch_log_5', 'subj_logistics', 'Đo lường và Đánh giá', 'logistics-chuoi-cung-ung-chuong-5', 'Chương 5: Đo lường và Đánh giá', 5, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PHÁP LUẬT ĐẠI CƯƠNG - Chapters
-- =============================================
INSERT INTO chapters (id, "subjectId", name, slug, description, "order", "createdAt", "updatedAt")
VALUES
    ('ch_pl_1', 'subj_phap_luat', 'Những vấn đề cơ bản về Nhà nước', 'phap-luat-dai-cuong-chuong-1', 'Chương 1: Những vấn đề cơ bản về Nhà nước', 1, NOW(), NOW()),
    ('ch_pl_2', 'subj_phap_luat', 'Những vấn đề cơ bản về Pháp luật', 'phap-luat-dai-cuong-chuong-2', 'Chương 2: Những vấn đề cơ bản về Pháp luật', 2, NOW(), NOW()),
    ('ch_pl_3', 'subj_phap_luat', 'Quy phạm pháp luật và Quan hệ pháp luật', 'phap-luat-dai-cuong-chuong-3', 'Chương 3: Quy phạm pháp luật và Quan hệ pháp luật', 3, NOW(), NOW()),
    ('ch_pl_4', 'subj_phap_luat', 'Thực hiện pháp luật và Vi phạm pháp luật', 'phap-luat-dai-cuong-chuong-4', 'Chương 4: Thực hiện pháp luật và Vi phạm pháp luật', 4, NOW(), NOW()),
    ('ch_pl_5', 'subj_phap_luat', 'Ý thức pháp luật và Pháp chế XHCN', 'phap-luat-dai-cuong-chuong-5', 'Chương 5: Ý thức pháp luật và Pháp chế XHCN', 5, NOW(), NOW()),
    ('ch_pl_6', 'subj_phap_luat', 'Nhà nước pháp quyền', 'phap-luat-dai-cuong-chuong-6', 'Chương 6: Nhà nước pháp quyền', 6, NOW(), NOW()),
    ('ch_pl_7', 'subj_phap_luat', 'Một số ngành luật trong hệ thống PLVN', 'phap-luat-dai-cuong-chuong-7', 'Chương 7: Một số ngành luật trong hệ thống PLVN', 7, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Import completed! Added schools: UTT, PTIT. Added subjects: Triết học, Kinh tế học, Logistics, Pháp luật.' as status;
