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
  Flame,
  GraduationCap,
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

export default function CommunityFeed() {
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
      if (isNewSearch) {
        setPosts([]);
      }
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  const handlePostDeleted = (postId: string) => {
    setPosts(prev => prev.filter(p => p.postId !== postId));
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

    if (fromPosts.length > 0) return fromPosts;

    return QUICK_TOPICS.map(tag => ({ tag, count: 0 }));
  }, [posts]);

  const loadedCommentCount = posts.reduce((total, post) => total + post.commentCount, 0);
  const loadedLikeCount = posts.reduce((total, post) => total + post.likeCount, 0);
  const activeFilterLabel = hashtagFilter ? `#${hashtagFilter}` : searchFilter;

  return (
    <div className="min-h-screen bg-[#f0f2f5] text-[#050505]">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 px-3 pb-16 pt-4 sm:px-4 lg:grid-cols-[minmax(0,680px)_300px] xl:grid-cols-[280px_minmax(0,680px)_300px]">
        <aside className="hidden xl:block">
          <div className="sticky top-4 space-y-2">
            <Link
              to="/app/community"
              className="flex h-12 items-center gap-3 rounded-md bg-white px-3 text-[15px] font-semibold text-[#1877f2] shadow-sm ring-1 ring-black/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
                <Home className="h-5 w-5" />
              </span>
              Bảng tin
            </Link>
            <Link
              to="/app/community/rooms"
              className="flex h-12 items-center gap-3 rounded-md px-3 text-[15px] font-semibold text-[#050505] transition hover:bg-white hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e6eb] text-[#1c1e21]">
                <MessageSquare className="h-5 w-5" />
              </span>
              Phòng chat
            </Link>
            <button
              type="button"
              className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-semibold text-[#050505] transition hover:bg-white hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e6eb] text-[#1c1e21]">
                <Bookmark className="h-5 w-5" />
              </span>
              Bài đã lưu
            </button>
            <button
              type="button"
              className="flex h-12 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-semibold text-[#050505] transition hover:bg-white hover:shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e4e6eb] text-[#1c1e21]">
                <CalendarDays className="h-5 w-5" />
              </span>
              Sự kiện học tập
            </button>

            <div className="my-3 h-px bg-[#ced0d4]" />

            <section className="space-y-1">
              <div className="px-3 pb-1 text-[17px] font-bold text-[#65676b]">Lối tắt</div>
              {QUICK_TOPICS.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicSelect(topic)}
                  className="flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-semibold text-[#050505] transition hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[#1877f2] to-[#42b72a] text-white">
                    <Hash className="h-4 w-4" />
                  </span>
                  #{topic}
                </button>
              ))}
            </section>
          </div>
        </aside>

        <main className="min-w-0 space-y-4 lg:mx-auto lg:w-full">
          <section className="rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col gap-3 border-b border-[#e4e6eb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1877f2] text-white">
                  <Users className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold tracking-normal text-[#050505]">Cộng đồng SkillSprint</h1>
                  <p className="truncate text-sm font-medium text-[#65676b]">Cập nhật bài viết, câu hỏi và kinh nghiệm học tập mới nhất</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-[270px]">
                <div className="rounded-md bg-[#f0f2f5] px-3 py-2 text-center">
                  <div className="text-base font-bold text-[#050505]">{posts.length}</div>
                  <div className="text-[11px] font-bold uppercase text-[#65676b]">Bài</div>
                </div>
                <div className="rounded-md bg-[#f0f2f5] px-3 py-2 text-center">
                  <div className="text-base font-bold text-[#1877f2]">{loadedLikeCount}</div>
                  <div className="text-[11px] font-bold uppercase text-[#65676b]">Thích</div>
                </div>
                <div className="rounded-md bg-[#f0f2f5] px-3 py-2 text-center">
                  <div className="text-base font-bold text-[#42b72a]">{loadedCommentCount}</div>
                  <div className="text-[11px] font-bold uppercase text-[#65676b]">Bình luận</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-4 py-3">
              <div className="grid grid-cols-2 gap-2 xl:hidden">
                <Link
                  to="/app/community"
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#e7f3ff] text-sm font-bold text-[#1877f2]"
                >
                  <Home className="h-4 w-4" />
                  Feed
                </Link>
                <Link
                  to="/app/community/rooms"
                  className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#f0f2f5] text-sm font-bold text-[#050505]"
                >
                  <MessageSquare className="h-4 w-4" />
                  Phòng chat
                </Link>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#65676b]" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm trên SkillSprint"
                  className="h-11 rounded-full border-0 bg-[#f0f2f5] pl-11 pr-11 text-[15px] shadow-none placeholder:text-[#65676b] focus-visible:ring-2 focus-visible:ring-[#1877f2]"
                />
                {(hashtagFilter || searchFilter) && (
                  <button
                    type="button"
                    title="Xóa lọc"
                    onClick={clearFilters}
                    className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#65676b] transition hover:bg-[#e4e6eb] hover:text-[#050505]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>

              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_TOPICS.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-[#f0f2f5] px-4 text-sm font-bold text-[#050505] transition hover:bg-[#e4e6eb]"
                  >
                    <Hash className="h-4 w-4 text-[#1877f2]" />
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)} />

          <div className="rounded-lg bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col gap-3 border-b border-[#e4e6eb] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[17px] font-bold text-[#050505]">
                <Sparkles className="h-5 w-5 text-[#1877f2]" />
                Bài viết mới nhất
              </div>

              {(hashtagFilter || searchFilter) && (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-full bg-[#e7f3ff] px-3 py-1.5 text-sm font-bold text-[#1877f2]">
                    {hashtagFilter ? <Hash className="h-4 w-4 shrink-0" /> : <Search className="h-4 w-4 shrink-0" />}
                    <span className="truncate">{activeFilterLabel}</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0f2f5] text-[#65676b] transition hover:bg-[#e4e6eb] hover:text-[#050505]"
                    title="Xóa lọc"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}

            <div ref={observerTarget} className="flex justify-center py-5 text-[#65676b]">
              {isLoading && (
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d8dadf] border-t-[#1877f2]" />
              )}
              {loadError && !isLoading && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-bold text-[#1877f2] shadow-sm ring-1 ring-black/10 transition hover:bg-[#f0f2f5]"
                >
                  <RefreshCw className="h-4 w-4" />
                  Thử lại
                </button>
              )}
              {!hasMore && posts.length > 0 && !isLoading && !loadError && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#65676b] shadow-sm ring-1 ring-black/5">
                  Bạn đã xem hết tin hôm nay
                </span>
              )}
              {!hasMore && posts.length === 0 && !isLoading && !loadError && (
                <span className="rounded-lg border border-dashed border-[#ced0d4] bg-white px-5 py-4 text-center text-sm font-semibold text-[#65676b]">
                  Chưa có bài viết phù hợp.
                </span>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4">
            <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#65676b]">Đang nổi bật</h2>
                <TrendingUp className="h-5 w-5 text-[#1877f2]" />
              </div>
              <div className="space-y-1">
                {trendingHashtags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleTopicSelect(item.tag)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2.5 text-left transition hover:bg-[#f0f2f5]"
                  >
                    <span className="min-w-0 truncate text-[15px] font-semibold text-[#050505]">#{item.tag}</span>
                    <span className="ml-3 shrink-0 text-xs font-semibold text-[#65676b]">
                      {item.count > 0 ? `${item.count} bài` : "gợi ý"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[17px] font-bold text-[#65676b]">Hoạt động</h2>
                <Bell className="h-5 w-5 text-[#65676b]" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e7f3ff] text-[#1877f2]">
                    <Flame className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050505]">Feed học tập đang mở</p>
                    <p className="text-xs text-[#65676b]">{posts.length} bài đã tải trong phiên này</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e6f4ea] text-[#42b72a]">
                    <GraduationCap className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#050505]">Cùng nhau học tốt hơn</p>
                    <p className="text-xs text-[#65676b]">Đặt câu hỏi rõ ràng, phản hồi tử tế</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="mb-3 flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-[#1877f2]" />
                <h2 className="text-[17px] font-bold text-[#65676b]">Quy tắc cộng đồng</h2>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-[#65676b]">
                <p>Chia sẻ rõ vấn đề bạn đang học.</p>
                <p>Góp ý lịch sự và có ví dụ cụ thể.</p>
                <p>Dùng hashtag để mọi người dễ tìm kiếm.</p>
              </div>
            </section>

            <p className="px-1 text-xs leading-relaxed text-[#65676b]">
              SkillSprint © 2026
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
