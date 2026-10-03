# KỊCH BẢN & NỘI DUNG SLIDE THUYẾT TRÌNH BẢO VỆ KHÓA LUẬN / THỰC TẬP TỐT NGHIỆP

> **Đề tài:** Hệ thống Điểm danh và Quản lý Khảo thí bằng Nhận diện Khuôn mặt dựa trên Deep Learning & Chống gian lận 3D (University Face System)  
> **Sinh viên thực hiện:** Lục Văn Sơn  
> **Mã số sinh viên (MSSV):** 2310900087  
> **Lớp chuyên ngành:** K23CNT3  
> **Vai trò trong đề tài:** Kiểm thử phần mềm (QA/QC Engineer), Xây dựng Testcase, Tối ưu Giao diện UI/UX & Hỗ trợ phát triển API Backend  
> **File trình chiếu tương tác:** [`presentation.html`](./presentation.html) (Mở trực tiếp bằng bất kỳ trình duyệt nào)

---

## MỤC LỤC KỊCH BẢN THUYẾT TRÌNH (16 SLIDES - 15 ĐẾN 20 PHÚT)

| Slide | Chủ Đề Slide | Thời Gian Dự Kiến | Trọng Tâm Nội Dung |
| :---: | :--- | :---: | :--- |
| **01** | Tiêu đề & Giới thiệu Tác giả | 1.0 phút | Giới thiệu tên đề tài, tác giả Lục Văn Sơn, MSSV, vai trò QA/QC & Backend Supporter |
| **02** | Đặt vấn đề & Tính cấp thiết | 1.0 phút | Nêu 3 nút thắt lớn: lãng phí 15p đầu giờ, gian lận điểm danh hộ, quản lý thi thủ công |
| **03** | **Giới thiệu Tổng quan Hệ thống (MỚI)** | 1.5 phút | 3 phân hệ cốt lõi: Admin Portal, Teacher Portal, Student & AI Portal, Zero-Hardware |
| **04** | **6 Điểm Đột phá Nổi bật (MỚI)** | 1.5 phút | 1:N < 250ms, Passive 3D Anti-Spoofing, 2-Frame Voting, Seat Matrix, GMT+7, Hybrid AI |
| **05** | Mục tiêu nghiên cứu & Chỉ tiêu kỹ thuật | 1.0 phút | 4 chỉ tiêu định lượng: tốc độ < 250ms, độ chính xác > 99%, chống giả mạo 100%, AI 24/7 |
| **06** | Tổng quan Kiến trúc Microservices | 1.5 phút | Sơ đồ Docker 3 containers: React 18, Node.js Express, Python AI Service, MySQL 8.0 |
| **07** | Lõi Trí tuệ Nhân tạo & Pipeline ArcFace | 1.5 phút | 3 giai đoạn: MTCNN 5 keypoints, trích xuất Vector 512-D, so khớp Cosine Distance |
| **08** | Cơ chế Chống Gian lận Passive 3D Anti-Spoofing | 1.5 phút | Phân tích vân kết cấu Laplacian Variance và đối soát tỉ lệ hình học 3D, Model Warm-up |
| **09** | Tầng Nghiệp vụ Node.js Backend & Múi giờ GMT+7 | 1.0 phút | Điểm danh 2 ca Check-in/Check-out, khóa cứng múi giờ GMT+7, xuất Excel báo cáo |
| **10** | Trợ lý Hybrid AI Chatbot & Drone Mascot | 1.5 phút | Động cơ 3 tầng: Groq Llama-3.3, Gemini Flash, Local RAG không tốn token, Drone Mascot |
| **11** | Giao diện Live Camera & Thuật toán 2-Frame Voting | 1.0 phút | Khung Oval chuẩn hóa, thuật toán 2-Frame Voting Buffer chống bắt nhầm, Sơ đồ ghế thi |
| **12** | Vai trò & Đóng góp của Sinh viên (Lục Văn Sơn) | 1.5 phút | Xây dựng 35 Testcases toàn diện, sửa lỗi lệch múi giờ, tính năng Maximize Chatbox |
| **13** | Bảng Kết quả Đo đạc & Kiểm thử Thực nghiệm | 1.0 phút | Số liệu thực nghiệm: 99.4% điều kiện chuẩn, chặn ảnh giả 100%, độ trễ trung bình 220ms |
| **14** | So sánh & Đánh giá với Giải pháp Hiện có | 1.0 phút | So sánh với điểm danh giấy và máy quẹt thẻ/vân tay: nhanh gấp 10 lần, chi phí bằng 0 |
| **15** | Kết luận & Hướng phát triển Tiếp theo | 1.0 phút | Tổng kết thành tựu và lộ trình nâng cấp: Camera RTSP góc rộng, công nghệ rPPG |
| **16** | Lời cảm ơn & Mở phiên Hỏi - Đáp (Q&A) | 0.5 phút | Cảm ơn Hội đồng, sẵn sàng trả lời câu hỏi phản biện |

---

## CHI TIẾT TỪNG SLIDE & LỜI THOẠI THUYẾT TRÌNH (SPEAKER NOTES)

