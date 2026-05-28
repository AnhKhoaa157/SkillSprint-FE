1. Dự án này giải quyết vấn đề gì?
Dự án của bạn giải quyết một vấn đề rất thực tế của sinh viên:
●có syllabus nhưng không biết bắt đầu học từ đâu

●có nhiều tài liệu nhưng bị lan man, không biết phần nào quan trọng

●không biết nên học phần nào trước, phần nào sau

●không biết chia thời gian sao cho kịp quiz, midterm, final

●dễ quên học, bỏ buổi, chậm tiến độ nhưng không ai nhắc

Nói ngắn gọn, vấn đề cốt lõi là:
Sinh viên có tài liệu nhưng không có lộ trình học rõ ràng và không biết cách phân bổ thời gian để học kịp trước kỳ thi.

2. Dự án của bạn là gì?
Dự án của bạn là một web hỗ trợ học tập bằng AI, giúp sinh viên biến một môn học trên trường từ trạng thái “mơ hồ, không biết bắt đầu từ đâu” thành một roadmap học tập rõ ràng, có lịch học cụ thể và có theo dõi tiến độ.
Hệ thống sẽ lấy syllabus của môn học làm đầu vào chính, sau đó kết hợp với thông tin của người dùng để tạo ra một kế hoạch học phù hợp.

3. Hệ thống hoạt động như thế nào?
Flow của dự án có thể hiểu như sau:
Bước 1: Khảo sát đầu vào người dùng
Trước tiên, hệ thống sẽ hỏi người dùng một số thông tin, tương tự kiểu onboarding như Duolingo:
●bạn đang học môn nào

●mục tiêu của bạn là gì

●còn bao lâu tới kỳ thi

●hiện tại bạn đang ở mức nào

●bạn yếu phần nào

●mỗi tuần bạn học được mấy buổi

●mỗi buổi học được bao lâu

Mục đích của bước này là để hệ thống biết:
●người dùng đang ở đâu

●muốn đạt tới đâu

●có bao nhiêu thời gian để đạt được điều đó


Bước 2: Phân tích syllabus môn học
Sau đó hệ thống lấy syllabus của môn học để phân tích:
●môn học gồm những phần kiến thức nào

●thứ tự nội dung ra sao

●phần nào là nền tảng

●phần nào nâng cao

●môn có quiz, midterm, final hay assignment gì

●còn bao nhiêu tuần để chuẩn bị

Nói đơn giản, syllabus giúp hệ thống hiểu:
môn này yêu cầu người học phải biết những gì.

Bước 3: AI phân tích skill gap
Đây là phần AI quan trọng nhất của dự án.
Hệ thống sẽ so sánh giữa:
●kiến thức hiện tại của người học

●và kiến thức mà môn học yêu cầu

Khoảng cách giữa 2 thứ đó chính là skill gap.
Ví dụ:
●người học mới hiểu phần cơ bản

●nhưng môn học cần nắm 5 phần để đi thi

●trong đó người học đang yếu 2 phần trọng tâm

Thì AI sẽ xác định:
●người học đang thiếu gì

●phần nào cần ưu tiên học trước

●phần nào có thể học sau

●phần nào cần nhiều thời gian hơn

Tức là AI không chỉ tạo một lộ trình chung cho tất cả mọi người, mà tạo ra lộ trình phù hợp với từng người.

Bước 4: Tạo roadmap học tập
Sau khi biết skill gap, hệ thống sẽ tạo roadmap học tập cá nhân hóa.
Roadmap này sẽ trả lời các câu hỏi:
●nên học phần nào trước

●nên học theo thứ tự nào

●nên chia môn học thành mấy giai đoạn

●trong từng giai đoạn cần học những gì

Ví dụ:
●Giai đoạn 1: học nền tảng

●Giai đoạn 2: học phần trọng tâm

●Giai đoạn 3: luyện bài tập

●Giai đoạn 4: ôn tập trước kỳ thi

Điểm quan trọng là roadmap không còn là “học đại”, mà là có thứ tự và có logic rõ ràng.

Bước 5: Chuyển roadmap thành lịch học cụ thể
Sau khi có roadmap, hệ thống sẽ tiếp tục chia nó thành:
●kế hoạch theo tuần

●kế hoạch theo ngày

●kế hoạch theo từng buổi học

Ví dụ:
●thứ 2 học phần 1

●thứ 4 học phần 2

●chủ nhật ôn tập

●mỗi buổi chia thành 2–3 phiên Pomodoro

