import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import {
  BookOpenCheck,
  Flame,
  Hash,
  MessageCircle,
  MessageSquare,
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
  { id: "latest", label: "Bảng tin", icon: Sparkles },
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
    <div className="relative min-h-screen bg-[#F0F2F5] pt-4 text-slate-900 sm:pt-6">
      <div className="mx-auto flex w-full max-w-[1600px] justify-center gap-4 px-2 sm:px-4 lg:gap-8">
        <aside className="hidden w-[280px] shrink-0 xl:block xl:w-[320px]">
          <div className="sticky top-20 space-y-6 px-2">
            <div className="space-y-1">
              <Link to="/app/community" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-200/60">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF7E21] to-[#FF6B00] text-white shadow-sm">
                  <Users className="h-5 w-5" />
                </div>
                <span className="font-semibold text-slate-800">SkillSprint Feed</span>
              </Link>
              <Link to="/app/community/rooms" className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-slate-200/60">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100/80 text-[#FF6B00]">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <span className="font-semibold text-slate-800">Phòng Chat</span>
              </Link>
            </div>

            <div className="mt-6 border-t border-slate-300/50 pt-4">
              <h3 className="mb-2 px-2 text-[15px] font-semibold text-slate-500">Chủ đề nhanh</h3>
              <div className="space-y-1">
                {QUICK_TOPICS.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleTopicSelect(topic)}
                    className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-slate-200/60"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100/50 text-[#FF6B00]">
                      <Hash className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-slate-700">{topic}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="w-full max-w-[590px] shrink-0 space-y-4 pb-20 sm:w-[590px] xl:max-w-[680px] xl:w-[680px]">
          <div className="rounded-2xl bg-white p-3 shadow-sm border border-slate-200/60">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-1 rounded-2xl bg-slate-100 p-1 min-w-[140px]">
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
          </div>

          <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, searchFilter, true)} />

          <div className="flex flex-col gap-4">
            {visiblePosts.map(post => (
              <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} onPostDeleted={handlePostDeleted} />
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

        <aside className="hidden w-[280px] shrink-0 lg:block xl:w-[320px]">
          <div className="sticky top-20 space-y-4 px-2">
            <div className="mb-2 pt-2">
              <h3 className="mb-4 text-[15px] font-semibold text-slate-500">Hashtag đang nổi</h3>
              <div className="space-y-1">
                {trendingHashtags.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleTopicSelect(item.tag)}
                    className="flex w-full items-center justify-between rounded-xl p-2 text-left transition hover:bg-slate-200/60"
                  >
                    <span className="font-semibold text-slate-800">#{item.tag}</span>
                    <span className="text-[13px] font-medium text-slate-500">
                      {item.count > 0 ? `${item.count} bài` : "gợi ý"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-300/50 pt-4">
              <h3 className="mb-2 text-[15px] font-semibold text-slate-500">Quy tắc cộng đồng</h3>
              <div className="space-y-3 text-[13px] text-slate-500">
                <p>• Chia sẻ rõ vấn đề bạn đang học.</p>
                <p>• Góp ý lịch sự và có ví dụ cụ thể.</p>
                <p>• Dùng hashtag để dễ tìm kiếm.</p>
              </div>
            </div>
            
            <div className="mt-6 text-[12px] text-slate-400">
              SkillSprint © 2026. Một sản phẩm được thiết kế với giao diện hiện đại.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