### 🟢 SLIDE 01: TIÊU ĐỀ & GIỚI THIỆU ĐỀ TÀI
* **Tiêu đề trên slide:** HỆ THỐNG ĐIỂM DANH & QUẢN LÝ KHẢO THÍ BẰNG NHẬN DIỆN KHUÔN MẶT THÔNG MINH (DeepFace AI)
* **Thông tin hiển thị:** Sinh viên thực hiện: Lục Văn Sơn - MSSV: 2310900087 - Lớp: K23CNT3.
* **Các chỉ số nổi bật:** Độ chính xác > 99.2%, Tốc độ < 250ms, Chống gian lận 100%.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Kính chào quý Thầy Cô trong Hội đồng chấm khóa luận tốt nghiệp!  
  > Em tên là **Lục Văn Sơn**, sinh viên lớp K23CNT3, mã số sinh viên 2310900087.  
  > Hôm nay, em xin phép được đại diện nhóm nghiên cứu trình bày báo cáo khóa luận tốt nghiệp với đề tài: **'Xây dựng Hệ thống Điểm danh và Quản lý Khảo thí bằng Nhận diện Khuôn mặt dựa trên Deep Learning & Chống gian lận 3D'**.  
  > Đề tài được xây dựng trên nền tảng thị giác máy tính hiện đại với mô hình ArcFace và MTCNN, tích hợp công nghệ chống giả mạo Passive Liveness 3D và kiến trúc Microservices phân tán trên nền tảng Docker."

---

### 🟢 SLIDE 02: THỰC TRẠNG & TÍNH CẤP THIẾT CỦA ĐỀ TÀI
* **Nội dung hiển thị:** 3 nút thắt lớn: Lãng phí 10-15 phút/tiết học; Gian lận điểm danh hộ dễ dàng; Thống kê điều kiện dự thi thủ công tốn nhân lực.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Kính thưa Thầy Cô, xuất phát điểm của đề tài đến từ những bất cập rất thực tế trong công tác quản lý đào tạo tại các trường đại học hiện nay:  
  > 1. **Thứ nhất, lãng phí thời gian:** Một lớp học phần từ 60 đến 100 sinh viên thường tiêu tốn của giảng viên từ 10 đến 15 phút đầu giờ chỉ để đọc tên kiểm diện từng người.  
  > 2. **Thứ hai, gian lận tinh vi:** Điểm danh giấy rất dễ ký hộ, thẻ từ có thể quẹt hộ và mã QR tĩnh có thể chụp ảnh gửi từ xa để điểm danh hộ.  
  > 3. **Thứ ba, thống kê thủ công:** Cuối kỳ, giảng viên phải tự rà soát tỷ lệ vắng mặt từng buổi để lọc danh sách sinh viên vắng quá 20% bị cấm thi.  
  > Do đó, việc xây dựng một hệ thống điểm danh tự động bằng khuôn mặt 1:N không chạm, chính xác và có khả năng chống giả mạo là vô cùng cấp thiết."

---

### 🟢 SLIDE 03: GIỚI THIỆU TỔNG QUAN HỆ THỐNG (UNIVERSITY FACE SYSTEM)
* **Nội dung hiển thị:**
  - **Phân hệ Admin (Phòng Đào Tạo):** Quản lý cấu trúc đào tạo (Khoa, Lớp, Môn học, Phòng học, Ca học), xếp lịch thi, cấu hình sơ đồ ghế phòng thi (Seat Matrix), tự động phát hiện sinh viên vắng > 20% để cấm thi.
  - **Phân hệ Teacher (Giảng Viên):** Quản lý lịch dạy theo tuần, mở ca điểm danh AI 1:N tự động 2 ca (Check-in/Check-out), sửa điểm danh thủ công, xuất báo cáo Excel (.xlsx) chuẩn GMT+7.
  - **Phân hệ Student (Sinh Viên & AI):** Đăng ký 3 góc khuôn mặt chuẩn (Thẳng - Trái - Phải), điểm danh không chạm dưới 0.3s, tra cứu lịch thi, phòng thi và số tiết vắng với Trợ lý AI Hybrid & Drone Mascot.
  - **Điểm cốt lõi:** Triển khai **Zero-Hardware Cost** - Hoạt động ngay trên Laptop/PC sẵn có của giảng viên và webcam lớp học mà không phụ thuộc máy quét đắt tiền.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Tiếp theo, em xin giới thiệu tổng quan về Hệ thống Điểm danh và Quản lý Khảo thí University Face System.  
  > Đây là một nền tảng số hóa toàn diện quy trình kiểm diện và tổ chức khảo thí trong trường đại học, phục vụ đồng thời 3 nhóm đối tượng:  
  > - Thứ nhất, **Phòng Đào tạo** quản lý danh mục toàn trường, thiết lập ca học chuẩn và cấu hình sơ đồ chỗ ngồi phòng thi.  
  > - Thứ hai, **Cổng Giảng viên** cho phép mở ca điểm danh nhận diện khuôn mặt tự động 2 ca: Check-in đầu giờ và Check-out cuối giờ, đồng thời xuất báo cáo chuyên cần Excel chuẩn hóa chỉ với 1 cú click.  
  > - Thứ ba, **Cổng Sinh viên & Trợ lý AI** giúp sinh viên đăng ký 3 góc mặt chuẩn hóa, điểm danh không chạm tức thời và tra cứu thông tin học vụ 24/7.  
  > Điểm đặc biệt nhất là hệ thống vận hành hoàn toàn không chạm (contactless) và không đòi hỏi mua sắm thiết bị phần cứng đắt tiền, tận dụng chính webcam laptop sẵn có của giảng viên."

