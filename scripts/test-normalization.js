/**
 * Test text normalization for exam parser
 */

const text = `Câu 5: Phương án nào cho bên dưới mô tả đúng định dạng của văn bản được hiển thị khi thực hiện đoạn mã HTML sau? <head> <style>	h1 {color: blue; font-size: 26px;}	h1 {color: red; font-size: 20px;}</style> </head> <body> <h1>Xin chào các bạn</h1> </body>A. Chữ màu đỏ, kích thước 20px.B. Chữ màu đỏ, kích thước 26px.C. Chữ màu xanh dương, kích thước 26px.D. Chữ màu xanh dương, kích thước 20px.Câu 9. Tính năng nào sau đây không phải của trợ lí ảo?A. Tìm kiếm thông tin trên internet và tổng hợp kết quả.B. Viết một tiểu thuyết với cốt truyện và nhân vật sâu sắC. C. Tương tác với con người bằng ngôn ngữ tự nhiên.D. Điều khiển thiết bị điện trong phòng khách theo yêu cầu.Câu 10. Đoạn mã HTML nào dùng để tạo liên kết tới trang web có địa chỉ https://www.google.com/?A. <a domain="https://www.google.com/">Google</a>B. <a href="https://www.google.com/">Google</a>C. <a link="https://www.google.com/">Google</a>D. <a url="https://www.google.com/">Google</a>`;

const text2 = `Câu 11. Thẻ nào sau đây dùng để liên kết một tệp CSS đến tệp HTML?A. <mark>B. <link>C. <style>D. <meta>`;

function normalizeText(text) {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // CRITICAL: Add newline before "Câu X" when preceded by any char (including .)
    .replace(/([^\n])(Câu\s*\d+)/gi, '$1\n$2')
    // Add newline BEFORE A. B. C. D. when preceded by ) or > (HTML closing)
    .replace(/([)>])([A-D])\.\s*/g, '$1\n$2. ')
    // Add newline BEFORE A. B. C. D. when preceded by ? or . and followed by content
    .replace(/([?.])\s*([A-D])\.\s*/g, '$1\n$2. ')
    // Handle pattern where choices run together without period: "hìnhB. Switch"
    .replace(/([a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ])([A-D])\.\s*/gi, '$1\n$2. ');
}

console.log('=== TEST 1: Multiple questions ===');
console.log(normalizeText(text));

console.log('\n\n=== TEST 2: HTML tags in choices ===');
console.log(normalizeText(text2));
