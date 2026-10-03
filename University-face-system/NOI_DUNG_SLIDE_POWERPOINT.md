# BỘ NỘI DUNG 16 SLIDES THUYẾT TRÌNH DÙNG ĐỂ COPY SANG MICROSOFT POWERPOINT
> **Dự án:** Hệ thống Điểm danh và Quản lý Khảo thí bằng Nhận diện Khuôn mặt (University Face System)  
> **Tác giả:** Lục Văn Sơn • MSSV: 2310900087 • Lớp: K23CNT3  
> **Vai trò:** QA/QC Engineer, Backend Supporter, UI Optimizer  
> **Hướng dẫn sử dụng:** Mở PowerPoint, tạo slide mới theo bố cục gợi ý, bôi đen và sao chép (Ctrl+C / Ctrl+V) các đoạn văn bản tương ứng vào từng ô Text Box trên slide và ô Speaker Notes bên dưới.

---

## 🟢 SLIDE 01: TIÊU ĐỀ & GIỚI THIỆU ĐỀ TÀI
* **Bố cục PowerPoint gợi ý:** Title Slide (1 Cột Tiêu đề lớn + 2 Khối thông tin bên dưới)

### [Ô 1 - TIÊU ĐỀ & PHỤ ĐỀ]
**KHOÁ LUẬN TỐT NGHIỆP • K23CNT3**
# HỆ THỐNG ĐIỂM DANH & QUẢN LÝ KHẢO THÍ BẰNG NHẬN DIỆN KHUÔN MẶT THÔNG MINH
**Ứng Dụng Deep Learning (ArcFace + MTCNN), Chống Giả Mạo 3D Liveness & Kiến Trúc Microservices**

### [Ô 2 - THÔNG TIN TÁC GIẢ]
* **Sinh viên thực hiện:** Lục Văn Sơn
* **Mã số sinh viên (MSSV):** 2310900087
* **Lớp chuyên ngành:** K23CNT3
* **Khoa đào tạo:** Công nghệ Thông tin & Khoa học Máy tính
* **Vai trò trong đề tài:** QA/QC Engineer & Fullstack Backend Supporter

### [Ô 3 - CÁC CHỈ SỐ ẤN TƯỢNG]
* **> 99.2%** — Độ chính xác nhận diện ArcFace
* **< 250ms** — Tốc độ đối soát 1:N tức thời
* **100%** — Chặn đứng gian lận ảnh in / điện thoại

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Kính chào quý Thầy Cô trong Hội đồng chấm khóa luận tốt nghiệp! Em tên là Lục Văn Sơn, sinh viên lớp K23CNT3, MSSV 2310900087. Hôm nay em xin phép được trình bày đề tài: "Xây dựng Hệ thống Điểm danh và Quản lý Khảo thí bằng Nhận diện Khuôn mặt dựa trên Deep Learning & Chống gian lận 3D". Đề tài tập trung giải quyết bài toán tự động hóa kiểm diện quy mô trường học, chống gian lận và tối ưu trải nghiệm người dùng với kiến trúc Microservices hiện đại.

---

## 🟢 SLIDE 02: THỰC TRẠNG & TÍNH CẤP THIẾT
* **Bố cục PowerPoint gợi ý:** 3 Cột (3 Columns Card) + 1 Khối Callout ở chân slide

### [Ô 1 - TIÊU ĐỀ SLIDE]
**01 • ĐẶT VẤN ĐỀ & TÍNH CẤP THIẾT**
# THỰC TRẠNG & ĐỘNG LỰC NGHIÊN CỨU
*Những nút thắt lớn trong công tác quản lý đào tạo & khảo thí truyền thống*

### [Ô 2 - CỘT 1: LÃNG PHÍ THỜI GIAN]
⏱️ **Lãng Phí Thời Gian Giảng Dạy**
* Giảng viên mất từ 10 - 15 phút đầu mỗi buổi học để đọc tên kiểm diện trong lớp 60 - 100 sinh viên.
* Làm giảm đáng kể thời lượng giảng dạy chuyên môn và phá vỡ sự tập trung của tiết học.

### [Ô 3 - CỘT 2: GIAN LẬN ĐIỂM DANH]
🚫 **Gian Lận & Điểm Danh Hộ**
* Thẻ sinh viên từ, mã QR tĩnh hoặc danh sách ký tên trên giấy rất dễ bị lợi dụng.
* Sinh viên dễ dàng nhờ bạn quẹt thẻ hộ, ký tên thay hoặc gửi mã QR từ xa để điểm danh khống.

### [Ô 4 - CỘT 3: THỐNG KÊ THỦ CÔNG]
📊 **Thống Kê Khảo Thí Thủ Công**
* Cuối kỳ, việc tính tỷ lệ vắng để xét điều kiện dự thi (cấm thi khi vắng > 20%) hoàn toàn thủ công.
* Dễ nhầm lẫn, mất nhiều thời gian tổng hợp và khó đối soát khi có thắc mắc, khiếu nại.

