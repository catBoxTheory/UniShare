"use client";

import { useState, useRef, useOptimistic, useTransition } from "react";
import { MessageSquare, Trash2, Reply, Send } from "lucide-react";
import { createComment, deleteComment } from "@/app/actions/comments";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  isOwner: boolean;
  replies: ReplyData[];
}

interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; image: string | null };
  isOwner: boolean;
}

function timeAgo(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function CommentItem({ comment, materialId, onDelete }: {
  comment: CommentData;
  materialId: string;
  onDelete: (id: string) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimisticReplies, addOptimisticReply] = useOptimistic<ReplyData[], string>(
    comment.replies,
    (state, content) => [...state, {
      id: `temp-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      user: { id: "me", name: "You", image: null },
      isOwner: true,
    }]
  );

  const handleReply = () => {
    if (!replyText.trim()) return;
    startTransition(async () => {
      addOptimisticReply(replyText.trim());
      setReplyText("");
      setShowReply(false);
      await createComment(materialId, replyText.trim(), comment.id);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-semibold text-emerald-600">
            {comment.user.name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {comment.user.name || "Anonymous"}
            </span>
            <span className="text-[11px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/80 mt-0.5">{comment.content}</p>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => setShowReply(!showReply)}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
            {comment.isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>

          {showReply && (
            <div className="flex gap-1.5 mt-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleReply(); }}
                placeholder="Write a reply..."
                className="flex-1 h-8 text-xs bg-muted/50 border border-border rounded-md px-2 focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReply}
                disabled={isPending || !replyText.trim()}
                className="h-8 px-2"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {optimisticReplies.length > 0 && (
        <div className="ml-6 space-y-2 border-l-2 border-border pl-3">
          {optimisticReplies.map((reply) => (
            <div key={reply.id} className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[9px] font-semibold text-amber-600">
                  {reply.user.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{reply.user.name}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-foreground/80 mt-0.5">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({ materialId, initialComments }: {
  materialId: string;
  initialComments: CommentData[];
}) {
  const [commentText, setCommentText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [optimisticComments, addOptimisticComment] = useOptimistic<CommentData[], CommentData>(
    initialComments,
    (state, newComment) => [newComment, ...state]
  );
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const tempComment: CommentData = {
      id: `temp-${Date.now()}`,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      user: { id: "me", name: "You", image: null },
      isOwner: true,
      replies: [],
    };

    startTransition(async () => {
      addOptimisticComment(tempComment);
      setCommentText("");
      await createComment(materialId, commentText.trim());
    });
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
  };

  return (
    <div className="space-y-4">
      <form ref={formRef} onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 h-9 text-sm bg-muted/50 border border-border rounded-lg px-3 focus:outline-none focus:border-emerald-500/50"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !commentText.trim()}
          className="h-9"
        >
          <Send className="h-3.5 w-3.5 mr-1" />
          Post
        </Button>
      </form>

      {optimisticComments.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {optimisticComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              materialId={materialId}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
