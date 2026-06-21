import React, { useState, useEffect, useRef, useCallback } from "react";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  Award,
  BookOpenCheck,
  Flame,
  Hash,
  MessageCircle,
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

type FeedTab = "latest" | "popular" | "discussed";

const FEED_TABS: Array<{ id: FeedTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "latest", label: "Mới nhất", icon: Sparkles },
  { id: "popular", label: "Nổi bật", icon: Flame },
  { id: "discussed", label: "Thảo luận", icon: MessageCircle },
];

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activeTab, setActiveTab] = useState<FeedTab>("latest");
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

  const handleRetry = () => {
    const isInitialLoad = posts.length === 0;
    fetchPosts(isInitialLoad ? 0 : page + 1, hashtagFilter, searchFilter, isInitialLoad);
  };

  const handleTopicSelect = (topic: string) => {
    setSearchInput(`#${topic}`);
    setHashtagFilter(topic);
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

  const visiblePosts = React.useMemo(() => {
    const nextPosts = [...posts];

    if (activeTab === "popular") {
      return nextPosts.sort((a, b) => b.likeCount - a.likeCount);
    }

    if (activeTab === "discussed") {
      return nextPosts.sort((a, b) => b.commentCount - a.commentCount);
    }

    return nextPosts;
  }, [activeTab, posts]);

  const loadedCommentCount = posts.reduce((total, post) => total + post.commentCount, 0);
  const loadedLikeCount = posts.reduce((total, post) => total + post.likeCount, 0);

  return (
    <div className="relative min-h-screen bg-[#F9FAFB] px-2 py-5 text-slate-900 sm:px-4 lg:px-6">
      <div className="pointer-events-none absolute left-[-12%] top-[-12%] -z-10 h-[520px] w-[520px] rounded-full bg-[#FF6B00]/5 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-16%] top-[28%] -z-10 h-[460px] w-[460px] rounded-full bg-emerald-500/5 blur-[130px]" />

      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[240px_minmax(0,680px)] xl:grid-cols-[240px_minmax(0,680px)_300px]">
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-3">
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)]">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF7E21] to-[#FF6B00] text-white shadow-md shadow-orange-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-base font-extrabold text-slate-900">Cộng đồng</h1>
                  <p className="text-xs font-medium text-slate-500">SkillSprint Feed</p>
                </div>
              </div>

              <div className="grid gap-2 text-sm">
                {[
                  { icon: BookOpenCheck, label: "Hỏi đáp học tập" },
                  { icon: TrendingUp, label: "Chia sẻ tiến độ" },
                  { icon: Award, label: "Kinh nghiệm phỏng vấn" },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-slate-600 transition hover:bg-orange-50 hover:text-[#FF6B00]"
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.2)]">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chủ đề nhanh</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_TOPICS.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className="rounded-full border border-orange-100 bg-orange-50/70 px-3 py-1.5 text-xs font-bold text-[#FF6B00] transition hover:border-[#FF6B00]/40 hover:bg-orange-100"
                  >
                    #{topic}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[1.75rem] border border-orange-100 bg-gradient-to-br from-white via-[#FFF8F3] to-white p-5 shadow-[0_18px_42px_-24px_rgba(255,107,0,0.35)] sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#FF6B00]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Learning Social
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
                  Cộng đồng học tập
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600">
                  Đặt câu hỏi, chia sẻ điều vừa học và cùng nhau giữ nhịp sprint mỗi ngày.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:w-[270px]">
                {[
                  { label: "Bài viết", value: posts.length },
                  { label: "Bình luận", value: loadedCommentCount },
                  { label: "Lượt thích", value: loadedLikeCount },
                ].map(stat => (
                  <div key={stat.label} className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-center shadow-sm">
                    <div className="text-lg font-black text-slate-900">{stat.value}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.25)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1">
                {FEED_TABS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-3 text-xs font-extrabold transition ${
                        isActive
                          ? "bg-white text-[#FF6B00] shadow-sm"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handleSearchSubmit} className="relative flex min-w-0 flex-1 items-center gap-2 md:max-w-xs">
                <Search className="absolute left-3 h-4 w-4 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm bài viết hoặc #hashtag"
                  className="h-10 rounded-full border-slate-200 bg-slate-50 pl-9 pr-10 text-sm focus-visible:ring-[#FF6B00]"
                />
                {(hashtagFilter || searchFilter) && (
                  <button
                    type="button"
                    title="Xóa lọc"
                    onClick={() => {
                      setSearchInput("");
                      setHashtagFilter("");
                      setSearchFilter("");
                    }}
                    className="absolute right-2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>

            {hashtagFilter && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00]">
                <Hash className="h-3.5 w-3.5" />
                Đang xem #{hashtagFilter}
              </div>
            )}
            {searchFilter && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold text-[#FF6B00]">
                <Search className="h-3.5 w-3.5" />
                Kết quả tìm kiếm cho "{searchFilter}"
              </div>
            )}
          </section>

          <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)} />

          <div className="flex flex-col gap-4">
            {visiblePosts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} />
            ))}

            <div ref={observerTarget} className="flex justify-center py-5 text-slate-400">
              {isLoading && (
                <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-[#FF6B00] animate-spin" />
              )}
              {loadError && !isLoading && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-[#FF6B00] transition hover:bg-orange-100"
                >
                  Không thể tải bảng tin. Thử lại
                </button>
              )}
              {!hasMore && posts.length > 0 && !isLoading && !loadError && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-500 shadow-sm">
                  Bạn đã xem hết tin hôm nay
                </span>
              )}
              {!hasMore && posts.length === 0 && !isLoading && !loadError && (
                <span className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 text-center text-sm font-semibold text-slate-500">
                  Chưa có bài viết nào với hashtag này.
                </span>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.2)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900">Hashtag đang nổi</h3>
                <TrendingUp className="h-4 w-4 text-[#FF6B00]" />
              </div>
              <div className="space-y-2">
                {trendingHashtags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleTopicSelect(item.tag)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-orange-50"
                  >
                    <span className="text-sm font-bold text-slate-700">#{item.tag}</span>
                    <span className="text-xs font-semibold text-slate-400">
                      {item.count > 0 ? `${item.count} bài` : "gợi ý"}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/40 p-4 shadow-[0_12px_30px_-20px_rgba(255,107,0,0.25)]">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B00]">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">Quy tắc cộng đồng</h3>
              <div className="mt-3 space-y-2 text-sm font-medium text-slate-600">
                <p>Chia sẻ rõ vấn đề bạn đang học.</p>
                <p>Góp ý lịch sự và có ví dụ cụ thể.</p>
                <p>Dùng hashtag để mọi người tìm thấy chủ đề.</p>
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