### [Ô 5 - GIẢI PHÁP ĐỀ XUẤT]
🎯 **Giải pháp đột phá:** Hệ thống sinh trắc học khuôn mặt tự động 1:N không chạm, tích hợp Passive 3D Anti-Spoofing, quản lý phòng thi theo sơ đồ ghế số hóa và Trợ lý AI tra cứu 24/7.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Kính thưa Thầy Cô, xuất phát điểm của đề tài đến từ những bất cập rất thực tế: Việc đọc tên từng người làm lãng phí 15 phút đầu giờ; việc nhờ bạn quẹt thẻ hay ký hộ xảy ra thường xuyên; và khi xét điều kiện thi thì việc đối chiếu bảng Excel thủ công rất dễ sai sót. Đề tài của chúng em ra đời nhằm giải quyết triệt để các tồn tại đó.

---

## 🟢 SLIDE 03: TỔNG QUAN HỆ THỐNG (UNIVERSITY FACE SYSTEM)
* **Bố cục PowerPoint gợi ý:** 3 Khối hộp mô-đun (3 Feature Cards) + 1 Thanh Banner mô hình triển khai

### [Ô 1 - TIÊU ĐỀ SLIDE]
**02 • GIỚI THIỆU HỆ THỐNG**
# TỔNG QUAN HỆ THỐNG (UNIVERSITY FACE SYSTEM)
*Nền tảng số hóa toàn diện quy trình điểm danh học phần & quản lý phòng thi thông minh*

### [Ô 2 - MÔ-ĐUN 1: PHÒNG ĐÀO TẠO (ADMIN PORTAL)]
🏛️ **Phân Hệ Phòng Đào Tạo (Admin)**
* Quản lý cây danh mục đào tạo: Khoa/Viện, Lớp sinh hoạt chính quy, Môn học, Phòng học, Ca học chuẩn (Shifts).
* Lập lịch học học kỳ, xếp lịch thi học phần và cấu hình sơ đồ ghế phòng thi (Seat Matrix).
* Giám sát tỷ lệ chuyên cần toàn trường theo thời gian thực; tự động phát hiện và khóa sinh viên cấm thi (vắng > 20%).

### [Ô 3 - MÔ-ĐUN 2: CỔNG GIẢNG VIÊN (TEACHER PORTAL)]
👩‍🏫 **Phân Hệ Cổng Giảng Viên (Teacher)**
* Xem lịch giảng dạy cá nhân theo tuần trực quan.
* Mở ca điểm danh AI 1:N tự động 2 ca: Check-in đầu giờ & Check-out cuối giờ.
* Hỗ trợ công cụ sửa điểm danh thủ công dự phòng khi camera có sự cố.
* Xuất file báo cáo chuyên cần Excel (.xlsx) chuẩn múi giờ GMT+7 chỉ với 1 cú click.

### [Ô 4 - MÔ-ĐUN 3: CỔNG SINH VIÊN & TRỢ LÝ AI (STUDENT & AI PORTAL)]
🎓 **Phân Hệ Sinh Viên & Trợ Lý AI**
* Thu thập và đăng ký 3 góc khuôn mặt chuẩn hóa (Thẳng - Trái - Phải).
* Điểm danh không chạm: đứng trước camera 0.3s là hoàn tất.
* Tra cứu tức thời lịch học, lịch thi, phòng thi và số tiết vắng thông qua Trợ lý Hybrid AI & Mascot Drone 3D.

### [Ô 5 - ĐIỂM NHẤN MÔ HÌNH TRIỂN KHAI]
✨ **Triển khai Zero-Hardware Cost:** Hoạt động ngay trên máy tính/laptop sẵn có của giảng viên và camera lớp học thông thường, không đòi hỏi mua sắm thiết bị chuyên dụng đắt đỏ.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Tiếp theo, em xin giới thiệu tổng quan về Hệ thống University Face System. Đây là một nền tảng số hóa toàn diện quy trình kiểm diện và tổ chức khảo thí trong trường đại học, phục vụ đồng thời 3 nhóm đối tượng: Phòng Đào tạo quản lý danh mục toàn trường; Giảng viên mở ca điểm danh nhận diện khuôn mặt tự động 2 ca và xuất báo cáo; Sinh viên đăng ký góc mặt và tra cứu thông tin với Trợ lý AI. Điểm đặc biệt nhất là hệ thống vận hành hoàn toàn không chạm và không đòi hỏi mua sắm phần cứng đắt tiền.

---

## 🟢 SLIDE 04: 6 ĐIỂM ĐỘT PHÁ NỔI BẬT CỦA HỆ THỐNG
* **Bố cục PowerPoint gợi ý:** Lưới 6 ô (Grid 2x3 hoặc 3x2)

### [Ô 1 - TIÊU ĐỀ SLIDE]
**03 • ĐIỂM NỔI BẬT CỦA HỆ THỐNG**
# 6 ĐIỂM ĐỘT PHÁ NỔI BẬT CỦA HỆ THỐNG
*Những cải tiến công nghệ cốt lõi tạo nên sự khác biệt và giá trị thực tiễn cao*

### [Ô 2 - ĐỘT PHÁ 1]
⚡ **01. Nhận Diện 1:N Siêu Tốc < 250ms**
* Ma trận ArcFace trích xuất vector đặc trưng 512 chiều.
* Cơ chế Model Warm-up khởi động trước, đối soát cả danh sách lớp ngay khi sinh viên bước qua camera.