---

### 🟢 SLIDE 04: 6 ĐIỂM ĐỘT PHÁ NỔI BẬT CỦA HỆ THỐNG
* **Nội dung hiển thị:** 6 cải tiến công nghệ cốt lõi:
  1. **⚡ Nhận diện 1:N siêu tốc < 250ms:** Ứng dụng ArcFace 512-D kết hợp cơ chế Model Warm-up khởi động trước, so khớp cả danh sách lớp trong tích tắc.
  2. **🛡️ Chống giả mạo Passive 3D Liveness:** Phân tích vi kết cấu vân hạt Laplacian Variance và tỉ lệ hình học 3D, chặn đứng 100% gian lận ảnh in/màn hình điện thoại mà không bắt sinh viên cử chỉ phiền hà.
  3. **🎯 Thuật toán 2-Frame Voting Buffer:** Trượt cửa sổ 3 frame liên tiếp, yêu cầu 2 frame khớp cùng 1 mã sinh viên mới chốt điểm danh; triệt tiêu hoàn toàn hiện tượng bắt nhầm người đi ngang qua.
  4. **🪑 Sơ đồ ghế thi số hóa (Seat Matrix):** Quản lý ca thi gắn với sơ đồ phòng thi hàng x cột (Rows x Cols), tự động sáng đèn vị trí thí sinh khi vào phòng và tự động lọc danh sách cấm thi theo quy chế.
  5. **🕒 Khóa cứng múi giờ GMT+7 & ExcelJS:** Đồng bộ chuẩn xác múi giờ Việt Nam `Asia/Ho_Chi_Minh` xuyên suốt từ CSDL MySQL Docker, Node.js API cho tới file Excel xuất ra.
  6. **🤖 Trợ lý Hybrid AI & Drone Mascot:** Kết hợp Groq Llama-3.3-70B tốc độ cao + Gemini Flash + Local RAG CSDL 0-token cost giải đáp lịch thi/học 24/7; Drone Mascot 3D xoay mắt theo chuột sinh động.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Đây là slide quan trọng nhất tóm tắt 6 điểm nổi bật vượt trội của hệ thống so với các đề tài nghiên cứu hay phần mềm điểm danh thương mại trên thị trường:  
  > 1. Thứ nhất, **Tốc độ đối soát 1:N siêu nhanh dưới 250ms**: sinh viên chỉ cần lướt qua camera là hệ thống đã nhận diện xong, không gây ùn tắc tại cửa phòng học.  
  > 2. Thứ hai, **Công nghệ chống giả mạo Passive 3D**: phân tích vân ảnh Laplacian và độ sâu quang học, ngăn chặn triệt để hành vi dùng ảnh in màu hay điện thoại phát lại video.  
  > 3. Thứ ba, **Thuật toán 2-Frame Voting**: giải quyết triệt để lỗi chập chờn khi có người đi lướt qua phía sau sinh viên.  
  > 4. Thứ tư, **Sơ đồ phòng thi số hóa Seat Matrix**: trực quan hóa vị trí thí sinh theo từng bàn thi thực tế và tự động tính điều kiện cấm thi theo quy chế đào tạo.  
  > 5. Thứ năm, **Đồng bộ chuẩn xác múi giờ GMT+7**: khắc phục lỗi lệch 7 tiếng kinh điển của các hệ thống Docker, xuất báo cáo Excel chuẩn xác từng giây.  
  > 6. Và thứ sáu, **Trợ lý Hybrid AI đa tầng**: kết hợp Llama-3.3 trên Groq siêu tốc và cơ chế Local RAG truy vấn CSDL giúp trả lời mọi thắc mắc học vụ mà hoàn toàn không tốn chi phí token."

---

### 🟢 SLIDE 05: MỤC TIÊU & CHỈ TIÊU KỸ THUẬT
* **Nội dung hiển thị:** 4 mục tiêu định lượng: Tốc độ < 250ms; Độ chính xác > 99.2%; Chặn gian lận 100%; Trợ lý AI tư vấn 24/7.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Để giải quyết các vấn đề trên, đề tài đã đặt ra các chỉ tiêu kỹ thuật định lượng cụ thể:  
  > - **Về tốc độ:** Thời gian nhận diện và chốt kết quả dưới 250 miligiây mỗi sinh viên.  
  > - **Về độ chính xác:** Đạt tỷ lệ trên 99.2% ngay cả trong điều kiện sinh viên thay đổi kiểu tóc, đeo kính hoặc ánh sáng thay đổi.  
  > - **Về an toàn sinh trắc học:** Ngăn chặn 100% các hành vi dùng ảnh in màu hoặc màn hình điện thoại để điểm danh hộ.  
  > - **Về tính năng thông minh:** Tích hợp Trợ lý AI Hybrid giải đáp tức thời lịch học, lịch thi và quy chế thi cho sinh viên và giảng viên 24/7."

---

