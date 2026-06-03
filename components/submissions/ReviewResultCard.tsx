"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock, Loader2, Award, ChevronRight } from "lucide-react";
import type { Submission } from "@/lib/types/submission";
import { issueBadge, reviewSubmission } from "@/lib/genlayer/writes";
import ScoreMeter from "@/components/shared/ScoreMeter";
import BadgeLevelTag from "@/components/badges/BadgeLevelTag";
import RiskFlagList from "@/components/shared/RiskFlagList";
import { useWallet } from "@/lib/context/WalletContext";
import { toChecksum } from "@/lib/utils/address";

type Props = {
  submission: Submission;
  onRefresh: () => void;
};

type VerdictDisplay = {
  title: string;
  desc: string;
  borderColor: string;
  Icon: React.FC<{ className?: string }>;
  iconColor: string;
};

const VERDICT_DISPLAY: Record<string, VerdictDisplay> = {
  approved: {
    title: "Verification Complete",
    desc: "Your proof has been reviewed and approved. Claim your badge below.",
    borderColor: "border-success/20 bg-success/5",
    Icon: CheckCircle,
    iconColor: "text-success",
  },
  rejected: {
    title: "Your proof needs more detail",
    desc: "Your submission didn't fully meet the proof requirements. Review the notes below to understand what was missing.",
    borderColor: "border-danger/20 bg-danger/5",
    Icon: XCircle,
    iconColor: "text-danger",
  },
  needs_manual_review: {
    title: "Manual Review Required",
    desc: "Your proof has been flagged for review by the event organiser. Check back soon.",
    borderColor: "border-warning/20 bg-warning/5",
    Icon: Clock,
    iconColor: "text-warning",
  },
  pending: {
    title: "Submitted for Review",
    desc: "Your proof has been submitted. Run the AI verification to get your result.",
    borderColor: "border-border bg-card",
    Icon: Clock,
    iconColor: "text-muted",
  },
};

export default function ReviewResultCard({ submission, onRefresh }: Props) {
  const router = useRouter();
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const display = VERDICT_DISPLAY[submission.status] || VERDICT_DISPLAY.pending;
  const { Icon } = display;

  // Badge already issued when badge_id is a non-empty string
  const badgeAlreadyIssued = !!submission.badge_id && submission.badge_id !== "";

  async function handleTriggerReview() {
    setLoading(true);
    setError("");
    try {
      await reviewSubmission(submission.submission_id);
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleIssueBadge() {
    setLoading(true);
    setError("");
    try {
      await issueBadge(submission.submission_id);
      onRefresh();
      if (address) router.push(`/profile/${toChecksum(address)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`rounded-xl border p-6 space-y-5 ${display.borderColor}`}>
      <div className="flex items-start gap-4">
        <Icon className={`h-6 w-6 shrink-0 mt-0.5 ${display.iconColor}`} />
        <div>
          <h2 className="font-semibold text-gp-text">{display.title}</h2>
          <p className="text-sm text-muted mt-0.5">{display.desc}</p>
        </div>
      </div>

      {submission.status !== "pending" && (
        <>
          <ScoreMeter score={submission.score} />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Badge Level:</span>
            <BadgeLevelTag level={submission.badge_level} />
          </div>

          {submission.verification_summary && (
            <div className="rounded-lg bg-background/50 px-4 py-3 border border-border">
              <p className="text-sm text-gp-text">{submission.verification_summary}</p>
            </div>
          )}

          {submission.reasons && submission.reasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted uppercase tracking-wider">
                Review Notes
              </p>
              <ul className="space-y-1">
                {submission.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gp-text">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <RiskFlagList flags={submission.risk_flags} />
        </>
      )}

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="pt-1 space-y-2">
        {/* Pending: trigger review */}
        {submission.status === "pending" && (
          <button
            onClick={handleTriggerReview}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {loading ? "Running verification…" : "Run Verification"}
          </button>
        )}

        {/* Approved + badge not yet issued */}
        {submission.status === "approved" && !badgeAlreadyIssued && (
          <button
            onClick={handleIssueBadge}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3 text-sm font-semibold text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            {loading ? "Issuing badge…" : "Claim Your Badge"}
          </button>
        )}

        {/* Badge already issued */}
        {submission.status === "approved" && badgeAlreadyIssued && (
          <div className="flex items-center justify-between rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <div className="flex items-center gap-2 text-success text-sm font-medium">
              <CheckCircle className="h-4 w-4" />
              <span>Badge issued — {submission.badge_id}</span>
            </div>
            {address && (
              <button
                onClick={() => router.push(`/profile/${toChecksum(address)}`)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View on profile
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
