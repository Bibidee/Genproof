"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSubmission } from "@/lib/genlayer/reads";
import type { Submission } from "@/lib/types/submission";
import ReviewResultCard from "@/components/submissions/ReviewResultCard";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import Link from "next/link";
import { formatChainTimestamp, pickChainDate } from "@/lib/utils/format";

export default function ReviewPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const s = await getSubmission(submissionId);
      setSubmission(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <LoadingState message="Loading submission…" />
      </div>
    );
  if (error || !submission)
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorState message={error || "Submission not found"} />
      </div>
    );

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      <Link href="/events" className="text-sm text-muted hover:text-gp-text">
        ← Back to Events
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-gp-text">Proof Review</h1>
        <p className="mt-1 text-sm text-muted">
          Submitted {formatChainTimestamp(pickChainDate(submission.submitted_at_iso, submission.submitted_at))}
        </p>
      </div>

      {/* Verification result card */}
      <ReviewResultCard submission={submission} onRefresh={load} />

      {/* Submitted proof — visible to attendee only (this is their own submission page) */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="font-semibold text-gp-text">Your Submitted Proof</h3>

        <div>
          <p className="text-xs text-muted mb-1 uppercase tracking-wider">Reflection</p>
          <p className="text-sm text-gp-text">{submission.reflection}</p>
        </div>

        {submission.quiz_answers?.some((a) => a) && (
          <div>
            <p className="text-xs text-muted mb-1 uppercase tracking-wider">Quiz Answers</p>
            {submission.quiz_answers.filter(Boolean).map((a, i) => (
              <p key={i} className="text-sm text-gp-text">
                {i + 1}. {a}
              </p>
            ))}
          </div>
        )}

        {submission.proof_link && (
          <div>
            <p className="text-xs text-muted mb-1 uppercase tracking-wider">Proof Link</p>
            <a
              href={submission.proof_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-secondary hover:underline break-all"
            >
              {submission.proof_link}
            </a>
          </div>
        )}

        {submission.project_link && (
          <div>
            <p className="text-xs text-muted mb-1 uppercase tracking-wider">Project Link</p>
            <a
              href={submission.project_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-secondary hover:underline break-all"
            >
              {submission.project_link}
            </a>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
          <span>ID: {submission.submission_id}</span>
          <span title={submission.proof_hash}>
            Hash: {submission.proof_hash.slice(0, 14)}…
          </span>
        </div>
      </div>
    </div>
  );
}