### 🟢 SLIDE 06: KIẾN TRÚC HỆ THỐNG MICROSERVICES (DOCKER)
* **Nội dung hiển thị:** Sơ đồ mạng Bridge Network gồm 4 container: React 18 (:5173), Node.js API (:5000), Python AI Service (:8000), MySQL 8.0 (:3306).
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Kính thưa Hội đồng, hệ thống được thiết kế theo kiến trúc **Microservices dạng Dockerized Containers** gồm 3 dịch vụ độc lập:  
  > - **Frontend (React 18 + Vite):** Chạy ở cổng 5173, đảm nhận giao diện người dùng, điều khiển camera và hiển thị kết quả trực quan 60 FPS.  
  > - **Backend API (Node.js Express):** Chạy ở cổng 5000, xử lý luồng nghiệp vụ, phân quyền JWT, điều phối cơ sở dữ liệu và khóa cứng múi giờ GMT+7.  
  > - **Python AI Service (FastAPI + DeepFace):** Chạy ở cổng 8000 nội bộ, chuyên trách tính toán thị giác máy tính và chống giả mạo.  
  > - **Database Server:** MySQL 8.0 lưu trữ quan hệ và vector nhúng sinh trắc học.  
  > Việc tách riêng lõi AI sang Python giúp các thuật toán xử lý ảnh nặng không bao giờ làm nghẽn tiến trình I/O của Backend web."

---

### 🟢 SLIDE 07: LÕI TRÍ TUỆ NHÂN TẠO & PIPELINE ARCFACE
* **Nội dung hiển thị:** 3 giai đoạn: MTCNN phát hiện mặt & 5 keypoints -> ArcFace trích xuất vector 512-D -> So khớp khoảng cách Cosine.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Về quy trình xử lý thị giác máy tính, hệ thống triển khai theo một pipeline khép kín 3 tầng:  
  > - **Tầng 1 - MTCNN:** Phát hiện vị trí khuôn mặt và 5 điểm mốc sinh trắc: 2 mắt, đỉnh mũi và 2 khóe miệng. Dựa vào 5 điểm này, ảnh được xoay và căn chỉnh (face alignment) về góc chuẩn thẳng.  
  > - **Tầng 2 - ArcFace Model:** Đây là mô hình Deep Learning sử dụng hàm mất mát góc phụ (Additive Angular Margin Loss), trích xuất khuôn mặt thành **Vector 512 chiều**.  
  > - **Tầng 3 - So khớp Cosine Similarity:** Hệ thống tính tích vô hướng ma trận giữa vector hiện tại và ma trận vector của lớp học. Nếu độ tương đồng vượt ngưỡng `MATCH_THRESHOLD >= 0.50` và biên độ sai phân `MARGIN >= 0.02` so với người đứng nhì, hệ thống sẽ xác nhận danh tính thành công."

---

### 🟢 SLIDE 08: CƠ CHẾ CHỐNG GIAN LẬN PASSIVE 3D ANTI-SPOOFING
* **Nội dung hiển thị:** Phân tích vi kết cấu vân ảnh Laplacian Variance; Đối soát tỉ lệ hình học không gian 3D; Cơ chế Model Warm-up.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Để chống gian lận khi điểm danh, hệ thống tích hợp giải pháp **Passive 3D Anti-Spoofing** với 2 cơ chế kiểm tra đồng thời:  
  > 1. **Phân tích kết cấu ma trận Laplacian (Texture Analysis):** Khi đưa điện thoại hoặc ảnh in lên trước camera, bề mặt sẽ phát ra vân hạt Moiré đặc trưng hoặc bị mờ phẳng. Hệ thống tính toán phương sai Laplacian: nếu phương sai < 4.0 (ảnh mờ) hoặc > 1800.0 (nhiễu pixel màn hình), hệ thống lập tức từ chối và cảnh báo 'Face Fake'.  
  > 2. **Đối soát hình học 3D:** Kiểm tra tỷ lệ khoảng cách giữa hai mắt và sống mũi theo độ sâu hình học.  
  > Đặc biệt, đây là cơ chế **Passive (không thụ động)**, nghĩa là sinh viên không cần phải làm theo các hiệu lệnh gật đầu, chớp mắt phức tạp, giúp quá trình điểm danh diễn ra tự nhiên chỉ trong chưa đầy 0.3 giây."

---

### 🟢 SLIDE 09: TẦNG NGHIỆP VỤ NODE.JS BACKEND & MÚI GIỜ GMT+7
* **Nội dung hiển thị:** Điểm danh 2 ca (Check-in/Check-out); Khóa cứng múi giờ GMT+7 Asia/Ho_Chi_Minh; Xuất báo cáo Excel chuyên nghiệp; Phân quyền JWT.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Ở tầng Backend Node.js, hệ thống quản lý toàn bộ nghiệp vụ theo mô hình MVC:  
  > - **Cơ chế điểm danh 2 ca:** Điểm danh đầu giờ (Check-in) để ghi nhận đúng giờ hay đi muộn; Điểm danh cuối giờ (Check-out) để đảm bảo sinh viên không bỏ tiết giữa chừng. Khi có đủ cả 2 mốc giờ, trạng thái sẽ tự động chuyển thành `Completed`.  
  > - **Chuẩn hóa múi giờ GMT+7:** Một lỗi kinh điển trong các hệ thống điểm danh là lệch múi giờ UTC khiến giờ điểm danh bị sai 7 tiếng. Em và nhóm đã khóa cứng tham số `timezone: '+07:00'` tại MySQL pool, thiết lập `TZ=Asia/Ho_Chi_Minh` cho container và sử dụng thư viện `ExcelJS` định dạng chuẩn giờ Việt Nam. Báo cáo Excel xuất ra hiển thị chính xác đến từng giây, tự động phân màu trạng thái trực quan."

