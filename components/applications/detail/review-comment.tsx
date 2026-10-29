"use client";
import { useState } from "react";
import { CheckCircle2, CornerDownRight, MessageSquare, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MemberAvatar } from "@/components/shared/avatar";
import { replyToComment, resolveComment } from "@/lib/data-service";
import type { ReviewComment } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

export function ReviewCommentItem({ reviewId, comment }: { reviewId: string; comment: ReviewComment }) {
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  return (
    <div className={cn("rounded-lg border border-border p-3", comment.resolved ? "bg-muted/40" : "bg-card")}>
      <div className="flex items-start gap-2.5">
        <MemberAvatar id={comment.authorId} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[13px] font-medium">{comment.authorName}</span>
            <span className="text-[11px] text-muted-foreground">{relativeTime(comment.createdAt)}</span>
            {comment.sectionTitle && <Badge variant="secondary">{comment.sectionTitle}</Badge>}
            {comment.resolved && <Badge variant="success">Resolved</Badge>}
          </div>
          <p className={cn("mt-1 text-[13px] leading-relaxed", comment.resolved && "text-muted-foreground")}>{comment.body}</p>
          {comment.replies.length > 0 && (
            <ul className="mt-2 space-y-2 border-l-2 border-border pl-3">
              {comment.replies.map((r) => (
                <li key={r.id} className="flex items-start gap-2">
                  <MemberAvatar id={r.authorId} size="xs" />
                  <div className="min-w-0">
                    <div className="text-[12px]">
                      <span className="font-medium">{r.authorName}</span> <span className="text-muted-foreground">{relativeTime(r.createdAt)}</span>
                    </div>
                    <p className="text-[13px] text-slate-700">{r.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {replying && (
            <form
              className="mt-2 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!reply.trim()) return;
                replyToComment(reviewId, comment.id, reply.trim());
                setReply("");
                setReplying(false);
              }}
            >
              <Textarea autoFocus rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" />
              <div className="flex gap-2">
                <Button type="submit" size="xs" disabled={!reply.trim()}>Reply</Button>
                <Button size="xs" variant="ghost" onClick={() => setReplying(false)}>Cancel</Button>
              </div>
            </form>
          )}
          {!replying && (
            <div className="mt-2 flex gap-1">
              <Button size="xs" variant="ghost" onClick={() => setReplying(true)}>
                <CornerDownRight /> Reply
              </Button>
              {comment.resolved ? (
                <Button size="xs" variant="ghost" onClick={() => resolveComment(reviewId, comment.id, false)}>
                  <RotateCcw /> Reopen
                </Button>
              ) : (
                <Button size="xs" variant="ghost" onClick={() => { resolveComment(reviewId, comment.id, true); toast.success("Comment resolved"); }}>
                  <CheckCircle2 /> Resolve
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyComments() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-4 text-[13px] text-muted-foreground">
      <MessageSquare className="size-4" /> No open comments.
    </div>
  );
}