### [Ô 3 - ĐỘT PHÁ 2]
🛡️ **02. Chống Giả Mạo Passive 3D Liveness**
* Phân tích vân hạt quang học Laplacian Variance (phát hiện màn hình điện thoại) và tỉ lệ hình học 3D.
* Chặn 100% gian lận ảnh in/màn hình mà không bắt sinh viên phải chớp mắt, quay đầu phiền hà.

### [Ô 4 - ĐỘT PHÁ 3]
🎯 **03. Thuật Toán 2-Frame Voting Buffer**
* Trượt cửa sổ 3 frame liên tiếp, yêu cầu 2 frame liên tiếp khớp cùng 1 mã sinh viên mới chốt điểm danh.
* Triệt tiêu 100% hiện tượng chập chờn hay nhận diện nhầm người đi lướt qua phía sau.

### [Ô 5 - ĐỘT PHÁ 4]
🪑 **04. Sơ Đồ Ghế Thi Số Hóa (Seat Matrix)**
* Xếp chỗ thi tự động theo hàng x cột (Rows x Cols) đúng thực tế phòng thi.
* Tự động sáng đèn ghế khi thí sinh vào phòng; tự động lọc danh sách cấm thi theo quy chế.

### [Ô 6 - ĐỘT PHÁ 5]
🕒 **05. Khóa Cứng Múi Giờ GMT+7 & ExcelJS**
* Đồng bộ chuẩn xác múi giờ Việt Nam `Asia/Ho_Chi_Minh` xuyên suốt MySQL Docker, Node.js API và file Excel.
* Báo cáo Excel chuẩn xác từng giây, định dạng màu sắc chuyên nghiệp, không bị lệch 7 tiếng.

### [Ô 7 - ĐỘT PHÁ 6]
🤖 **06. Trợ Lý Hybrid AI & Drone Mascot**
* Động cơ 3 tầng: Groq Llama-3.3-70B tốc độ cao + Gemini Flash + Local RAG CSDL 0-token cost.
* Drone Mascot 3D chuyển động mắt theo con trỏ chuột, giải đáp lịch thi/học 24/7.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Đây là slide cốt lõi tóm tắt 6 điểm nổi bật vượt trội của đề tài: 1 là tốc độ đối soát 1:N cực nhanh dưới 250ms; 2 là công nghệ chống giả mạo Passive 3D chặn đứng việc dùng điện thoại; 3 là thuật toán 2-Frame Voting Buffer triệt tiêu lỗi bắt nhầm người; 4 là sơ đồ phòng thi Seat Matrix số hóa; 5 là chuẩn hóa múi giờ GMT+7 xuyên suốt; và 6 là Trợ lý AI Hybrid kết hợp Llama-3.3 và Local RAG không tiêu tốn token.

---

## 🟢 SLIDE 05: MỤC TIÊU & CHỈ TIÊU KỸ THUẬT
* **Bố cục PowerPoint gợi ý:** 4 Khối số liệu lớn (4 Metrics Card) + 1 Bảng phạm vi bên dưới

### [Ô 1 - TIÊU ĐỀ SLIDE]
**04 • MỤC TIÊU NGHIÊN CỨU**
# MỤC TIÊU & CHỈ TIÊU KỸ THUẬT
*Các mục tiêu định lượng được thiết lập và nghiệm thu thành công*

### [Ô 2 - CHỈ TIÊU 1]
⚡ **< 250ms — Tốc Độ Đối Soát 1:N**
* Xử lý trực tiếp trên live stream camera, nhận diện tức thì không gây ùn tắc tại cửa phòng.

### [Ô 3 - CHỈ TIÊU 2]
🎯 **> 99.2% — Độ Chính Xác Sinh Trắc**
* Ứng dụng ArcFace 512-D, nhận diện chuẩn xác ngay cả khi đổi kiểu tóc, đeo kính cận.

### [Ô 4 - CHỈ TIÊU 3]
🛡️ **100% — Chống Gian Lận (Anti-Spoof)**
* Passive Liveness loại bỏ hoàn toàn việc dùng ảnh in màu, video điện thoại.

### [Ô 5 - CHỈ TIÊU 4]
🤖 **24/7 — Trợ Lý AI Hỗ Trợ Đào Tạo**
* Tích hợp Llama-3.3 và Local RAG giải đáp mọi thắc mắc học vụ tức thời.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Để định hướng nghiên cứu, đề tài đã đặt ra 4 chỉ tiêu định lượng cụ thể: Tốc độ dưới 250 miligiây; Độ chính xác trên 99.2%; Khả năng chống gian lận đạt 100%; và Trợ lý AI sẵn sàng 24/7 phục vụ giảng viên, sinh viên.

---

## 🟢 SLIDE 06: KIẾN TRÚC HỆ THỐNG MICROSERVICES (DOCKER)
* **Bố cục PowerPoint gợi ý:** Sơ đồ khối 4 Containers liên kết với nhau

