"use client";

import { useState } from "react";
import type { Submission } from "@/lib/types/submission";
import { manualReview } from "@/lib/genlayer/writes";
import StatusBadge from "@/components/shared/StatusBadge";
import { formatChainTimestamp, pickChainDate } from "@/lib/utils/format";
import { MANUAL_BADGE_LEVELS } from "@/lib/utils/constants";

type Props = {
  submissions: Submission[];
  onRefresh: () => void;
};

export default function ManualReviewPanel({ submissions, onRefresh }: Props) {
  const pending = submissions.filter((s) => s.status === "needs_manual_review");

  if (pending.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-muted text-sm">
        No submissions awaiting manual review.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((sub) => (
        <ManualReviewItem key={sub.submission_id} submission={sub} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

function ManualReviewItem({
  submission,
  onRefresh,
}: {
  submission: Submission;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected">("approved");
  const [badgeLevel, setBadgeLevel] = useState<string>("attendee");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!reason.trim()) {
      setError("Please add a review note for the attendee");
      return;
    }
    if (decision === "approved" && !badgeLevel) {
      setError("Select a badge level for approved submissions");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await manualReview({
        submission_id: submission.submission_id,
        decision,
        // Contract rejects "none" when decision is "approved"
        badge_level: decision === "rejected" ? "none" : badgeLevel,
        reason,
      });
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="flex w-full items-center justify-between p-4 text-left hover:bg-background/30 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="min-w-0">
          <p className="text-sm font-medium text-gp-text truncate">{submission.submission_id}</p>
          <p className="text-xs text-muted font-mono">{submission.attendee.slice(0, 18)}…</p>
          <p className="text-xs text-muted">{formatChainTimestamp(pickChainDate(submission.submitted_at_iso, submission.submitted_at))}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={submission.status} />
          <span className="text-xs text-muted">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Proof preview */}
          <div className="rounded-lg bg-background p-3 space-y-2">
            <p className="text-xs text-muted uppercase tracking-wider">Reflection</p>
            <p className="text-sm text-gp-text">{submission.reflection}</p>
          </div>

          {submission.reasons.length > 0 && (
            <div>
              <p className="text-xs text-muted uppercase tracking-wider mb-1">AI Notes</p>
              <ul className="space-y-1">
                {submission.reasons.map((r, i) => (
                  <li key={i} className="text-xs text-muted">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Decision controls */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-muted">Decision</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value as "approved" | "rejected")}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gp-text focus:border-primary focus:outline-none"
              >
                <option value="approved">Approve</option>
                <option value="rejected">Reject</option>
              </select>
            </div>

            {decision === "approved" && (
              <div className="space-y-1">
                <label className="text-xs text-muted">Badge Level</label>
                <select
                  value={badgeLevel}
                  onChange={(e) => setBadgeLevel(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gp-text focus:border-primary focus:outline-none"
                >
                  {MANUAL_BADGE_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted">Review Note</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for decision"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gp-text focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 transition-colors ${
              decision === "approved"
                ? "bg-success hover:bg-success/90"
                : "bg-danger hover:bg-danger/90"
            }`}
          >
            {loading
              ? "Submitting…"
              : `Confirm ${decision === "approved" ? "Approval" : "Rejection"}`}
          </button>
        </div>
      )}
    </div>
  );
}
