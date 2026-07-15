import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  Hash, Home, MessageSquare, RefreshCw, Search, TrendingUp,
  X, Pencil, ChevronDown, BookOpenCheck, CircleCheck, Flame, Users, Bell, Bookmark, CalendarDays, Sparkles
} from "lucide-react";
import { normalizeHashtag, normalizeHashtagValue } from "./communityHashtags";

const PAGE_SIZE = 10;
const LOAD_ERROR_TOAST_ID = "community-feed-load-error";
const QUICK_TOPICS = ["React", "SpringBoot", "Interview", "Roadmap", "TypeScript"];

interface TopicItem { tag: string; count: number; }
interface SidebarProps { onTopicSelect: (topic: string) => void; activeHashtag: string; }
interface RightPanelProps { trendingHashtags: TopicItem[]; onTopicSelect: (topic: string) => void; }

/* ─────────────────────────────────────────
   Left Sidebar — Discord nav concept, light theme
───────────────────────────────────────── */
function Sidebar({ onTopicSelect, activeHashtag }: SidebarProps) {
  const [topicsOpen, setTopicsOpen] = useState(true);

  return (
    <aside className="hidden w-[224px] shrink-0 xl:flex xl:flex-col">
      <div className="sticky top-6 space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] border border-white bg-white/85 p-2 shadow-[0_14px_40px_rgba(71,50,35,0.06)] backdrop-blur-xl">
          <div className="px-3 pb-2 pt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Không gian của bạn</p>
          </div>
          <nav className="space-y-1">
            <Link to="/app/community"
              className="relative flex h-11 items-center gap-3 overflow-hidden rounded-2xl bg-orange-50 px-3 text-[13px] font-extrabold text-[#E85F00] transition hover:bg-orange-100/70">
              <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-[#FF6B00]" />
              <Home className="h-4 w-4 shrink-0" strokeWidth={2.2} />
              <span>Bảng tin</span>
            </Link>
            <Link to="/app/community/rooms"
              className="flex h-11 items-center gap-3 rounded-2xl px-3 text-[13px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950">
              <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Phòng học tập</span>
            </Link>
          </nav>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white bg-white/85 shadow-[0_14px_40px_rgba(71,50,35,0.06)] backdrop-blur-xl">
          <button type="button" onClick={() => setTopicsOpen(v => !v)}
            className="flex w-full items-center justify-between border-b border-slate-100/80 px-4 py-4 transition-colors hover:bg-orange-50/40">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-[#FF6B00]" />
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Chủ đề học tập</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${topicsOpen ? "" : "-rotate-90"}`} />
          </button>
          {topicsOpen && (
            <div className="space-y-1 p-2.5">
              {QUICK_TOPICS.map(topic => {
                const isActive = activeHashtag === topic;
                return (
                  <button key={topic} type="button" onClick={() => onTopicSelect(topic)}
                    className={`group flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-semibold transition-all ${
                      isActive
                        ? "bg-orange-50 text-[#FF6B00] font-bold"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}>
                    <Hash className={`h-4 w-4 shrink-0 transition-colors ${isActive ? "text-[#FF6B00]" : "text-slate-400 group-hover:text-slate-600"}`} />
                    <span>{topic}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#FF6B00]" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   Right Panel — Facebook-style suggestions
───────────────────────────────────────── */
function RightPanel({ trendingHashtags, onTopicSelect }: RightPanelProps) {
  return (
    <aside className="hidden w-[260px] shrink-0 xl:flex xl:flex-col">
      <div className="sticky top-6 space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] border border-white bg-white/85 shadow-[0_14px_40px_rgba(71,50,35,0.06)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-4 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
              <p className="text-[13px] font-black text-slate-800">Đang được quan tâm</p>
            </div>
          </div>
          <div className="space-y-1 p-2.5">
            {trendingHashtags.map((item, idx) => (
              <button key={item.tag} type="button" onClick={() => onTopicSelect(item.tag)}
                className="group flex w-full items-center justify-between rounded-2xl px-3 py-2.5 transition-colors hover:bg-orange-50/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-50 text-[10px] font-black text-slate-400 transition group-hover:bg-white group-hover:text-[#FF6B00]">{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{normalizeHashtag(item.tag)}</p>
                    {item.count > 0 && (
                      <p className="text-[11px] text-slate-400">{item.count} bài viết</p>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black text-[#FF6B00] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">Xem</span>
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-white bg-white/75 shadow-[0_14px_40px_rgba(71,50,35,0.05)] backdrop-blur-xl">
          <div className="flex items-center gap-2 border-b border-slate-100/80 px-4 py-4">
            <BookOpenCheck className="h-4 w-4 text-slate-500" />
            <p className="text-[12px] font-black text-slate-700">Nội quy cộng đồng</p>
          </div>
          <div className="space-y-3.5 p-4">
            {["Đặt câu hỏi rõ ràng, chi tiết.", "Tôn trọng và lịch sự với nhau.", "Dùng hashtag phù hợp."].map((rule) => (
              <div key={rule} className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#FF8A3D]" />
                <p className="text-[12px] text-slate-600 leading-snug">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="px-3 text-[10px] font-semibold text-slate-400">SkillSprint © 2026 · Học cùng nhau</p>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function SkeletonPost() {
  return (
    <div className="animate-pulse space-y-4 overflow-hidden rounded-[1.75rem] border border-white bg-white/80 p-5 shadow-[0_14px_40px_rgba(71,50,35,0.05)]">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full bg-slate-100" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-slate-100" />
          <div className="h-2.5 w-16 rounded-full bg-slate-50" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded-full bg-slate-100" />
        <div className="h-3 w-5/6 rounded-full bg-slate-100" />
        <div className="h-3 w-4/6 rounded-full bg-slate-100" />
      </div>
      <div className="flex gap-2 pt-1">
        <div className="h-7 w-20 rounded-full bg-slate-50" />
        <div className="h-7 w-24 rounded-full bg-slate-50" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Empty State
───────────────────────────────────────── */
function EmptyState({ onCreatePost }: { onCreatePost: () => void }) {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-orange-100 bg-white/80 px-5 py-14 text-center shadow-[0_20px_55px_rgba(71,50,35,0.06)] sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-orange-50/90 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full bg-orange-100/70 blur-3xl" />
      <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-[1.35rem] border border-orange-200/70 bg-white text-[#FF6B00] shadow-[0_10px_28px_rgba(255,107,0,0.12)]">
        <Pencil className="h-7 w-7" />
      </div>
      <p className="relative text-[10px] font-black uppercase tracking-[0.18em] text-[#FF6B00]">Bắt đầu cuộc trò chuyện</p>
      <h3 className="relative mt-2 text-xl font-black tracking-[-0.02em] text-slate-950">Hôm nay bạn học được gì?</h3>
      <p className="relative mt-2 max-w-sm text-[13px] leading-6 text-slate-500">
        Chia sẻ một mẹo nhỏ, câu hỏi hay hoặc điều mới bạn vừa khám phá.
      </p>
      <button type="button" onClick={onCreatePost}
        className="relative mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-[#FF6B00] px-5 text-[12px] font-bold text-white shadow-[0_10px_24px_rgba(255,107,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#e85f00] hover:shadow-[0_14px_30px_rgba(255,107,0,0.22)] active:translate-y-0 active:scale-[0.98]">
        <Pencil className="h-4 w-4" /> Viết bài đầu tiên
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Mobile Nav
───────────────────────────────────────── */
function MobileCommunityNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-white bg-white/90 p-2 shadow-[0_16px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl xl:hidden">
      <Link to="/app/community"
        className="flex h-10 items-center justify-center gap-2 rounded-xl bg-[#FF6B00] text-xs font-black uppercase tracking-wider text-white">
        <Home className="h-4 w-4" /> Bảng tin
      </Link>
      <Link to="/app/community/rooms"
        className="flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50">
        <MessageSquare className="h-4 w-4 text-slate-500" /> Phòng chat
      </Link>
    </nav>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [composerOpenSignal, setComposerOpenSignal] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchPosts = useCallback(async (pageToFetch: number, hashtag?: string, search?: string, isNewSearch = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setLoadError(false);
    try {
      const res = await communityService.getPosts(pageToFetch, PAGE_SIZE, search, hashtag);
      if (isNewSearch) { setPosts(res.items); } else { setPosts(prev => [...prev, ...res.items]); }
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

  useEffect(() => { fetchPosts(0, hashtagFilter, searchFilter, true); }, [fetchPosts, hashtagFilter, searchFilter]);

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target?.isIntersecting && posts.length > 0 && hasMore && !loadError && !isFetchingRef.current) {
      fetchPosts(page + 1, hashtagFilter, searchFilter, false);
    }
  }, [fetchPosts, page, posts.length, hasMore, loadError, hashtagFilter, searchFilter]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { root: null, rootMargin: "200px", threshold: 0 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedInput = searchInput.trim();
    if (trimmedInput.startsWith("#")) {
      const normalizedFilter = normalizeHashtagValue(trimmedInput);
      setHashtagFilter(normalizedFilter);
      setSearchInput(normalizedFilter ? normalizeHashtag(normalizedFilter) : "");
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
    const normalizedTopic = normalizeHashtagValue(topic);
    if (!normalizedTopic) return;
    setSearchInput(normalizeHashtag(normalizedTopic));
    setHashtagFilter(normalizedTopic);
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
        const normalizedTag = normalizeHashtagValue(tag);
        if (!normalizedTag) return;
        counts.set(normalizedTag, (counts.get(normalizedTag) ?? 0) + 1);
      });
    });

    const fromPosts = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    return fromPosts.length > 0 ? fromPosts : QUICK_TOPICS.map(tag => ({ tag, count: 0 }));
  }, [posts]);

  const isInitialLoading = isLoading && posts.length === 0 && !loadError;

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#F7F7F5]">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_8%,rgba(255,237,223,0.9),transparent_30%),radial-gradient(circle_at_86%_24%,rgba(255,246,234,0.85),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-25 [background-image:radial-gradient(rgba(255,107,0,0.16)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_52%)]" />
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-5 px-3 pb-28 pt-5 sm:px-5 lg:max-w-[820px] xl:max-w-[1400px] xl:grid-cols-[224px_minmax(0,1fr)_260px] xl:gap-6 xl:pb-10">

        <Sidebar onTopicSelect={handleTopicSelect} activeHashtag={hashtagFilter} />

        <main className="min-w-0 space-y-4">
          <section className="relative overflow-hidden rounded-[1.75rem] border border-white bg-white/85 shadow-[0_18px_50px_rgba(71,50,35,0.07)] backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-100/55 blur-3xl" />
            <div className="relative flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#FF6B00]"><Sparkles className="h-3 w-3" />Cùng học, cùng tiến bộ</div>
                  <h1 className="text-xl font-black tracking-[-0.025em] text-slate-950 sm:text-2xl">
                    Cộng đồng <span className="text-[#FF6B00]">SkillSprint</span>
                  </h1>
                  <p className="mt-1 text-[12px] leading-5 text-slate-500 sm:text-[13px]">Hỏi điều chưa rõ, chia sẻ điều vừa học.</p>
                </div>
                <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-orange-100 bg-white text-[#FF6B00] shadow-sm sm:flex"><Users className="h-5 w-5" /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-[#F8F9FA] p-1.5 transition focus-within:border-orange-200 focus-within:bg-white focus-within:shadow-[0_8px_24px_rgba(255,107,0,0.08)]">
                {(hashtagFilter || searchFilter) && (
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-orange-200/60 bg-orange-50 px-3 text-[11px] font-bold text-[#FF6B00]">
                    {hashtagFilter ? `#${hashtagFilter}` : searchFilter}
                    <button type="button" onClick={clearFilters} className="hover:text-red-500 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <form onSubmit={handleSearchSubmit} className="relative min-w-0 flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Tìm bài viết, hashtag..."
                    className="h-10 w-full border-0 bg-transparent pl-10 pr-4 text-[12px] font-semibold text-slate-800 outline-none placeholder:font-medium placeholder:text-slate-400"
                  />
                </form>
              </div>
            </div>
          </section>

          <CreatePostBox
            openSignal={composerOpenSignal}
            onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)}
          />

          {(hashtagFilter || searchFilter) && (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-[#FF6B00]" />
                <span className="text-[13px] font-bold text-slate-700">
                  {hashtagFilter ? `#${hashtagFilter}` : `"${searchFilter}"`}
                </span>
              </div>
              <button type="button" onClick={clearFilters}
                className="text-[12px] font-bold text-[#FF6B00] hover:underline">
                Xem tất cả
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {isInitialLoading && [0, 1, 2].map(i => <SkeletonPost key={i} />)}
            {!isInitialLoading && posts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}

            <div ref={observerTarget} className="flex w-full justify-center py-4">
              {isLoading && !isInitialLoading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#FF6B00]" />
              )}
              {loadError && !isLoading && (
                <button type="button" onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-bold text-[#FF6B00] shadow-sm ring-1 ring-slate-200 hover:bg-orange-50 transition">
                  <RefreshCw className="h-3.5 w-3.5" /> Thử tải lại
                </button>
              )}
              {!hasMore && posts.length > 0 && !isLoading && !loadError && (
                <p className="rounded-full bg-white px-4 py-2 text-[12px] text-slate-400 shadow-sm ring-1 ring-slate-100">
                  Bạn đã xem hết bài viết hôm nay 🎉
                </p>
              )}
              {!hasMore && posts.length === 0 && !isLoading && !loadError && (
                <EmptyState onCreatePost={() => setComposerOpenSignal(v => v + 1)} />
              )}
            </div>
          </div>
        </main>

        <RightPanel trendingHashtags={trendingHashtags} onTopicSelect={handleTopicSelect} />
      </div>

      <MobileCommunityNav />
    </div>
  );
}
