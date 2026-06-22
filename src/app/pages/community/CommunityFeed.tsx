import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  Bell,
  Bookmark,
  BookOpenCheck,
  CalendarDays,
  Hash,
  Home,
  MessageSquare,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Input } from "../../components/ui/input";

const PAGE_SIZE = 10;
const LOAD_ERROR_TOAST_ID = "community-feed-load-error";
const QUICK_TOPICS = ["React", "SpringBoot", "Interview", "Roadmap", "TypeScript"];

interface TopicItem {
  tag: string;
  count: number;
}

interface SidebarProps {
  onTopicSelect: (topic: string) => void;
}

interface CommunityHeaderProps extends SidebarProps {
  hashtagFilter: string;
  searchFilter: string;
  searchInput: string;
  setSearchInput: (value: string) => void;
  onSearchSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClearFilters: () => void;
}

interface RightPanelProps extends SidebarProps {
  postsCount: number;
  trendingHashtags: TopicItem[];
}

function DevelopmentBadge() {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-slate-500">
      Đang phát triển
    </span>
  );
}

function Sidebar({ onTopicSelect }: SidebarProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-5 space-y-5">
        <nav className="space-y-1">
          <Link
            to="/app/community"
            className="flex h-11 items-center gap-3 rounded-2xl bg-orange-50 px-3 text-[15px] font-semibold text-[#D95B00] ring-1 ring-orange-100/70"
          >
            <Home className="h-5 w-5" />
            Bảng tin
          </Link>
          <Link
            to="/app/community/rooms"
            className="flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
          >
            <MessageSquare className="h-5 w-5 text-slate-500" />
            Phòng chat
          </Link>
          <button
            type="button"
            disabled
            title="Đang phát triển"
            className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-semibold text-slate-500"
          >
            <Bookmark className="h-5 w-5" />
            <span className="min-w-0 flex-1">Bài đã lưu</span>
            <DevelopmentBadge />
          </button>
          <button
            type="button"
            disabled
            title="Đang phát triển"
            className="flex h-11 w-full cursor-not-allowed items-center gap-3 rounded-2xl px-3 text-left text-[15px] font-semibold text-slate-500"
          >
            <CalendarDays className="h-5 w-5" />
            <span className="min-w-0 flex-1">Sự kiện học tập</span>
            <DevelopmentBadge />
          </button>
        </nav>

        <section className="border-t border-slate-200 pt-4">
          <h2 className="px-3 text-sm font-bold text-slate-500">Lối tắt</h2>
          <div className="mt-2 space-y-1">
            {QUICK_TOPICS.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => onTopicSelect(topic)}
                className="flex h-10 w-full items-center rounded-xl px-3 text-left text-[15px] font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
              >
                <span className="mr-2 text-slate-400">#</span>
                {topic}
              </button>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}

