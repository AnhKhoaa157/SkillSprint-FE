import React, { useState } from "react";
import { Send, Tag } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Textarea } from "../../../components/ui/textarea";
import { Input } from "../../../components/ui/input";
import { toast } from "sonner";
import communityService from "../../../../api/community/communityService";

interface CreatePostBoxProps {
  onPostCreated: () => void;
}

export function CreatePostBox({ onPostCreated }: CreatePostBoxProps) {
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    setIsSubmitting(true);
    try {
      // Parse hashtags (split by comma or space)
      const parsedHashtags = hashtags
        .split(/[\s,]+/)
        .map(tag => tag.startsWith("#") ? tag.substring(1) : tag)
        .filter(tag => tag.length > 0);

      const post = await communityService.createPost({
        content,
        hashtags: parsedHashtags
      });

      if (post.status === "PENDING_MODERATION") {
        toast.info("Bài viết của bạn đang chờ quản trị viên duyệt.", { duration: 5000 });
      } else {
        toast.success("Đăng bài viết thành công!");
      }
      
      setContent("");
      setHashtags("");
      onPostCreated();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi đăng bài.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 w-full transition-shadow hover:shadow-md">
      <Textarea
        value={content}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
        placeholder="Bạn muốn chia sẻ kiến thức gì hôm nay?"
        className="min-h-[100px] border-none focus-visible:ring-0 px-0 resize-none text-base placeholder:text-slate-400"
        maxLength={5000}
      />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-3 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Tag size={16} className="text-slate-400" />
          <Input
            value={hashtags}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHashtags(e.target.value)}
            placeholder="Hashtags (VD: React, SpringBoot)"
            className="h-8 border-slate-200 text-sm w-full sm:w-64"
          />
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs text-slate-400 font-medium">
            {content.length}/5000
          </span>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !content.trim()}
            className="bg-[#FF6B00] hover:bg-[#EA580C] text-white rounded-full px-6 transition-all active:scale-95 flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            Đăng bài
          </Button>
        </div>
      </div>
    </div>
  );
}