---

### 🟢 SLIDE 10: TRỢ LÝ THÔNG MINH HYBRID AI & DRONE MASCOT
* **Nội dung hiển thị:** Động cơ Hybrid 3 tầng: Groq Llama-3.3-70B -> Gemini 1.5 Flash -> Local RAG; Giao diện Drone Mascot 3D với hiệu ứng bay nổi (Pop-out).
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Một điểm sáng tạo nổi bật của đề tài là **Trợ lý Hybrid AI Chatbot**:  
  > - Để AI trả lời thông minh nhưng không tốn kém chi phí token, hệ thống sử dụng kiến trúc kết hợp: Tầng 1 gọi qua **Groq Cloud chạy Llama-3.3-70B** cho tốc độ phản hồi cực nhanh trên 250 token/giây; Tầng 2 dự phòng qua **Google Gemini**; Và Tầng 3 là **Local RAG** truy vấn trực tiếp CSDL MySQL khi hỏi về lịch thi, danh sách sinh viên mà **hoàn toàn không tiêu tốn token LLM**.  
  > - Về mặt giao diện, Chatbox được trang bị chú **Drone Mascot 3D** tương tác xoay mắt theo chuột và hiệu ứng **Pop-out** bay nổi trên thanh tiêu đề, đi kèm tính năng **Phóng to / Thu nhỏ** giúp người dùng dễ dàng theo dõi thông tin."

---

### 🟢 SLIDE 11: GIAO DIỆN LIVE CAMERA & THUẬT TOÁN 2-FRAME VOTING
* **Nội dung hiển thị:** Khung Oval hướng dẫn; Thuật toán Multi-frame Voting Buffer (VOTE_WINDOW=3, THRESHOLD=2); Sơ đồ phòng thi Seat Matrix.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Khi đưa hệ thống vào thử nghiệm thực tế tại lớp học, nhóm em phát hiện vấn đề: nếu có người đi lướt qua phía sau sinh viên đang điểm danh, camera có thể bắt nhầm.  
  > Để giải quyết, em và nhóm đã xây dựng thuật toán **2-Frame Voting Buffer**:  
  > Hệ thống mở một cửa sổ trượt 3 frame liên tiếp và yêu cầu phải có **ít nhất 2 frame liên tiếp xác nhận đúng cùng một mã sinh viên** thì mới chốt điểm danh. Nhờ thuật toán này, hiện tượng chập chờn và bắt nhầm người đã được triệt tiêu 100%.  
  > Đồng thời, ở phân hệ tổ chức thi, giao diện hiển thị **Sơ đồ chỗ ngồi (Seat Matrix)** theo hàng và cột thực tế của phòng thi, tự động sáng đèn vị trí thí sinh khi vào phòng."

---

### 🟢 SLIDE 12: VAI TRÒ & ĐÓNG GÓP CỦA SINH VIÊN (LỤC VĂN SƠN)
* **Nội dung hiển thị:** Xây dựng bộ 35 Testcases toàn diện; Kiểm thử chức năng, ca biên & bảo mật; Hỗ trợ API Backend & sửa lỗi lệch giờ; Tối ưu UI/UX Chatbox.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Kính thưa Thầy Cô, trong suốt quá trình thực hiện đề tài, với vai trò là **Kiểm thử viên (QA/QC) và Hỗ trợ Backend**, em đã trực tiếp đóng góp các hạng mục trọng tâm sau:  
  > 1. **Xây dựng bộ 35 Testcases chi tiết:** Bao quát từ kiểm thử chức năng, kiểm thử các trường hợp biên (ánh sáng yếu, đeo kính, nghiêng mặt), đến kiểm thử bảo mật chống giả mạo ảnh in/điện thoại và kiểm thử tải đồng thời.  
  > 2. **Hỗ trợ phát triển API Backend:** Tham gia xây dựng các API quản lý Khoa, Lớp, Phòng học, Ca học; trực tiếp phát hiện và giải quyết triệt để lỗi lệch múi giờ trong file báo cáo Excel và cấu hình CSDL.  
  > 3. **Tối ưu trải nghiệm người dùng:** Hiện thực tính năng Phóng to/Thu nhỏ Chatbox, cơ chế Stream gõ chữ mượt mà và hỗ trợ tích hợp dữ liệu CSDL động cho AI Assistant."

---

### 🟢 SLIDE 13: BẢNG KẾT QUẢ ĐO ĐẠC & KIỂM THỬ THỰC TẾ
* **Nội dung hiển thị:** Bảng kết quả 300+ lượt test: Điều kiện chuẩn 99.4%, nghiêng mặt 98.2%, đeo kính 97.5%, ánh sáng yếu 95%, ảnh giả mạo chặn 100%.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Đây là bảng số liệu đo đạc thực nghiệm trên hệ thống qua hơn 300 lượt kiểm thử:  
  > - Trong điều kiện ánh sáng chuẩn, hệ thống đạt độ chính xác **99.4%** với độ trễ trung bình chỉ **215 miligiây**.  
  > - Khi sinh viên nghiêng mặt từ 15 đến 35 độ hoặc đeo kính cận, hệ thống vẫn duy trì độ chính xác cao từ **97.5% đến 98.2%**.  
  > - Trong điều kiện ngược sáng hoặc thiếu sáng, độ chính xác vẫn đạt **95.0%**.  
  > - Đặc biệt, trong 50 lượt thử nghiệm cố tình gian lận bằng ảnh in màu và video trên điện thoại, hệ thống đã **chặn đứng chính xác 100%**, tỷ lệ chấp nhận sai (FAR) bằng 0.00%."