### [Ô 1 - TIÊU ĐỀ SLIDE]
**05 • KIẾN TRÚC HỆ THỐNG**
# KIẾN TRÚC MICROSERVICES CONTAINERIZED
*Thiết kế phân lớp, cô lập tải tính toán và mở rộng linh hoạt qua Docker Mesh*

### [Ô 2 - KHỐI FRONTEND]
💻 **Frontend Client (React 18 + Vite)**
* Port: 5173 • Quản lý giao diện thời gian thực, điều khiển webcam 60 FPS, vẽ khung Oval hướng dẫn.

### [Ô 3 - KHỐI BACKEND API]
🚀 **Backend API Gateway (Node.js + Express)**
* Port: 5000 • Xử lý luồng nghiệp vụ, phân quyền JWT, mã hóa bcrypt, khóa cứng múi giờ GMT+7.

### [Ô 4 - KHỐI AI ENGINE]
🧠 **AI Vision Service (Python FastAPI + DeepFace)**
* Port: 8000 • Độc lập tính toán ArcFace 512-D, MTCNN căn chỉnh khuôn mặt, Passive 3D Anti-spoofing.

### [Ô 5 - KHỐI DATABASE]
🗄️ **Relational Database (MySQL 8.0)**
* Port: 3306 • Lưu trữ bảng dữ liệu quan hệ, log lịch sử điểm danh và mảng nhúng vector sinh trắc học.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Về kiến trúc, hệ thống áp dụng mô hình Microservices với 4 container Docker độc lập. Việc tách lõi AI sang Python giúp các thuật toán nặng không gây nghẽn tiến trình I/O của Backend Node.js, đảm bảo web luôn phản hồi mượt mà trong 20ms.

---

## 🟢 SLIDE 07: LÕI TRÍ TUỆ NHÂN TẠO & PIPELINE ARCFACE
* **Bố cục PowerPoint gợi ý:** Quy trình mũi tên 3 bước (Step 1 -> Step 2 -> Step 3)

### [Ô 1 - TIÊU ĐỀ SLIDE]
**06 • THỊ GIÁC MÁY TÍNH & DEEP LEARNING**
# PIPELINE XỬ LÝ ARCFACE & MTCNN
*Quy trình 3 giai đoạn từ phát hiện, chuẩn hóa hình học đến so khớp siêu không gian*

### [Ô 2 - BƯỚC 1: MTCNN]
📍 **Bước 1: Phát hiện & Căn chỉnh (MTCNN)**
* Quét đa tầng P-Net, R-Net, O-Net xác định tọa độ khuôn mặt (Bounding Box).
* Trích xuất 5 điểm mốc sinh trắc: 2 mắt, đỉnh mũi, 2 khóe miệng; xoay ảnh về góc chuẩn thẳng.

### [Ô 3 - BƯỚC 2: ARCFACE EMBEDDING]
🧬 **Bước 2: Trích xuất Vector Đặc trưng (ArcFace)**
* Áp dụng Additive Angular Margin Loss trên mặt cầu siêu không gian góc.
* Chuyển hóa đặc trưng khuôn mặt thành mảng Vector 512 chiều duy nhất (512-D Embedding).

### [Ô 4 - BƯỚC 3: COSINE SIMILARITY]
⚖️ **Bước 3: So khớp Khoảng cách Cosine (1:N Match)**
* Tính tích vô hướng giữa vector khuôn mặt hiện tại và ma trận đặc trưng của lớp học.
* Điều kiện chốt danh tính: `Similarity >= 0.50` và biên độ chênh lệch `Margin >= 0.02` so với người đứng nhì.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Pipeline thị giác máy tính gồm 3 bước khép kín: MTCNN định vị 5 điểm mốc để căn chỉnh mặt thẳng; ArcFace trích xuất vector 512 chiều có độ phân tách cao; và thuật toán Cosine Similarity so khớp tức thì trên ma trận với ngưỡng tin cậy 0.50.

---

## 🟢 SLIDE 08: CƠ CHẾ CHỐNG GIAN LẬN PASSIVE 3D ANTI-SPOOFING
* **Bố cục PowerPoint gợi ý:** 2 Khối kỹ thuật chính + 1 Khối so sánh phương sai Laplacian

### [Ô 1 - TIÊU ĐỀ SLIDE]
**07 • BẢO MẬT SINH TRẮC HỌC**
# CƠ CHẾ CHỐNG GIAN LẬN PASSIVE 3D
*Bảo vệ đa lớp: Phân tích vi kết cấu vân hạt màn hình & Đối soát độ sâu hình học*

### [Ô 2 - PHÂN TÍCH VÂN MA TRẬN LAPLACIAN]
🔬 **Phân Tích Vi Kết Cấu Ma Trận (Laplacian Texture)**
* Khi quét ảnh in hoặc màn hình điện thoại, camera sẽ ghi nhận vân hạt Moiré đặc trưng hoặc bị mờ phẳng.
* Thuật toán tính độ biến thiên vi sai Laplacian:
  * Phương sai < 4.0: Ảnh mờ, chất lượng kém -> Từ chối.
  * Phương sai > 1800.0: Nhiễu hạt pixel màn hình điện thoại -> Chặn đứng "Fake Face".
  * 4.0 <= Phương sai <= 1800.0: Kết cấu da người thật tự nhiên -> Hợp lệ.

