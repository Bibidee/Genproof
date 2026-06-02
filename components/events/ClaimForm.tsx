"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/context/WalletContext";
import { submitProof } from "@/lib/genlayer/writes";
import { validateProofForm } from "@/lib/utils/validation";
import { LIMITS } from "@/lib/utils/constants";
import type { GenProofEvent } from "@/lib/types/event";

type Props = {
  event: GenProofEvent;
};

export default function ClaimForm({ event }: Props) {
  const router = useRouter();
  const { address, connect } = useWallet();

  const [form, setForm] = useState({
    reflection: "",
    quiz_answer_1: "",
    quiz_answer_2: "",
    event_code: "",
    proof_link: "",
    project_link: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const hasEventCode = event.event_secret_hash && event.event_secret_hash !== "";

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateProofForm({ reflection: form.reflection });
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    // If the event requires a code, enforce it client-side
    if (hasEventCode && !form.event_code.trim()) {
      setErrors(["This event requires an event code. Enter the code you received from the organiser."]);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const submissionId = await submitProof({
        event_id: event.event_id,
        reflection: form.reflection,
        quiz_answer_1: form.quiz_answer_1,
        quiz_answer_2: form.quiz_answer_2,
        event_code: form.event_code,
        proof_link: form.proof_link,
        project_link: form.project_link,
      });
      router.push(`/review/${submissionId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrors([msg]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!address) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <p className="text-gp-text font-medium">Connect your wallet to submit proof</p>
        <button
          onClick={connect}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.length > 0 && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-danger">{e}</p>
          ))}
        </div>
      )}

      {/* Reflection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gp-text">
          Your Reflection <span className="text-danger">*</span>
        </label>
        <p className="text-xs text-muted">
          Answer the proof question above in your own words. Be specific — generic answers will not be approved.
        </p>
        <textarea
          value={form.reflection}
          onChange={(e) => set("reflection", e.target.value)}
          rows={5}
          placeholder="Share what you learnt, observed, or contributed at this event…"
          minLength={LIMITS.REFLECTION_MIN}
          maxLength={LIMITS.REFLECTION_MAX}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none resize-none"
          required
        />
        <p className="text-xs text-muted text-right">
          {form.reflection.length} / {LIMITS.REFLECTION_MAX} characters
        </p>
      </div>

      {/* Quiz answers */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gp-text">Quiz Answer 1 (optional)</label>
          <input
            type="text"
            value={form.quiz_answer_1}
            onChange={(e) => set("quiz_answer_1", e.target.value)}
            placeholder="First quiz answer"
            maxLength={LIMITS.QUIZ_ANSWER}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gp-text">Quiz Answer 2 (optional)</label>
          <input
            type="text"
            value={form.quiz_answer_2}
            onChange={(e) => set("quiz_answer_2", e.target.value)}
            placeholder="Second quiz answer"
            maxLength={LIMITS.QUIZ_ANSWER}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Event code — required only when event has event_secret_hash set */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gp-text">
          Event Code{hasEventCode ? <span className="text-danger"> *</span> : " (optional)"}
        </label>
        <input
          type="text"
          value={form.event_code}
          onChange={(e) => set("event_code", e.target.value.toUpperCase())}
          placeholder={hasEventCode ? "Required — enter the code from the organiser" : "e.g. GENPROOF2026"}
          maxLength={LIMITS.EVENT_CODE}
          className={`w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none font-mono tracking-widest ${
            hasEventCode ? "border-primary/30" : "border-border"
          }`}
        />
        {hasEventCode && (
          <p className="text-xs text-primary">
            This event requires a code. Ask the organiser for it.
          </p>
        )}
      </div>

      {/* Optional links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gp-text">Proof Link (optional)</label>
          <input
            type="url"
            value={form.proof_link}
            onChange={(e) => set("proof_link", e.target.value)}
            placeholder="https://screenshot or social post"
            maxLength={LIMITS.LINK}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gp-text">Project Link (optional)</label>
          <input
            type="url"
            value={form.project_link}
            onChange={(e) => set("project_link", e.target.value)}
            placeholder="https://your project or demo"
            maxLength={LIMITS.LINK}
            className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Submitting proof…" : "Submit Proof"}
      </button>

      <p className="text-center text-xs text-muted">
        Your proof will be reviewed by GenLayer&apos;s intelligent contract. This badge proves meaningful participation.
      </p>
    </form>
  );
}
