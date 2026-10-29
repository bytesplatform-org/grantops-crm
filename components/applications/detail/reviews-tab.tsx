"use client";
import { useState } from "react";
import { CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck, ShieldCheck, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ReviewStatusBadge } from "@/components/shared/status-badge";
import { addReviewComment, setReviewStatus } from "@/lib/data-service";
import type { Review, ReviewType } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { EmptyComments, ReviewCommentItem } from "./review-comment";
import type { AppContext } from "./use-application";

const ICONS: Record<ReviewType, typeof Users> = { "Internal Review": ClipboardCheck, "Client Review": Users, "Compliance Review": ShieldCheck };
const ORDER: ReviewType[] = ["Internal Review", "Client Review", "Compliance Review"];

export function ReviewsTab({ ctx }: { ctx: AppContext }) {
  const reviews = [...ctx.reviews].sort((a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type));
  const sections = ctx.app.sections.map((s) => s.title);
  if (!reviews.length) return <p className="text-sm text-muted-foreground">No review cycles configured.</p>;
  return (
    <div className="grid gap-5 xl:grid-cols-3">
      {reviews.map((r) => (
        <ReviewPanel key={r.id} review={r} sections={sections} />
      ))}
    </div>
  );
}

function ReviewPanel({ review, sections }: { review: Review; sections: string[] }) {
  const [body, setBody] = useState("");
  const [section, setSection] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const Icon = ICONS[review.type];
  const open = review.comments.filter((c) => !c.resolved);
  const resolved = review.comments.filter((c) => c.resolved);
  const approved = review.status === "Approved";
  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b border-border pb-4">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary-soft text-primary">
              <Icon className="size-3.5" />
            </span>
            {review.type}
          </CardTitle>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><Users className="size-3" /> {review.reviewers.join(", ")}</div>
            <div className="flex items-center gap-1.5"><CalendarClock className="size-3" /> Due {formatDate(review.dueDate)}{review.approvedAt && ` · Approved ${formatDate(review.approvedAt)}`}</div>
          </div>
        </div>
        <ReviewStatusBadge status={review.status} />
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Open comments ({open.length})
        </div>
        {open.length === 0 ? <EmptyComments /> : open.map((c) => <ReviewCommentItem key={c.id} reviewId={review.id} comment={c} />)}
        {resolved.length > 0 && (
          <div>
            <button onClick={() => setShowResolved((s) => !s)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("size-3.5 transition-transform", showResolved && "rotate-180")} />
              {resolved.length} resolved comment{resolved.length > 1 ? "s" : ""}
            </button>
            {showResolved && (
              <div className="mt-2 space-y-2">
                {resolved.map((c) => (
                  <ReviewCommentItem key={c.id} reviewId={review.id} comment={c} />
                ))}
              </div>
            )}
          </div>
        )}
        <form
          className="mt-auto space-y-2 border-t border-border pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!body.trim()) return;
            addReviewComment(review.id, body.trim(), section || undefined);
            setBody("");
            setSection("");
            toast.success("Comment added");
          }}
        >
          <Textarea rows={2} value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Add a ${review.type.toLowerCase()} comment…`} />
          <div className="flex items-center gap-2">
            <Select value={section} onChange={(e) => setSection(e.target.value)} className="flex-1" aria-label="Section">
              <option value="">General comment</option>
              {sections.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
            <Button type="submit" size="sm" disabled={!body.trim()}>Comment</Button>
          </div>
        </form>
        <div className="flex gap-2">
          {approved ? (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setReviewStatus(review.id, "In Progress")}>
              <Undo2 /> Reopen review
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setReviewStatus(review.id, "Changes Requested"); toast("Changes requested", { description: review.type }); }}>
                Request changes
              </Button>
              <Button variant="success" size="sm" className="flex-1" onClick={() => { setReviewStatus(review.id, "Approved"); toast.success(`${review.type} approved`); }}>
                <CheckCircle2 /> Mark Approved
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
