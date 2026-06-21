import React, { useState, useEffect, useRef, useCallback } from "react";
import { CreatePostBox } from "./components/CreatePostBox";
import { PostCard } from "./components/PostCard";
import communityService from "../../../api/community/communityService";
import type { CommunityPost } from "../../../api/community/communityTypes";
import { toast } from "sonner";
import { Filter } from "lucide-react";
import { Input } from "../../components/ui/input";

const PAGE_SIZE = 10;
const LOAD_ERROR_TOAST_ID = "community-feed-load-error";

export default function CommunityFeed() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const observerTarget = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false);

  const fetchPosts = useCallback(async (pageToFetch: number, hashtag?: string, isNewSearch = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setLoadError(false);

    try {
      const res = await communityService.getPosts(pageToFetch, PAGE_SIZE, hashtag);
      if (isNewSearch) {
        setPosts(res.content);
      } else {
        setPosts(prev => [...prev, ...res.content]);
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
    fetchPosts(0, hashtagFilter, true);
  }, [fetchPosts, hashtagFilter]);

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target?.isIntersecting && posts.length > 0 && hasMore && !loadError && !isFetchingRef.current) {
        fetchPosts(page + 1, hashtagFilter, false);
      }
    },
    [fetchPosts, page, posts.length, hasMore, loadError, hashtagFilter]
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
    const cleanTag = searchInput.startsWith("#") ? searchInput.substring(1) : searchInput;
    setHashtagFilter(cleanTag);
  };

  const handlePostUpdated = (updatedPost: CommunityPost) => {
    setPosts(prev => prev.map(p => p.postId === updatedPost.postId ? updatedPost : p));
  };

  const handleRetry = () => {
    const isInitialLoad = posts.length === 0;
    fetchPosts(isInitialLoad ? 0 : page + 1, hashtagFilter, isInitialLoad);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6 py-4">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Cộng đồng học tập</h1>
          <p className="text-sm text-slate-500">Nơi giao lưu, hỏi đáp và chia sẻ kiến thức</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto relative">
          <Filter size={16} className="absolute left-3 text-slate-400" />
          <Input 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Lọc theo #hashtag"
            className="pl-9 w-full sm:w-56 bg-slate-50 rounded-full border-slate-200 focus-visible:ring-[#FF6B00]"
          />
          {hashtagFilter && (
            <button 
              type="button" 
              onClick={() => {
                setSearchInput("");
                setHashtagFilter("");
              }}
              className="text-xs text-slate-500 hover:text-slate-700 ml-2 whitespace-nowrap font-medium"
            >
              Xóa lọc
            </button>
          )}
        </form>
      </div>

      {/* Create Post Box */}
      <CreatePostBox onPostCreated={() => fetchPosts(0, hashtagFilter, true)} />

      {/* Feed List */}
      <div className="flex flex-col gap-5">
        {posts.map(post => (
          <PostCard key={post.postId} post={post} onPostUpdated={handlePostUpdated} />
        ))}
        
        {/* Loading / End markers */}
        <div ref={observerTarget} className="py-4 flex justify-center text-slate-400">
          {isLoading && (
            <div className="w-6 h-6 border-2 border-slate-200 border-t-[#FF6B00] rounded-full animate-spin" />
          )}
          {loadError && !isLoading && (
            <button
              type="button"
              onClick={handleRetry}
              className="text-sm font-semibold text-[#FF6B00] hover:underline"
            >
              Không thể tải bảng tin. Thử lại
            </button>
          )}
          {!hasMore && posts.length > 0 && !isLoading && !loadError && (
            <span className="text-sm font-medium">Bạn đã xem hết tin hôm nay 🎉</span>
          )}
          {!hasMore && posts.length === 0 && !isLoading && !loadError && (
            <span className="text-sm font-medium">Chưa có bài viết nào với hashtag này.</span>
          )}
        </div>
      </div>
    </div>
  );
}