---

### 🟢 SLIDE 14: ĐÁNH GIÁ & SO SÁNH VỚI GIẢI PHÁP HIỆN CÓ
* **Nội dung hiển thị:** Bảng so sánh đa chiều giữa: Điểm danh giấy, Máy quẹt thẻ/vân tay và Hệ thống FaceSystem của đề tài.
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "So sánh với các giải pháp hiện tại:  
  > - So với **điểm danh giấy truyền thống**, hệ thống của chúng em rút ngắn thời gian từ 15 phút xuống chỉ còn vài giây, loại bỏ hoàn toàn việc điểm danh hộ.  
  > - So với **máy chấm công vân tay hoặc quẹt thẻ từ chuyên dụng**, giải pháp của đề tài vượt trội về mặt kinh tế: không cần mua thiết bị đắt tiền, chỉ cần webcam có sẵn trên laptop hoặc camera phòng học; thao tác hoàn toàn không chạm (contactless) hợp vệ sinh và tích hợp sâu với quy trình quản lý lịch thi, sơ đồ phòng học và trợ lý AI thông minh."

---

### 🟢 SLIDE 15: KẾT LUẬN & ĐỊNH HƯỚNG PHÁT TRIỂN TIẾP THEO
* **Nội dung hiển thị:** Tổng kết 4 thành tựu chính; 3 định hướng phát triển (Camera RTSP Multi-face, Công nghệ vi mạch rPPG, Mobile App).
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Tóm lại, đề tài đã hoàn thành xuất sắc toàn bộ các mục tiêu đề ra: xây dựng thành công hệ thống điểm danh và quản lý khảo thí thông minh với kiến trúc Docker Microservices ổn định, nhận diện ArcFace chính xác cao và chống giả mạo tin cậy.  
  > Trong giai đoạn tiếp theo, nhóm định hướng mở rộng:  
  > 1. Hỗ trợ điểm danh đồng thời nhiều sinh viên (Multi-face) qua camera giám sát góc rộng RTSP gắn cố định tại cửa lớp.  
  > 2. Ứng dụng công nghệ quang phổ rPPG phân tích biến thiên huyết sắc tố dưới da để phát hiện mặt nạ silicon 3D siêu tinh vi.  
  > 3. Phát triển ứng dụng di động để sinh viên theo dõi thông báo ca thi và kết quả chuyên cần theo thời gian thực."

---

### 🟢 SLIDE 16: LỜI CẢM ƠN & PHIÊN HỎI - ĐÁP (Q&A)
* **Nội dung hiển thị:** Lời cảm ơn Hội đồng chấm khóa luận tốt nghiệp; Mở phiên Hỏi - Đáp (Q&A).
* **🎙️ Lời thoại trình bày (Speaker Script):**
  > "Bài báo cáo khóa luận tốt nghiệp của em đến đây là kết thúc.  
  > Em xin được gửi lời cảm ơn chân thành nhất đến Quý Thầy Cô trong Hội đồng đã dành thời gian theo dõi bài thuyết trình. Em rất mong nhận được những ý kiến đóng góp quý báu của Thầy Cô để hệ thống được hoàn thiện hơn nữa.  
  > Em xin sẵn sàng lắng nghe và trả lời các câu hỏi của Hội đồng ạ. Em xin trân trọng cảm ơn!"

---

## 🎯 BỘ 10 CÂU HỎI PHẢN BIỆN THƯỜNG GẶP & CÂU TRẢ LỜI MẪU

Dưới đây là 10 câu hỏi "sát sườn" mà Hội đồng thường hỏi nhất, được chuẩn bị sẵn câu trả lời sắc bén chuẩn kỹ thuật:

#### ❓ Câu 1: Tại sao nhóm lại chọn mô hình ArcFace thay vì Facenet hay VGG-Face?
* **Trả lời:**  
  *"Thưa Thầy Cô, ArcFace (Additive Angular Margin Loss) tối ưu hóa hàm mất mát trên mặt cầu siêu không gian góc (hypersphere), giúp cực đại hóa khoảng cách giữa các lớp (inter-class discrepancy) và cực tiểu hóa khoảng cách nội lớp (intra-class compactness). Do đó, ArcFace tạo ra vector 512 chiều có tính phân tách đặc trưng vượt trội hơn hẳn so với Facenet (sử dụng Triplet Loss dễ hội tụ cục bộ) và nhẹ hơn rất nhiều so với VGG-Face, cho phép đối soát ma trận Cosine cực nhanh dưới 20ms ngay trên CPU."*

