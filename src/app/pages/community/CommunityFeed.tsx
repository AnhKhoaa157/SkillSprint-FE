import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  Hash, Home, MessageSquare, RefreshCw, Search, TrendingUp,
  X, Pencil, ChevronDown, BookOpenCheck, CircleCheck, Flame, Users,
} from "lucide-react";

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
    <aside className="hidden xl:flex flex-col w-[248px] shrink-0">
      <div className="sticky top-6 space-y-2">
        {/* Navigation card */}
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Cộng đồng</p>
          </div>
          <nav className="p-2 space-y-0.5">
            <Link to="/app/community"
              className="flex h-10 items-center gap-3 rounded-xl bg-[#FF6B00] px-3 text-[13px] font-bold text-white shadow-sm shadow-[#FF6B00]/20">
              <Home className="h-4 w-4 shrink-0" />
              <span>Bảng tin</span>
            </Link>
            <Link to="/app/community/rooms"
              className="flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              <MessageSquare className="h-4 w-4 shrink-0 text-slate-400" />
              <span>Phòng học tập</span>
            </Link>
          </nav>
        </div>

        {/* Topic channels — Discord-style */}
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <button type="button" onClick={() => setTopicsOpen(v => !v)}
            className="flex w-full items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-[#FF6B00]" />
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Chủ đề học tập</p>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${topicsOpen ? "" : "-rotate-90"}`} />
          </button>
          {topicsOpen && (
            <div className="p-2 space-y-0.5">
              {QUICK_TOPICS.map(topic => {
                const isActive = activeHashtag === topic;
                return (
                  <button key={topic} type="button" onClick={() => onTopicSelect(topic)}
                    className={`group flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13px] font-semibold transition-colors ${
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
    <aside className="hidden xl:flex flex-col w-[248px] shrink-0">
      <div className="sticky top-6 space-y-3">
        {/* Trending */}
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
              <p className="text-[12px] font-black text-slate-700">Xu hướng hôm nay</p>
            </div>
          </div>
          <div className="p-2 space-y-0.5">
            {trendingHashtags.map((item, idx) => (
              <button key={item.tag} type="button" onClick={() => onTopicSelect(item.tag)}
                className="group flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[11px] font-black text-slate-400 w-5 shrink-0 text-right">#{idx + 1}</span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-slate-800 truncate">#{item.tag}</p>
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

        {/* Community rules */}
        <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <BookOpenCheck className="h-4 w-4 text-slate-500" />
            <p className="text-[12px] font-black text-slate-700">Nội quy cộng đồng</p>
          </div>
          <div className="p-4 space-y-3">
            {["Đặt câu hỏi rõ ràng, chi tiết.", "Tôn trọng và lịch sự với nhau.", "Dùng hashtag phù hợp."].map((rule, i) => (
              <div key={rule} className="flex items-start gap-2.5">
                <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <p className="text-[12px] text-slate-600 leading-snug">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="px-2 text-[10px] font-semibold text-slate-400">SkillSprint © 2026</p>
      </div>
    </aside>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function SkeletonPost() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm animate-pulse space-y-4">
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 border border-orange-200/60 mb-4">
        <Pencil className="h-7 w-7 text-[#FF6B00]" />
      </div>
      <h3 className="text-[15px] font-bold text-slate-800">Bảng tin đang trống</h3>
      <p className="mt-2 text-[13px] text-slate-400 max-w-xs leading-relaxed">
        Hãy là người đầu tiên chia sẻ kiến thức với cộng đồng học tập!
      </p>
      <button type="button" onClick={onCreatePost}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-full bg-[#FF6B00] px-6 text-[12px] font-bold text-white shadow-md shadow-[#FF6B00]/20 hover:bg-[#e85f00] transition active:scale-95">
        Tạo bài đăng đầu tiên
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────
   Mobile Nav
───────────────────────────────────────── */
function MobileCommunityNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg backdrop-blur-md xl:hidden">
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
    if (trimmedInput.startsWith("#")) { setHashtagFilter(trimmedInput.substring(1)); setSearchFilter(""); }
    else { setSearchFilter(trimmedInput); setHashtagFilter(""); }
  };

  const handlePostUpdated = (updatedPost: CommunityPost) =>
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  const handlePostDeleted = (postId: string) =>
    setPosts(prev => prev.filter(p => p.postId !== postId));
  const handleRetry = () => {
    const isInitialLoad = posts.length === 0;
    fetchPosts(isInitialLoad ? 0 : page + 1, hashtagFilter, searchFilter, isInitialLoad);
  };
  const handleTopicSelect = (topic: string) => {
    setSearchInput(`#${topic}`); setHashtagFilter(topic); setSearchFilter("");
  };
  const clearFilters = () => { setSearchInput(""); setHashtagFilter(""); setSearchFilter(""); };

  const trendingHashtags = React.useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach(post => post.hashtags?.forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    const fromPosts = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => ({ tag, count }));
    return fromPosts.length > 0 ? fromPosts : QUICK_TOPICS.map(tag => ({ tag, count: 0 }));
  }, [posts]);

  const isInitialLoading = isLoading && posts.length === 0 && !loadError;

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      <div className="mx-auto grid w-full max-w-[1320px] grid-cols-1 gap-4 px-2 pb-28 pt-4
        sm:px-4 lg:max-w-[780px] xl:max-w-[1320px] xl:grid-cols-[248px_minmax(0,1fr)_248px] xl:pb-8">

        <Sidebar onTopicSelect={handleTopicSelect} activeHashtag={hashtagFilter} />

        <main className="min-w-0 space-y-3">
          {/* Feed header */}
          <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm">
            <div className="px-4 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-[15px] sm:text-[16px] font-black text-slate-900">
                    Cộng đồng <span className="bg-gradient-to-r from-[#FF6B00] to-[#FF9A3C] bg-clip-text text-transparent">SkillSprint</span>
                  </h1>
                  <p className="mt-0.5 text-[11px] sm:text-[12px] text-slate-400">Thảo luận công nghệ & chia sẻ kiến thức</p>
                </div>
                {/* Mobile: compact filter + search row */}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(hashtagFilter || searchFilter) && (
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200/60 px-3 text-[11px] font-bold text-[#FF6B00]">
                    {hashtagFilter ? `#${hashtagFilter}` : searchFilter}
                    <button type="button" onClick={clearFilters} className="hover:text-red-500 transition">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    placeholder="Tìm bài viết, hashtag..."
                    className="h-9 w-full sm:w-52 rounded-full border border-slate-200 bg-slate-100 pl-9 pr-4 text-[12px] font-medium outline-none transition focus:bg-white focus:border-[#FF6B00] focus:ring-2 focus:ring-[#FF6B00]/10 sm:focus:w-64"
                  />
                </form>
              </div>
            </div>
          </div>

          {/* Create post */}
          <CreatePostBox
            openSignal={composerOpenSignal}
            onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)}
          />

          {/* Feed label */}
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

          {/* Posts */}
          <div className="flex flex-col gap-3">
            {isInitialLoading && [0, 1, 2].map(i => <SkeletonPost key={i} />)}
            {!isInitialLoading && posts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
            ))}

            <div ref={observerTarget} className="flex justify-center py-5">
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