function CommunityHeader({
  hashtagFilter,
  searchFilter,
  searchInput,
  setSearchInput,
  onSearchSubmit,
  onClearFilters,
  onTopicSelect,
}: CommunityHeaderProps) {
  const activeFilterLabel = hashtagFilter ? `#${hashtagFilter}` : searchFilter;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          <Users className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold tracking-normal text-slate-950 sm:text-2xl">
            Cộng đồng SkillSprint
          </h1>
          <p className="mt-1 line-clamp-2 text-sm font-medium leading-5 text-slate-500">
            Cập nhật câu hỏi, kinh nghiệm học tập và những sprint mới nhất từ cộng đồng.
          </p>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="relative mt-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Tìm kiếm trong cộng đồng"
          className="h-11 rounded-full border-0 bg-[#F3F4F6] pl-11 pr-11 text-[15px] shadow-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-orange-200"
        />
        {(hashtagFilter || searchFilter) && (
          <button
            type="button"
            title="Xóa lọc"
            onClick={onClearFilters}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_TOPICS.map(topic => (
          <button
            key={topic}
            type="button"
            onClick={() => onTopicSelect(topic)}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#F3F4F6] px-3.5 text-sm font-semibold text-slate-700 transition hover:bg-orange-50 hover:text-[#D95B00]"
          >
            # {topic}
          </button>
        ))}
        {(hashtagFilter || searchFilter) && (
          <span className="inline-flex h-9 min-w-0 shrink-0 items-center gap-2 rounded-full bg-orange-50 px-3.5 text-sm font-semibold text-[#D95B00] ring-1 ring-orange-100">
            <span className="max-w-[180px] truncate">{activeFilterLabel}</span>
            <button type="button" onClick={onClearFilters} title="Xóa lọc">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
      </div>
    </section>
  );
}

function RightPanel({ postsCount, trendingHashtags, onTopicSelect }: RightPanelProps) {
  return (
    <aside className="hidden xl:block">
      <div className="sticky top-5 space-y-4">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Đang nổi bật</h2>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-1">
            {trendingHashtags.map(item => (
              <button
                key={item.tag}
                type="button"
                onClick={() => onTopicSelect(item.tag)}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"
              >
                <span className="min-w-0 truncate text-sm font-semibold text-slate-900">#{item.tag}</span>
                <span className="ml-3 shrink-0 text-xs font-medium text-slate-400">
                  {item.count > 0 ? `${item.count} bài` : "gợi ý"}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Hoạt động</h2>
            <Bell className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D95B00]" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Feed học tập đang mở</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{postsCount} bài đã tải trong phiên này</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Cùng nhau học tốt hơn</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">Đặt câu hỏi rõ ràng, phản hồi tử tế</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="mb-3 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">Quy tắc cộng đồng</h2>
          </div>
          <div className="space-y-2 text-sm leading-6 text-slate-500">
            <p>Chia sẻ rõ vấn đề bạn đang học.</p>
            <p>Góp ý lịch sự và có ví dụ cụ thể.</p>
            <p>Dùng hashtag để mọi người dễ tìm kiếm.</p>
          </div>
        </section>

        <p className="px-1 text-xs leading-relaxed text-slate-400">SkillSprint © 2026</p>
      </div>
    </aside>
  );
}

function MobileCommunityNav() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur xl:hidden">
      <Link
        to="/app/community"
        className="flex h-10 items-center justify-center gap-2 rounded-full bg-orange-50 text-sm font-bold text-[#D95B00]"
      >
        <Home className="h-4 w-4" />
        Bảng tin
      </Link>
      <Link
        to="/app/community/rooms"
        className="flex h-10 items-center justify-center gap-2 rounded-full text-sm font-bold text-slate-600 transition hover:bg-slate-100"
      >
        <MessageSquare className="h-4 w-4" />
        Phòng chat
      </Link>
    </nav>
  );
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchPosts = useCallback(async (pageToFetch: number, hashtag?: string, search?: string, isNewSearch = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setLoadError(false);

    try {
      const res = await communityService.getPosts(pageToFetch, PAGE_SIZE, search, hashtag);
      if (isNewSearch) {
        setPosts(res.items);
      } else {
        setPosts(prev => [...prev, ...res.items]);
      }
      setHasMore(!res.last);
      setPage(pageToFetch);
    } catch {
      if (isNewSearch) setPosts([]);
      setHasMore(false);
      setLoadError(true);
      toast.error("Không thể tải bảng tin", { id: LOAD_ERROR_TOAST_ID });
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(0, hashtagFilter, searchFilter, true);
  }, [fetchPosts, hashtagFilter, searchFilter]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target?.isIntersecting && posts.length > 0 && hasMore && !loadError && !isFetchingRef.current) {
        fetchPosts(page + 1, hashtagFilter, searchFilter, false);
      }
    },
    [fetchPosts, page, posts.length, hasMore, loadError, hashtagFilter, searchFilter]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "200px",
      threshold: 0
    });

    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = searchInput.trim();
    if (trimmedInput.startsWith("#")) {
      setHashtagFilter(trimmedInput.substring(1));
      setSearchFilter("");
    } else {
      setSearchFilter(trimmedInput);
      setHashtagFilter("");
    }
  };

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPosts(prev => prev.map(post => post.postId === updatedPost.postId ? updatedPost : post));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(post => post.postId !== postId));
  };

  const handleRetry = () => {
    const isInitialLoad = posts.length === 0;
    fetchPosts(isInitialLoad ? 0 : page + 1, hashtagFilter, searchFilter, isInitialLoad);
  };

  const handleTopicSelect = (topic: string) => {
    setSearchInput(`#${topic}`);
    setHashtagFilter(topic);
    setSearchFilter("");
  };

  const clearFilters = () => {
    setSearchInput("");
    setHashtagFilter("");
    setSearchFilter("");
  };

  const trendingHashtags = React.useMemo(() => {
    const counts = new Map<string, number>();

    posts.forEach(post => {
      post.hashtags?.forEach(tag => {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      });
    });

    const fromPosts = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    return fromPosts.length > 0 ? fromPosts : QUICK_TOPICS.map(tag => ({ tag, count: 0 }));
  }, [posts]);

  return (
    <div className="min-h-screen bg-[#F5F6F8] text-slate-950">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-5 px-3 pb-24 pt-4 sm:px-5 lg:max-w-[760px] xl:max-w-[1320px] xl:grid-cols-[260px_minmax(0,680px)_300px]">
        <Sidebar onTopicSelect={handleTopicSelect} />

        <main className="min-w-0 space-y-4 xl:mx-auto xl:w-full">
          <CommunityHeader
            hashtagFilter={hashtagFilter}
            searchFilter={searchFilter}
            searchInput={searchInput}
            setSearchInput={setSearchInput}
            onSearchSubmit={handleSearchSubmit}
            onClearFilters={clearFilters}
            onTopicSelect={handleTopicSelect}
          />

          <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)} />

          <div className="flex items-center justify-between px-1 pt-1">
            <div>
              <h2 className="text-base font-bold text-slate-950">Bài viết mới nhất</h2>
              <p className="mt-0.5 text-sm text-slate-500">Những chia sẻ mới từ cộng đồng học tập.</p>
            </div>
            {(hashtagFilter || searchFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                Xóa lọc
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}

            <div ref={observerTarget} className="flex justify-center py-5 text-slate-500">
              {isLoading && (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF6B00]" />
              )}
              {loadError && !isLoading && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#D95B00] shadow-sm ring-1 ring-slate-200 transition hover:bg-orange-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </button>
              )}
              {!hasMore && posts.length > 0 && !isLoading && !loadError && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm ring-1 ring-slate-200">
                  Bạn đã xem hết tin hôm nay
                </span>
              )}
              {!hasMore && posts.length === 0 && !isLoading && !loadError && (
                <span className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-500">
                  Chưa có bài viết phù hợp.
                </span>
              )}
            </div>
          </div>
        </main>

        <RightPanel postsCount={posts.length} trendingHashtags={trendingHashtags} onTopicSelect={handleTopicSelect} />
      </div>

      <MobileCommunityNav />
    </div>
  );
}
