import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  BookOpenCheck,
  Hash,
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

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fb_220px,#eef2f7_100%)] text-slate-900">
      <div className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-7 xl:grid-cols-[232px_minmax(0,680px)_280px]">
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-5">
            <nav className="space-y-2">
              <Link
                to="/app/community"
                className="flex items-center gap-3 rounded-lg bg-white px-3 py-3 text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6B00] text-white shadow-sm shadow-orange-500/25">
                  <Users className="h-5 w-5" />
                </span>
                <span className="font-semibold">SkillSprint Feed</span>
              </Link>
              <Link
                to="/app/community/rooms"
                className="flex items-center gap-3 rounded-lg px-3 py-3 text-slate-700 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-[#FF6B00]">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span className="font-semibold">Phòng chat</span>
              </Link>
            </nav>

            <section className="space-y-3 border-t border-slate-200 pt-5">
              <div className="flex items-center gap-2 px-1 text-sm font-bold text-slate-500">
                <Hash className="h-4 w-4 text-[#FF6B00]" />
                Chủ đề nhanh
              </div>
              <div className="space-y-1">
                {QUICK_TOPICS.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-white hover:text-[#FF6B00] hover:shadow-sm"
                  >
                    <Hash className="h-4 w-4 text-orange-400" />
                    {topic}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <main className="min-w-0 space-y-4 pb-20">
          <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00]">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  Cộng đồng học tập
                </div>
                <h1 className="text-2xl font-black tracking-normal text-slate-950 sm:text-3xl">
                  SkillSprint Feed
                </h1>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[300px]">
                <div className="rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                  <div className="text-lg font-black text-slate-950">{posts.length}</div>
                  <div className="text-[11px] font-bold uppercase text-slate-400">Bài</div>
                </div>
                <div className="rounded-lg bg-orange-50 px-3 py-2 ring-1 ring-orange-100">
                  <div className="text-lg font-black text-[#FF6B00]">{loadedLikeCount}</div>
                  <div className="text-[11px] font-bold uppercase text-orange-400">Thích</div>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 ring-1 ring-emerald-100">
                  <div className="text-lg font-black text-emerald-700">{loadedCommentCount}</div>
                  <div className="text-[11px] font-bold uppercase text-emerald-500">Bình luận</div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
              <div className="grid grid-cols-2 gap-2 sm:hidden">
                <Link
                  to="/app/community"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 text-sm font-bold text-white"
                >
                  <Users className="h-4 w-4" />
                  Feed
                </Link>
                <Link
                  to="/app/community/rooms"
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-50 text-sm font-bold text-[#FF6B00] ring-1 ring-orange-100"
                >
                  <MessageSquare className="h-4 w-4" />
                  Phòng chat
                </Link>
              </div>

              <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm bài viết hoặc #hashtag"
                  className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-10 pr-10 text-sm shadow-none focus-visible:ring-[#FF6B00]"
                />
                {(hashtagFilter || searchFilter) && (
                  <button
                    type="button"
                    title="Xóa lọc"
                    onClick={clearFilters}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>
          </section>

          <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)} />

          <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-sm font-bold text-white shadow-sm">
              <Sparkles className="h-4 w-4" />
              <span>Bảng tin</span>
            </div>

            {(hashtagFilter || searchFilter) && (
              <div className="flex min-w-0 flex-wrap gap-2 px-1 sm:justify-end">
                {hashtagFilter && (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00] ring-1 ring-orange-100">
                    <Hash className="h-3.5 w-3.5" />
                    #{hashtagFilter}
                  </span>
                )}
                {searchFilter && (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00] ring-1 ring-orange-100">
                    <Search className="h-3.5 w-3.5" />
                    <span className="truncate">{searchFilter}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {posts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}

            <div ref={observerTarget} className="flex justify-center py-5 text-slate-400">
              {isLoading && (
                <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-[#FF6B00] animate-spin" />
              )}
              {loadError && !isLoading && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#FF6B00] transition hover:bg-orange-100"
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
                <span className="rounded-lg border border-dashed border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-500">
                  Chưa có bài viết phù hợp.
                </span>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800">Hashtag nổi bật</h2>
                <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
              </div>
              <div className="space-y-1">
                {trendingHashtags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleTopicSelect(item.tag)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition hover:bg-slate-50"
                  >
                    <span className="min-w-0 truncate text-sm font-bold text-slate-900">#{item.tag}</span>
                    <span className="ml-3 shrink-0 text-xs font-semibold text-slate-400">
                      {item.count > 0 ? `${item.count} bài` : "gợi ý"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-black text-slate-800">Quy tắc cộng đồng</h2>
              <div className="space-y-3 text-sm leading-relaxed text-slate-600">
                <p>Chia sẻ rõ vấn đề bạn đang học.</p>
                <p>Góp ý lịch sự và có ví dụ cụ thể.</p>
                <p>Dùng hashtag để dễ tìm kiếm.</p>
              </div>
            </section>

            <p className="px-1 text-xs leading-relaxed text-slate-400">
              SkillSprint © 2026
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