### [Ô 3 - ĐỐI SOÁT HÌNH HỌC 3D & WARM-UP]
📐 **Đối Soát Hình Học 3D & Model Warm-up**
* Đối chiếu tỷ lệ tương đối giữa hai đồng tử và đỉnh sống mũi theo hình học không gian 3 chiều.
* Cơ chế Model Warm-up: Nạp sẵn trọng số mô hình khi khởi động container, loại bỏ độ trễ cold-start ở lần nhận diện đầu tiên.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Hệ thống chống giả mạo bằng cách phân tích phương sai Laplacian để phát hiện vân hạt màn hình điện thoại, kết hợp kiểm tra tỉ lệ 3D của các điểm mốc. Đây là cơ chế thụ động (Passive) nên sinh viên không cần làm cử chỉ phức tạp, tiết kiệm thời gian tối đa.

---

## 🟢 SLIDE 09: TẦNG NGHIỆP VỤ NODE.JS BACKEND & MÚI GIỜ GMT+7
* **Bố cục PowerPoint gợi ý:** 4 Khối tính năng Backend

### [Ô 1 - TIÊU ĐỀ SLIDE]
**08 • XỬ LÝ NGHIỆP VỤ & BÁO CÁO**
# TẦNG BACKEND & CHUẨN HÓA MÚI GIỜ GMT+7
*Quản lý phiên điểm danh kép, đồng bộ thời gian thực và tự động hóa xuất báo cáo đào tạo*

### [Ô 2 - ĐIỂM DANH 2 CA]
⏱️ **Cơ Chế Điểm Danh 2 Ca (Check-in / Check-out)**
* Check-in đầu giờ: Đánh giá sinh viên Đúng giờ hoặc Đi muộn.
* Check-out cuối giờ: Đảm bảo sinh viên tham gia đầy đủ buổi học, chống bỏ tiết giữa chừng.
* Tự động cập nhật trạng thái `Completed` khi hoàn tất cả 2 mốc giờ.

### [Ô 3 - CHUẨN HÓA MÚI GIỜ GMT+7]
🕒 **Khóa Cứng Múi Giờ GMT+7 (Asia/Ho_Chi_Minh)**
* Cấu hình kết nối MySQL pool với tham số `timezone: '+07:00'`.
* Ép biến môi trường `TZ=Asia/Ho_Chi_Minh` cho tất cả container.
* Thư viện ExcelJS định dạng giờ Việt Nam, hiển thị chuẩn xác từng giây không bị lệch 7 tiếng.

### [Ô 4 - BẢO MẬT & BÁO CÁO]
🔒 **Bảo Mật JWT & Xuất Báo Cáo Chuyên Cần**
* Phân quyền Role-based (Admin / Teacher / Student) qua mã thông báo JWT.
* Xuất file Excel (.xlsx) tự động tô màu theo trạng thái (Xanh lá: Có mặt, Đỏ: Vắng, Vàng: Đi muộn).

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Tầng Backend quản lý nghiệp vụ điểm danh 2 ca chặt chẽ để chống trốn tiết giữa giờ. Chúng em đã xử lý triệt để bài toán lệch 7 tiếng bằng cách khóa cứng múi giờ GMT+7 từ MySQL, Docker đến file Excel, giúp dữ liệu luôn đồng nhất 100%.

---

## 🟢 SLIDE 10: TRỢ LÝ THÔNG MINH HYBRID AI & DRONE MASCOT
* **Bố cục PowerPoint gợi ý:** Sơ đồ 3 Tầng AI Engine + 1 Khối Drone Mascot 3D

### [Ô 1 - TIÊU ĐỀ SLIDE]
**09 • TRÍ TUỆ NHÂN TẠO HỘI THOẠI**
# TRỢ LÝ THÔNG MINH HYBRID AI & DRONE MASCOT
*Động cơ suy luận 3 tầng, tối ưu chi phí token 0-cost kết hợp giao diện Drone 3D sinh động*

### [Ô 2 - TẦNG 1: GROQ LLAMA 3.3]
⚡ **Tầng 1: Groq Cloud (Llama-3.3-70B-Versatile)**
* Tốc độ suy luận siêu tốc > 250 tokens/giây, trả lời câu hỏi tự nhiên tức thì.

### [Ô 3 - TẦNG 2: GOOGLE GEMINI]
🛡️ **Tầng 2: Google Gemini 1.5 Flash (Dự Phòng)**
* Tự động kích hoạt khi Groq chạm ngưỡng rate limit hoặc mạng gặp sự cố.

### [Ô 4 - TẦNG 3: LOCAL RAG]
💾 **Tầng 3: Local RAG (Cơ Chế 0-Token Cost)**
* Phân tích câu hỏi người dùng (Intent Recognition).
* Truy vấn trực tiếp CSDL MySQL để trả lời lịch thi, danh sách vắng, phòng học mà không tốn token LLM!

