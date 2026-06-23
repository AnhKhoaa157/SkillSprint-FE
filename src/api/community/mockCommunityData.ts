import type { CommunityPost, PostComment, PageableResponse } from "./communityTypes";
import type { 
  CommunityRoomResponse, 
  CommunityRoomMemberResponse, 
  CommunityPinResponse, 
  CommunityChatMessageResponse 
} from "./communityRoomTypes";
import type {
  CommunityPostResponse,
  PostCommentResponse,
  ContentReportResponse,
  BlacklistKeywordResponse,
  AdminCommunityPageResponse,
  CommunityPostStatus
} from "../admin/adminCommunityTypes";

// Helper to generate dates relative to now
const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

// Authors/Users
export const MOCK_USERS = {
  admin: { userId: "user-admin", fullName: "Admin SkillSprint", email: "admin@skillsprint.vn", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
  owner: { userId: "user-owner", fullName: "Lê Hoàng Long", email: "longlh@gmail.com", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
  mod: { userId: "user-mod", fullName: "Trần Thị Minh", email: "minh.tt@gmail.com", avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
  student1: { userId: "user-student1", fullName: "Nguyễn Văn Nam", email: "nam.nv@gmail.com", avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
  student2: { userId: "user-student2", fullName: "Phạm Hải Đăng", email: "dang.ph@gmail.com", avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150" },
  student3: { userId: "user-student3", fullName: "Vũ Phương Thảo", email: "thao.vp@gmail.com", avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
};

// 1. Mock Posts (for Feed)
export const MOCK_POSTS: CommunityPost[] = [
  {
    postId: "post-1",
    author: MOCK_USERS.owner,
    content: "Chào cả nhà! Mình vừa hoàn thành khóa học React & Next.js trên SkillSprint và tự tay xây dựng một dự án portfolio cá nhân. Các công nghệ mình dùng bao gồm Next.js App Router, Tailwind CSS và Prisma. Mọi người có thể góp ý giúp mình phần thiết kế UI/UX được không? Link dự án ở trang cá nhân của mình nhé! 👇",
    hashtags: ["reactjs", "nextjs", "frontend", "portfolio"],
    status: "APPROVED",
    likeCount: 24,
    commentCount: 5,
    likedByMe: true,
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(2),
  },
  {
    postId: "post-2",
    author: MOCK_USERS.student1,
    content: "Mọi người cho mình hỏi có ai đang ôn thi IELTS và muốn lập nhóm cùng luyện Writing/Speaking không ạ? Mục tiêu của mình là 7.0+ vào cuối năm nay. Mình dự định sẽ sinh hoạt 3 buổi/tuần trên phòng học của SkillSprint. Ai quan tâm thì comment hoặc join phòng 'Luyện thi IELTS 7.5+' ở tab Phòng học nha!",
    hashtags: ["ielts", "studygroup", "english"],
    status: "APPROVED",
    likeCount: 15,
    commentCount: 8,
    likedByMe: false,
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(5),
  },
  {
    postId: "post-3",
    author: MOCK_USERS.student3,
    content: "Hôm nay mình vừa học xong phần cấu trúc dữ liệu Giải thuật Đồ thị (Graph algorithms). Công nhận phần này ban đầu hơi trừu tượng nhưng khi vẽ sơ đồ ra và thực hành code thì thấy logic cực kỳ hay. Khuyên các bạn nên dùng trang VisuAlgo để trực quan hóa thuật toán nhé, học nhanh hơn gấp 2 lần luôn!",
    hashtags: ["algorithms", "computerscience", "study-tips"],
    status: "APPROVED",
    likeCount: 42,
    commentCount: 12,
    likedByMe: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  }
];

// Mock Post Comments
export const MOCK_COMMENTS: Record<string, PostComment[]> = {
  "post-1": [
    {
      commentId: "cmt-1-1",
      postId: "post-1",
      author: MOCK_USERS.student2,
      content: "Dự án đẹp quá bạn ơi! Mượt mà lắm. Bạn có dùng Framer Motion cho mấy hiệu ứng hover không?",
      status: "VISIBLE",
      createdAt: hoursAgo(1.5),
      updatedAt: hoursAgo(1.5),
    },
    {
      commentId: "cmt-1-2",
      postId: "post-1",
      author: MOCK_USERS.owner,
      content: "Cảm ơn bạn! Đúng rồi mình có dùng Framer Motion để làm các hiệu ứng chuyển cảnh cho tự nhiên hơn đó.",
      status: "VISIBLE",
      createdAt: hoursAgo(1.2),
      updatedAt: hoursAgo(1.2),
    }
  ],
  "post-2": [
    {
      commentId: "cmt-2-1",
      postId: "post-2",
      author: MOCK_USERS.student3,
      content: "Cho mình đăng ký 1 slot nói Speaking nha bạn. Tự luyện một mình chán quá.",
      status: "VISIBLE",
      createdAt: hoursAgo(4),
      updatedAt: hoursAgo(4),
    }
  ]
};

// 2. Mock Rooms (for Rooms List)
export const MOCK_ROOMS: CommunityRoomResponse[] = [
  {
    roomId: "room-1",
    name: "Cộng đồng ReactJS & Next.js",
    description: "Nơi thảo luận, trao đổi kinh nghiệm phát triển Web với ReactJS, Next.js và hệ sinh thái liên quan.",
    mode: "PUBLIC",
    status: "ACTIVE",
    owner: MOCK_USERS.owner,
    maxMembers: 150,
    memberCount: 84,
    reportCount: 0,
    myRole: "OWNER",
    joined: true,
    banned: false,
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    roomId: "room-2",
    name: "Luyện thi IELTS 7.5+",
    description: "Phòng tự học, trao đổi bài viết Writing, ghi âm Speaking và tài liệu ôn tập IELTS chất lượng cao.",
    mode: "INVITE_ONLY",
    status: "ACTIVE",
    owner: MOCK_USERS.mod,
    maxMembers: 50,
    memberCount: 22,
    reportCount: 1,
    myRole: "MEMBER",
    joined: true,
    banned: false,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(1),
  },
  {
    roomId: "room-3",
    name: "Nhóm tự học Python Cơ Bản",
    description: "Nhóm học tập dành cho các bạn mới bắt đầu học lập trình với ngôn ngữ Python. Đi từ con số 0.",
    mode: "PUBLIC",
    status: "ACTIVE",
    owner: MOCK_USERS.student1,
    maxMembers: 200,
    memberCount: 105,
    reportCount: 0,
    myRole: null,
    joined: false,
    banned: false,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(5),
  },
  {
    roomId: "room-4",
    name: "Algorithms & Data Structures",
    description: "Giải thuật nâng cao, luyện LeetCode, Codeforces và các cuộc thi lập trình thuật toán chuyên sâu.",
    mode: "PRIVATE",
    status: "ACTIVE",
    owner: MOCK_USERS.student2,
    maxMembers: 30,
    memberCount: 12,
    reportCount: 0,
    myRole: "MODERATOR",
    joined: true,
    banned: false,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
  }
];

// Mock Room Members
export const MOCK_ROOM_MEMBERS: Record<string, CommunityRoomMemberResponse[]> = {
  "room-1": [
    { memberId: "m-1-1", roomId: "room-1", user: MOCK_USERS.owner, role: "OWNER", joinedAt: daysAgo(10) },
    { memberId: "m-1-2", roomId: "room-1", user: MOCK_USERS.mod, role: "MODERATOR", joinedAt: daysAgo(9) },
    { memberId: "m-1-3", roomId: "room-1", user: MOCK_USERS.student1, role: "MEMBER", joinedAt: daysAgo(8) },
    { memberId: "m-1-4", roomId: "room-1", user: MOCK_USERS.student2, role: "MEMBER", joinedAt: daysAgo(8) },
    { memberId: "m-1-5", roomId: "room-1", user: MOCK_USERS.student3, role: "MEMBER", joinedAt: daysAgo(7) },
  ],
  "room-2": [
    { memberId: "m-2-1", roomId: "room-2", user: MOCK_USERS.mod, role: "OWNER", joinedAt: daysAgo(7) },
    { memberId: "m-2-2", roomId: "room-2", user: MOCK_USERS.owner, role: "MEMBER", joinedAt: daysAgo(6) },
    { memberId: "m-2-3", roomId: "room-2", user: MOCK_USERS.student1, role: "MEMBER", joinedAt: daysAgo(5) },
  ]
};

// Mock Room Pins
export const MOCK_ROOM_PINS: Record<string, CommunityPinResponse[]> = {
  "room-1": [
    {
      pinId: "pin-1-1",
      roomId: "room-1",
      pinnedBy: MOCK_USERS.owner,
      title: "Nội quy phòng học tập ReactJS",
      content: "1. Không spam link quảng cáo không liên quan đến học tập.\n2. Tôn trọng ý kiến đóng góp của các học viên khác.\n3. Khuyến khích chia sẻ source code qua GitHub hoặc CodeSandbox để cùng review.",
      linkUrl: null,
      sortOrder: 1,
      createdAt: daysAgo(9),
    },
    {
      pinId: "pin-1-2",
      roomId: "room-1",
      pinnedBy: MOCK_USERS.mod,
      title: "Tổng hợp Slide học React / Next.js",
      content: "Bộ slide bài giảng chuẩn từ cơ bản đến nâng cao bao gồm State management, Hook, App Router và API Route. Nhấp vào link đính kèm để xem chi tiết trên Google Drive.",
      linkUrl: "https://drive.google.com/drive/folders/react-slides-mock",
      sortOrder: 2,
      createdAt: daysAgo(8),
    }
  ]
};

// Mock Room Chat Messages (for Chat history)
export const MOCK_ROOM_MESSAGES: Record<string, CommunityChatMessageResponse[]> = {
  "room-1": [
    {
      messageId: "msg-1-1",
      roomId: "room-1",
      sender: MOCK_USERS.student1,
      content: "Hello mọi người, có ai rảnh review giúp mình cái hook custom này bị render vô tận với?",
      hidden: false,
      reportCount: 0,
      sentAt: hoursAgo(1.5),
    },
    {
      messageId: "msg-1-2",
      roomId: "room-1",
      sender: MOCK_USERS.mod,
      content: "Bạn gửi code qua CodeSandbox đi hoặc copy paste đoạn code đó lên đây, nhớ kiểm tra mảng dependency trong useEffect xem có truyền object/array trực tiếp không nha.",
      hidden: false,
      reportCount: 0,
      sentAt: hoursAgo(1.4),
    },
    {
      messageId: "msg-1-3",
      roomId: "room-1",
      sender: MOCK_USERS.student1,
      content: "À đúng luôn rồi ạ! Mình truyền dependency là một object được định nghĩa ngay trong component nên mỗi lần render nó tạo tham chiếu mới. Cảm ơn ad nhiều nha!",
      hidden: false,
      reportCount: 0,
      sentAt: hoursAgo(1.3),
    },
    {
      messageId: "msg-1-4",
      roomId: "room-1",
      sender: MOCK_USERS.owner,
      content: "Tốt lắm! Bạn có thể dùng useMemo hoặc đưa object đó ra ngoài component để tránh lỗi này nhé.",
      hidden: false,
      reportCount: 0,
      sentAt: hoursAgo(1.2),
    },
    {
      messageId: "msg-1-5",
      roomId: "room-1",
      sender: MOCK_USERS.student2,
      content: "Lỗi này kinh điển, ai học React cũng dính ít nhất 1 lần 😂",
      hidden: false,
      reportCount: 0,
      sentAt: hoursAgo(0.8),
    }
  ]
};

// --- 3. Mock Data for ADMIN Section ---

// Admin Blacklist Keywords
export const MOCK_BLACKLIST_KEYWORDS: BlacklistKeywordResponse[] = [
  { wordId: 1, keyword: "spam", createdBy: MOCK_USERS.admin, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { wordId: 2, keyword: "scam", createdBy: MOCK_USERS.admin, createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { wordId: 3, keyword: "troll", createdBy: MOCK_USERS.admin, createdAt: daysAgo(4), updatedAt: daysAgo(4) },
];

// Admin Posts (Includes pending and rejected)
export const MOCK_ADMIN_POSTS: CommunityPostResponse[] = [
  {
    postId: "post-admin-1",
    author: MOCK_USERS.student2,
    content: "Cảnh báo lừa đảo!!! Hiện tại có rất nhiều tài khoản giả danh SkillSprint để bán tài liệu ôn thi. Mọi người chú ý chỉ mua tài liệu chính chủ qua hệ thống ví point nha.",
    hashtags: ["canhbao", "safety"],
    status: "PENDING_MODERATION",
    likeCount: 0,
    commentCount: 0,
    reportCount: 1,
    likedByMe: false,
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  ...MOCK_POSTS.map(p => ({
    ...p,
    reportCount: p.postId === "post-2" ? 2 : 0,
    likedByMe: p.likedByMe ?? false,
    status: p.status as CommunityPostStatus
  }))
];

// Admin Comments
export const MOCK_ADMIN_COMMENTS: PostCommentResponse[] = [
  {
    commentId: "cmt-admin-1",
    postId: "post-2",
    author: MOCK_USERS.student2,
    content: "Mày đùa tao à, học làm gì mệt người ra thôi giải tán đi.",
    status: "PENDING_MODERATION",
    reportCount: 3,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
  },
  {
    commentId: "cmt-1-1",
    postId: "post-1",
    author: MOCK_USERS.student2,
    content: "Dự án đẹp quá bạn ơi! Mượt mà lắm. Bạn có dùng Framer Motion cho mấy hiệu ứng hover không?",
    status: "VISIBLE",
    reportCount: 0,
    createdAt: hoursAgo(1.5),
    updatedAt: hoursAgo(1.5),
  }
];

// Admin Reports
export const MOCK_ADMIN_REPORTS: ContentReportResponse[] = [
  {
    reportId: "rep-1",
    targetType: "POST",
    targetId: "post-admin-1",
    reporter: MOCK_USERS.student3,
    reason: "Chia sẻ thông tin không kiểm chứng, có chứa từ khóa nhạy cảm.",
    status: "PENDING",
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    reportId: "rep-2",
    targetType: "COMMENT",
    targetId: "cmt-admin-1",
    reporter: MOCK_USERS.student1,
    reason: "Sử dụng từ ngữ gây hấn, toxic, xúc phạm người học khác.",
    status: "PENDING",
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(3),
  },
  {
    reportId: "rep-3",
    targetType: "MESSAGE",
    targetId: "msg-1-5",
    reporter: MOCK_USERS.mod,
    reason: "Báo cáo thử nghiệm, kiểm tra hệ thống.",
    status: "DISMISSED",
    adminNote: "Đã kiểm tra, tin nhắn hoàn toàn bình thường, bỏ qua báo cáo.",
    reviewedAt: hoursAgo(0.5),
    createdAt: hoursAgo(2),
    updatedAt: hoursAgo(0.5),
  }
];

// Helper wrapper to paginate items
export function paginate<T>(items: T[], page: number, size: number): AdminCommunityPageResponse<T> {
  const start = page * size;
  const paginatedItems = items.slice(start, start + size);
  return {
    items: paginatedItems,
    page,
    size,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    first: page === 0,
    last: start + size >= items.length,
  };
}

export function paginateNormal<T>(items: T[], page: number, size: number): PageableResponse<T> {
  const start = page * size;
  const paginatedItems = items.slice(start, start + size);
  return {
    items: paginatedItems,
    page,
    size,
    totalItems: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
    first: page === 0,
    last: start + size >= items.length,
  };
}