#### ❓ Câu 2: Cơ chế Passive 3D Anti-Spoofing hoạt động như thế nào? Làm sao chống được màn hình Retina siêu nét?
* **Trả lời:**  
  *"Thưa Thầy Cô, cơ chế chống giả mạo của nhóm dựa trên 2 tầng:  
  1. Phân tích vân kết cấu qua độ biến thiên ma trận Laplacian (Laplacian Variance): Dù màn hình Retina có độ phân giải cao đến đâu, khi phát sáng nó vẫn phát ra tần số quét và hiện tượng giao thoa ánh sáng (Moiré pattern), làm cho phương sai Laplacian vượt ngưỡng 1800.0. Còn da người thật luôn nằm trong dải phân tán tự nhiên từ 4.0 đến 1800.0.  
  2. Đối soát hình học 3D của 5 điểm mốc (2 mắt, sống mũi, khóe miệng): Khi người dùng cử động tự nhiên trước camera, tỉ lệ hình học của khuôn mặt thật 3D sẽ biến đổi theo phép chiếu khối, còn ảnh phẳng 2D trên điện thoại sẽ bị co dãn phẳng phi tự nhiên."*

#### ❓ Câu 3: Thuật toán 2-Frame Voting Buffer trên Frontend giải quyết vấn đề gì?
* **Trả lời:**  
  *"Thưa Thầy Cô, khi điểm danh trực tiếp qua webcam live stream, nếu một người đi lướt qua phía sau trong 1 frame, camera có thể bắt nhầm. Thuật toán 2-Frame Voting Buffer mở một cửa sổ trượt gồm 3 frame và yêu cầu phải có ít nhất 2 frame liên tiếp xác nhận đúng cùng 1 sinh viên thì mới ghi nhận điểm danh. Thuật toán này giúp loại bỏ 100% hiện tượng chập chờn và đảm bảo tính chắc chắn tuyệt đối của kết quả."*

#### ❓ Câu 4: Vì sao hệ thống lại chia làm 3 container Docker mà không viết chung tất cả vào Node.js?
* **Trả lời:**  
  *"Thưa Thầy Cô, việc phân tách Microservices dựa trên thế mạnh của từng công nghệ:  
  - Python là ngôn ngữ tối ưu nhất cho Machine Learning với các thư viện OpenCV, DeepFace, NumPy và CUDA.  
  - Node.js với mô hình Non-blocking I/O Event Loop lại tối ưu nhất cho việc phục vụ hàng nghìn request web, xử lý xác thực JWT và truy vấn CSDL với độ trễ chỉ 20ms.  
  Nếu gộp chung việc tính toán ma trận AI nặng vào Node.js, tiến trình xử lý đơn luồng sẽ bị block, gây đơ giao diện website. Việc chia container giúp cô lập tải tính toán và dễ dàng mở rộng (scale) độc lập."*

#### ❓ Câu 5: Hệ thống xử lý lỗi lệch múi giờ GMT+7 như thế nào?
* **Trả lời:**  
  *"Thưa Thầy Cô, lỗi lệch múi giờ xuất phát từ việc máy chủ Docker mặc định chạy ở múi giờ UTC (GMT+0), khiến giờ điểm danh bị chậm 7 tiếng so với giờ Việt Nam. Em đã giải quyết triệt để vấn đề này qua 3 điểm:  
  1. Cấu hình kết nối MySQL pool với tham số `timezone: '+07:00'`.  
  2. Truyền biến môi trường `TZ=Asia/Ho_Chi_Minh` cho toàn bộ container trong `docker-compose.yml`.  
  3. Trong thư viện xuất file Excel `ExcelJS`, ép cứng tham số `timeZone: 'Asia/Ho_Chi_Minh'` cho tất cả các cột ngày giờ, đảm bảo dữ liệu hiển thị đồng nhất 100% từ Database lên Website và ra file Excel báo cáo."*

#### ❓ Câu 6: Trợ lý Hybrid AI Chatbot có gì đặc biệt so với ChatGPT thông thường?
* **Trả lời:**  
  *"Thưa Thầy Cô, Trợ lý AI của hệ thống là mô hình Hybrid 3 tầng:  
  - Tầng 1 sử dụng Groq Llama-3.3-70B cho tốc độ suy luận siêu tốc > 250 tokens/giây, trả lời mượt mà không có độ trễ.  
  - Tầng 2 dự phòng qua Google Gemini Flash khi mạng có sự cố.  
  - Đặc biệt, Tầng 3 là cơ chế Local RAG: khi người dùng hỏi các câu hỏi thực tế như 'Lịch thi môn Toán khi nào?', 'Hôm nay có bao nhiêu sinh viên đi muộn?', hệ thống tự động nhận diện ý định và truy vấn trực tiếp CSDL MySQL để trả lời chính xác dữ liệu thực tế mà **hoàn toàn không tiêu tốn token của LLM**, giúp tối ưu hóa chi phí vận hành."*