### [Ô 5 - GIAO DIỆN DRONE MASCOT 3D]
🛸 **Giao Diện Drone Mascot 3D Tương Tác**
* Thiết kế Mascot Drone bay nổi (Pop-out) trên thanh chat, đồng tử xoay linh hoạt theo con trỏ chuột.
* Hỗ trợ nút Phóng to / Thu nhỏ (Maximize) panel và hiệu ứng gõ chữ stream mượt mà.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Trợ lý AI của hệ thống là mô hình Hybrid độc đáo: Tầng 1 dùng Groq Llama-3.3 siêu nhanh; Tầng 2 dự phòng qua Gemini; và đặc biệt Tầng 3 là Local RAG truy vấn trực tiếp CSDL để trả lời lịch thi, lịch học mà hoàn toàn không tốn token của nhà cung cấp AI.

---

## 🟢 SLIDE 11: GIAO DIỆN LIVE CAMERA & THUẬT TOÁN 2-FRAME VOTING
* **Bố cục PowerPoint gợi ý:** 2 Cột lớn (Cột Live Camera + Cột Thuật toán 2-Frame Voting)

### [Ô 1 - TIÊU ĐỀ SLIDE]
**10 • TỐI ƯU TRẢI NGHIỆM & ĐỘ ỔN ĐỊNH**
# GIAO DIỆN LIVE CAMERA & 2-FRAME VOTING
*Kiểm soát luồng video thời gian thực và thuật toán cửa sổ trượt triệt tiêu nhận diện nhầm*

### [Ô 2 - GIAO DIỆN CAMERA]
📹 **Giao Diện Hướng Dẫn Sinh Viên Trực Quan**
* Khung Oval sinh trắc học hướng dẫn cự ly chuẩn (Cách camera 40 - 70 cm).
* Đổi màu trạng thái thông minh: Xanh lục (Nhận diện thành công), Đỏ (Cảnh báo giả mạo), Xanh dương (Đang quét).
* Tích hợp sơ đồ ghế thi (Seat Matrix) hiển thị vị trí bàn thi của thí sinh.

### [Ô 3 - THUẬT TOÁN 2-FRAME VOTING BUFFER]
🎯 **Thuật Toán 2-Frame Voting Buffer**
* **Vấn đề thực tế:** Khi có người đi lướt qua phía sau sinh viên, camera có thể bắt nhầm trong 1 frame ngắn.
* **Cơ chế hoạt động:**
  * Mở cửa sổ trượt kích thước $K = 3$ frame liên tiếp: `Buffer = [ID_1, ID_2, ID_3]`.
  * Yêu cầu tần suất xuất hiện: `Count(ID) >= 2` trong cửa sổ trượt.
  * Chỉ khi 2 frame liên tiếp xác nhận đúng cùng 1 sinh viên mới kích hoạt ghi nhận điểm danh.
* **Kết quả:** Triệt tiêu 100% hiện tượng chập chờn và lỗi nhận diện nhầm người đi ngang qua.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Khi đưa hệ thống vào lớp học thực tế, nhóm nhận thấy nguy cơ bắt nhầm người đi lướt qua phía sau. Em và nhóm đã xây dựng thuật toán 2-Frame Voting Buffer: yêu cầu 2 frame liên tiếp xác nhận cùng 1 sinh viên mới chốt điểm danh. Nhờ đó, độ ổn định đạt mức tuyệt đối.

---

## 🟢 SLIDE 12: VAI TRÒ & ĐÓNG GÓP CỦA SINH VIÊN (LỤC VĂN SƠN)
* **Bố cục PowerPoint gợi ý:** 3 Cột thành tích đóng góp chi tiết

### [Ô 1 - TIÊU ĐỀ SLIDE]
**11 • ĐÓNG GÓP CỦA TÁC GIẢ**
# VAI TRÒ & ĐÓNG GÓP CỦA SINH VIÊN
*Sinh viên thực hiện: Lục Văn Sơn • MSSV: 2310900087 • K23CNT3*

### [Ô 2 - ĐÓNG GÓP 1: KIỂM THỬ QA/QC]
🧪 **01. Thiết Kế & Thực Thi 35 Testcases (QA/QC)**
* Xây dựng ma trận kiểm thử bao quát: Kiểm thử chức năng (Functional), Kiểm thử ca biên (Edge cases), Kiểm thử bảo mật (Security Spoofing).
* Thực hiện hơn 300 lượt kiểm thử trực tiếp trên nhiều điều kiện ánh sáng, góc nghiêng mặt và phụ kiện (kính, khẩu trang).

### [Ô 3 - ĐÓNG GÓP 2: BACKEND & SỬA LỖI MÚI GIỜ]
⚙️ **02. Hỗ Trợ API Backend & Sửa Lỗi Lệch Giờ**
* Tham gia lập trình API quản lý danh mục Khoa, Lớp, Phòng học và Ca học chuẩn (Shifts).
* Trực tiếp phát hiện và giải quyết triệt để lỗi lệch múi giờ UTC trong CSDL Docker và module xuất Excel `ExcelJS`.