Đây là chỗ dự án của bạn mạnh hơn nhiều planner bình thường, vì nó không chỉ cho người dùng tự ghi lịch, mà tự động tạo lịch học dựa trên roadmap và thời gian rảnh của người dùng.

Bước 6: Theo dõi tiến độ học tập
Khi người dùng bắt đầu học, hệ thống sẽ ghi nhận tiến độ như kiểu Udemy:
●toàn bộ môn học đã hoàn thành bao nhiêu %

●từng phần đã hoàn thành bao nhiêu %

●phần nào đã xong

●phần nào chưa xong

●hiện tại có đang đúng tiến độ hay không

Ví dụ:
●toàn môn: 45%

●Part 1: 100%

●Part 2: 70%

●Part 3: 20%

Cái này giúp người học nhìn vào là biết mình đang ở đâu.

Bước 7: Theo dõi thời gian thực và điều chỉnh
Dự án của bạn không chỉ dừng ở việc tạo kế hoạch ban đầu.
Hệ thống còn theo dõi:
●người dùng có học đúng lịch không

●có bỏ lỡ buổi nào không

●học chậm hay nhanh hơn dự kiến

●phần nào mất nhiều thời gian hơn dự tính

Từ đó, hệ thống có thể:
●dời lịch

●tăng thêm buổi cho phần yếu

●giảm thời gian ở phần đã ổn

●cập nhật lại roadmap nếu tiến độ lệch

Đây là phần “bám sát thời gian thực” mà bạn nói lúc đầu.

Bước 8: Nhắc nhở và thúc đẩy người học
Nếu người dùng quên học hoặc chậm tiến độ, hệ thống sẽ gửi nhắc nhở để kéo họ quay lại.
Ví dụ:
●đã đến giờ học theo lịch

●bạn bỏ lỡ buổi học hôm nay

●bạn đang chậm 2 buổi so với kế hoạch

●còn 10 ngày nữa thi nhưng vẫn còn 3 phần chưa hoàn thành

Phần này biến hệ thống thành một kiểu study coach, chứ không chỉ là công cụ lập kế hoạch.

4. AI trong dự án nằm ở đâu?
Điểm rất quan trọng là dự án của bạn không nên nói AI một cách chung chung.
AI nằm chủ yếu ở 3 chỗ:
1. Phân tích syllabus
AI hỗ trợ đọc syllabus, tách ra các phần kiến thức, mức độ quan trọng và thứ tự học.
2. Phân tích skill gap
AI so sánh giữa năng lực hiện tại của người học và yêu cầu của môn học để xác định người đó đang thiếu phần nào.
3. Điều chỉnh lộ trình
AI dùng dữ liệu tiến độ thực tế để cập nhật kế hoạch khi người học chậm hoặc nhanh hơn dự kiến.
Còn các phần như:
●lịch học

●Pomodoro

●Eisenhower

●reminder

thì là feature hỗ trợ, không phải AI lõi.

5. Điểm khác biệt của dự án này là gì?
Dự án này khác với app học tập hoặc planner thông thường ở chỗ:
App/planner bình thường:
●người dùng tự ghi lịch

●tự chia task

●tự quyết định học gì trước

Dự án của bạn:
●tự phân tích môn học từ syllabus

●tự xác định người học đang thiếu gì

●tự đề xuất thứ tự học

●tự chia roadmap theo thời gian còn lại

●tự tạo lịch học

●tự theo dõi tiến độ

●tự nhắc khi người dùng lệch kế hoạch

Tức là sản phẩm của bạn không chỉ là “app ghi lịch”, mà là một hệ thống định hướng học tập có AI hỗ trợ.

6. Các tính năng chính của dự án
Bạn có thể chia thành các nhóm như sau:
Nhóm 1: Phân tích học tập
●đọc syllabus

●phân tích cấu trúc môn học

●xác định topic và learning path

●phân tích skill gap

Nhóm 2: Lập kế hoạch
●tạo roadmap học tập cá nhân hóa

●chia theo tuần, ngày, buổi học

●sắp xếp theo thời gian còn lại trước kỳ thi

Nhóm 3: Quản lý thời gian
●Pomodoro

●Eisenhower

●chia session học và nghỉ

Nhóm 4: Theo dõi tiến độ
●% hoàn thành toàn môn

●% hoàn thành từng phần

●tình trạng đúng tiến độ hay chậm tiến độ

Nhóm 5: Hỗ trợ hành vi
●nhắc giờ học

●nhắc khi bỏ lỡ buổi học

●cảnh báo khi gần thi mà chưa xong

●điều chỉnh lại lịch học