#### ❓ Câu 7: Bạn Lục Văn Sơn đã thực hiện những công việc gì cụ thể trong đề tài này?
* **Trả lời:**  
  *"Thưa Thầy Cô, trong đề tài này, em đảm nhận vị trí Kiểm thử viên chất lượng phần mềm (QA/QC) và Hỗ trợ phát triển Backend:  
  1. Em đã trực tiếp thiết kế bộ tài liệu kiểm thử gồm 35 Testcases chi tiết, thực hiện kiểm thử chức năng, kiểm thử bảo mật chống giả mạo khuôn mặt và kiểm thử biên (ngược sáng, đeo kính, nghiêng mặt).  
  2. Em hỗ trợ xây dựng và tinh chỉnh các API Backend cho cấu trúc Khoa, Lớp, Phòng học và Ca học chuẩn; trực tiếp phát hiện và xử lý lỗi lệch múi giờ UTC trong file Excel xuất ra.  
  3. Em nghiên cứu và tối ưu hóa giao diện Chatbox: xây dựng tính năng Phóng to/Thu nhỏ (Maximize) panel và cơ chế hiển thị câu trả lời dạng stream gõ chữ."*

#### ❓ Câu 8: Điểm danh 2 ca Check-in và Check-out mang lại lợi ích gì so với điểm danh 1 lần?
* **Trả lời:**  
  *"Thưa Thầy Cô, điểm danh 1 lần ở đầu giờ chỉ xác nhận sinh viên có mặt lúc đầu, nhưng không ngăn được việc sinh viên bỏ về giữa tiết học. Cơ chế điểm danh 2 ca của hệ thống:  
  - Đầu giờ: Ghi nhận Check-in để đánh giá Đúng giờ hay Đi muộn.  
  - Cuối giờ: Ghi nhận Check-out để tính tổng thời gian tham gia lớp học.  
  Chỉ khi sinh viên hoàn thành cả 2 lượt quét thì trạng thái mới chuyển thành `Completed`. Điều này đảm bảo tính minh bạch và đánh giá đúng chất lượng chuyên cần của người học."*

#### ❓ Câu 9: Khi sinh viên chưa đăng ký khuôn mặt hoặc camera bị hỏng thì xử lý như thế nào?
* **Trả lời:**  
  *"Thưa Thầy Cô, hệ thống luôn thiết kế luồng xử lý dự phòng (fallback mechanism): Giảng viên có toàn quyền truy cập danh sách lớp trên giao diện Web, có thể nhấn nút chọn trạng thái 'Có mặt', 'Đi muộn' hoặc 'Có phép' bằng tay cho sinh viên đó. Mọi thao tác chỉnh sửa thủ công đều được lưu vết trong CSDL để đảm bảo tính minh bạch."*

#### ❓ Câu 10: Hướng phát triển tiếp theo của hệ thống có tính khả thi không?
* **Trả lời:**  
  *"Thưa Thầy Cô, hoàn toàn khả thi ạ. Với phần cứng hiện tại, việc tích hợp luồng video RTSP từ camera IP phòng học chỉ cần bổ sung module phân luồng đa luồng (multi-threading video stream) trong Python AI Service. Về công nghệ chống giả mạo rPPG, nhóm đã nghiên cứu nền tảng phân tích nhịp đập mạch máu qua biến thiên màu da (RGB color fluctuations), đây là xu hướng bảo mật sinh trắc học tân tiến nhất hiện nay và hoàn toàn có thể tích hợp vào phiên bản tiếp theo."*

---

## 💻 HƯỚNG DẪN MỞ, TRÌNH CHIẾU & COPY SANG POWERPOINT

1. **Mở trình chiếu:** Tìm file [`presentation.html`](./presentation.html) trong thư mục dự án và nhấp đúp để mở trong trình duyệt Chrome / Edge.
2. **Chế độ toàn màn hình:** Nhấn phím **`F`** để bật/tắt toàn màn hình (Fullscreen) khi báo cáo trước Hội đồng.
3. **Chuyển Slide:** Dùng phím mũi tên **`→`** hoặc phím **Cách (Space)** để chuyển sang slide tiếp theo; dùng **`←`** để quay lại.
4. **Lời thoại diễn giả:** Nhấn phím **`S`** để bật cửa sổ **Ghi chú lời thoại (Speaker Notes)** nổi trên màn hình nếu bạn cần nhắc bài khi luyện tập.
5. **In/Xuất PDF:** Nhấn **`Ctrl + P`** -> Chọn máy in là **Save as PDF** -> Lưu thành file slide PDF hoàn chỉnh để nộp cho Nhà trường.
6. **📋 COPY SANG MICROSOFT POWERPOINT (2 CÁCH CỰC KỲ DỄ):**
   - **Cách 1 (Nhanh nhất):** Trên giao diện [`presentation.html`](./presentation.html), ở mỗi slide, bạn chỉ cần bấm vào nút xanh **`📋 Copy Text Cho PowerPoint`** ở góc trên cùng bên phải. Hệ thống sẽ tự động tổng hợp toàn bộ tiêu đề, các ý gạch đầu dòng, số liệu và cả lời thoại vào clipboard, bạn chỉ việc mở PowerPoint và bấm **`Ctrl + V`**! Hoặc bạn có thể dùng chuột bôi đen trực tiếp bất kỳ dòng chữ nào trên slide để copy.
   - **Cách 2:** Mở trực tiếp file [`NOI_DUNG_SLIDE_POWERPOINT.md`](./NOI_DUNG_SLIDE_POWERPOINT.md) - Đây là file văn bản đã được phân tách sẵn từng ô chữ (Title, Subtitle, Text Box, Metric Box, Notes) của 16 slide để bạn copy-paste sang PowerPoint một cách tiện lợi nhất.