### [Ô 4 - ĐÓNG GÓP 3: GIAO DIỆN & TỐI ƯU CHATBOT]
💻 **03. Tối Ưu Giao Diện UI/UX & AI Assistant**
* Hiện thực hóa tính năng Phóng to / Thu nhỏ (Maximize) khung chat tiện lợi cho người dùng.
* Tích hợp cơ chế Stream gõ chữ thời gian thực cho Trợ lý AI và hỗ trợ ánh xạ dữ liệu CSDL vào Local RAG.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Kính thưa Thầy Cô, trong đề tài này với vai trò QA/QC và Hỗ trợ Backend, em đã trực tiếp: Thiết kế bộ 35 Testcases toàn diện; Tham gia xây dựng các API quản lý danh mục và trực tiếp sửa triệt để lỗi lệch 7 tiếng trong file Excel; Đồng thời tối ưu giao diện Chatbox với tính năng Phóng to và Stream gõ chữ mượt mà.

---

## 🟢 SLIDE 13: BẢNG KẾT QUẢ ĐO ĐẠC & KIỂM THỬ THỰC TẾ
* **Bố cục PowerPoint gợi ý:** Bảng thống kê dữ liệu thực nghiệm + 3 Hộp số liệu tổng kết

### [Ô 1 - TIÊU ĐỀ SLIDE]
**12 • KẾT QUẢ ĐO ĐẠC & ĐÁNH GIÁ**
# KẾT QUẢ THỰC NGHIỆM ĐO ĐẠC
*Số liệu tổng hợp qua hơn 300 lượt kiểm thử thực tế trên hệ thống*

### [Ô 2 - BẢNG SỐ LIỆU ĐO ĐẠC]
| Kịch Bản Kiểm Thử | Số Lượt Thử | Tỷ Lệ Nhận Diện Đúng | Độ Trễ Trung Bình | Kết Quả Đánh Giá |
| :--- | :---: | :---: | :---: | :---: |
| **Ánh sáng chuẩn phòng học** | 100 lượt | **99.4%** | 215 ms | Đạt xuất sắc |
| **Góc mặt nghiêng (15° - 35°)** | 60 lượt | **98.2%** | 225 ms | Hoạt động tốt |
| **Đeo kính cận / Đổi kiểu tóc** | 50 lượt | **97.5%** | 230 ms | Nhận diện chính xác |
| **Ánh sáng yếu (< 50 lux) / Ngược sáng**| 40 lượt | **95.0%** | 245 ms | Đạt yêu cầu |
| **Cố tình dùng ảnh in màu A4** | 30 lượt | **0.0% (Chặn 100%)**| 180 ms | Bị phát hiện giả mạo |
| **Dùng video trên màn hình điện thoại**| 20 lượt | **0.0% (Chặn 100%)**| 185 ms | Bị phát hiện giả mạo |

### [Ô 3 - CÁC CHỈ SỐ NGHIỆM THU]
* **99.4%** — Độ chính xác trong điều kiện lớp học chuẩn
* **215 ms** — Độ trễ trung bình toàn trình (End-to-End)
* **0.00%** — Tỷ lệ chấp nhận sai (False Acceptance Rate - FAR)

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Đây là bảng số liệu đo đạc qua hơn 300 lượt test: Ở điều kiện chuẩn, hệ thống đạt độ chính xác 99.4% với độ trễ chỉ 215ms. Khi nghiêng mặt hoặc đeo kính, hệ thống vẫn duy trì trên 97.5%. Đặc biệt, 100% các hành vi cố tình dùng ảnh in hoặc điện thoại đều bị hệ thống phát hiện và chặn đứng.

---

## 🟢 SLIDE 14: ĐÁNH GIÁ & SO SÁNH VỚI GIẢI PHÁP HIỆN CÓ
* **Bố cục PowerPoint gợi ý:** Bảng so sánh 3 cột (Điểm danh giấy vs Máy vân tay vs Đề tài)

### [Ô 1 - TIÊU ĐỀ SLIDE]
**13 • SO SÁNH GIẢI PHÁP**
# SO SÁNH ĐA CHIỀU CÁC PHƯƠNG PHÁP
*Khẳng định ưu thế vượt trội về hiệu năng, chi phí và mức độ an toàn bảo mật*

### [Ô 2 - BẢNG SO SÁNH]
| Tiêu Chí Đánh Giá | Điểm Danh Giấy / QR Tĩnh | Máy Chấm Công Vân Tay/Thẻ | Hệ Thống Đề Tài (FaceSystem) |
| :--- | :---: | :---: | :---: |
| **Thời gian điểm danh** | 10 - 15 phút / lớp | 1.5 - 2 giây / người | **< 0.25 giây / người (Siêu tốc)** |
| **Nguy cơ điểm danh hộ** | Rất cao (Ký thay, gửi QR) | Trung bình (Quẹt thẻ hộ) | **Triệt tiêu 100% (Passive Liveness)** |
| **Chi phí thiết bị phần cứng**| Thấp | Rất cao (Mua máy quét riêng)| **0 VNĐ (Tận dụng webcam có sẵn)** |
| **Vệ sinh & Trải nghiệm** | Tiếp xúc giấy / bút | Chạm ngón tay nhiều người | **Hoàn toàn không chạm (Contactless)**|
| **Quản lý phòng thi & Ghế** | Lập danh sách giấy rời rạc| Không hỗ trợ | **Tích hợp Sơ đồ ghế số hóa** |
| **Trợ lý AI hỗ trợ tra cứu** | Không có | Không có | **Tích hợp Hybrid AI Chatbot 24/7** |

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> So sánh với các phương pháp hiện có: So với điểm danh giấy, hệ thống rút ngắn thời gian từ 15 phút xuống dưới 1 giây; So với máy quẹt thẻ hay vân tay, hệ thống vượt trội về chi phí khi không cần mua sắm thiết bị chuyên dụng, thao tác không chạm hợp vệ sinh và tích hợp sâu với sơ đồ phòng thi và Trợ lý AI.

---

## 🟢 SLIDE 15: KẾT LUẬN & ĐỊNH HƯỚNG PHÁT TRIỂN
* **Bố cục PowerPoint gợi ý:** 2 Cột (Thành quả đạt được vs Định hướng tương lai)

### [Ô 1 - TIÊU ĐỀ SLIDE]
**14 • KẾT LUẬN & HƯỚNG PHÁT TRIỂN**
# TỔNG KẾT & LỘ TRÌNH MỞ RỘNG
*Khẳng định giá trị thực tiễn và lộ trình nâng cấp công nghệ trong tương lai*

### [Ô 2 - THÀNH TỰU ĐẠT ĐƯỢC]
🏆 **Thành Quả Đã Hoàn Thành**
* Xây dựng thành công hệ sinh thái điểm danh và khảo thí hoàn chỉnh, vận hành ổn định trên Docker Microservices.
* Lõi AI ArcFace đạt độ chính xác > 99.2%, thời gian đối soát 1:N tức thời dưới 250ms.
* Triệt tiêu 100% rủi ro gian lận nhờ công nghệ Passive 3D Anti-spoofing và thuật toán 2-Frame Voting Buffer.
* Số hóa sơ đồ phòng thi Seat Matrix và tích hợp Trợ lý AI Hybrid tra cứu thông tin học vụ tiện lợi.

### [Ô 3 - ĐỊNH HƯỚNG MỞ RỘNG TIẾP THEO]
🚀 **Lộ Trình Phát Triển Tương Lai**
* **Camera RTSP Multi-face:** Mở rộng luồng camera góc rộng ở cửa lớp, điểm danh đồng thời nhiều sinh viên cùng lúc khi đi qua cửa.
* **Công nghệ chống giả mạo rPPG:** Phân tích biến thiên nhịp mạch dưới da qua quang phổ ánh sáng để phát hiện mặt nạ silicon 3D siêu tinh vi.
* **Mobile App:** Phát triển ứng dụng di động cho sinh viên nhận thông báo ca thi và kết quả điểm danh theo thời gian thực.

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Tóm lại, đề tài đã hoàn thành toàn bộ mục tiêu: xây dựng hệ thống điểm danh và khảo thí thông minh với độ chính xác cao và chống giả mạo tin cậy. Trong tương lai, nhóm định hướng tích hợp luồng camera RTSP góc rộng để điểm danh cùng lúc nhiều người và nghiên cứu công nghệ quang phổ rPPG.

---

## 🟢 SLIDE 16: LỜI CẢM ƠN & PHIÊN HỎI - ĐÁP (Q&A)
* **Bố cục PowerPoint gợi ý:** Slide kết thúc trang trọng với thông điệp cảm ơn và thông tin liên hệ

### [Ô 1 - TIÊU ĐỀ SLIDE]
**KHOÁ LUẬN TỐT NGHIỆP • K23CNT3**
# CHÂN THÀNH CẢM ƠN QUÝ THẦY CÔ!
*Hội Đồng Chấm Khóa Luận Tốt Nghiệp • Khoa Công Nghệ Thông Tin*

### [Ô 2 - THÔNG ĐIỆP BẢO VỆ]
💬 **PHIÊN HỎI - ĐÁP & PHẢN BIỆN (Q&A)**
* Rất mong nhận được những ý kiến đóng góp quý báu của Quý Thầy Cô để đề tài ngày càng hoàn thiện hơn nữa!
* Sinh viên sẵn sàng giải trình và trả lời các câu hỏi phản biện của Hội đồng.

### [Ô 3 - THÔNG TIN LIÊN HỆ TÁC GIẢ]
* **Sinh viên báo cáo:** Lục Văn Sơn
* **Mã số sinh viên:** 2310900087
* **Lớp:** K23CNT3
* **Đề tài:** Hệ thống Điểm danh & Quản lý Khảo thí bằng Nhận diện Khuôn mặt (DeepFace AI)

### [GHI CHÚ DIỄN GIẢ (SPEAKER NOTES)]
> Bài báo cáo khóa luận tốt nghiệp của em đến đây là kết thúc. Em xin được gửi lời cảm ơn chân thành nhất đến Quý Thầy Cô trong Hội đồng đã dành thời gian theo dõi bài thuyết trình. Em rất mong nhận được những ý kiến đóng góp quý báu của Thầy Cô. Em xin sẵn sàng lắng nghe và trả lời các câu hỏi của Hội đồng ạ. Em xin trân trọng cảm ơn!
