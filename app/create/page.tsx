"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/context/WalletContext";
import { createEvent } from "@/lib/genlayer/writes";
import { validateEventForm } from "@/lib/utils/validation";
import { dateInputToUnix } from "@/lib/utils/format";
import { LIMITS } from "@/lib/utils/constants";
import Link from "next/link";

/** Compute "0x" + sha256(text) — matches sha256_text() in the GenProofRegistry contract */
async function sha256Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await window.crypto.subtle.digest("SHA-256", enc);
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return "0x" + hex;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { address, connect } = useWallet();

  const [form, setForm] = useState({
    title: "",
    description: "",
    event_type: "workshop",
    start_date: "",
    end_date: "",
    claim_deadline: "",
    badge_name: "",
    badge_image: "",
    proof_question: "",
    event_secret: "",
    verification_strictness: "standard",
    max_claims: 500,
    soulbound: true,
    is_public: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateEventForm(form as unknown as Record<string, unknown>);
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      // Hash matches sha256_text() in the contract: "0x" + sha256(plaintext)
      const secretHash = form.event_secret ? await sha256Hex(form.event_secret) : "";

      const eventId = await createEvent({
        title: form.title.trim(),
        description: form.description.trim(),
        event_type: form.event_type,
        // Contract expects Unix timestamp strings, not "yyyy-mm-dd"
        start_date: dateInputToUnix(form.start_date),
        end_date: dateInputToUnix(form.end_date),
        claim_deadline: dateInputToUnix(form.claim_deadline),
        badge_name: form.badge_name.trim(),
        badge_image: form.badge_image.trim(),
        proof_question: form.proof_question.trim(),
        event_secret_hash: secretHash,
        verification_strictness: form.verification_strictness,
        max_claims: Number(form.max_claims),
        soulbound: form.soulbound,
        is_public: form.is_public,
      });

      router.push(`/event/${eventId}`);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setSubmitting(false);
    }
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gp-text">Create an Event</h1>
        <p className="text-muted">Connect your wallet to create a GenProof event.</p>
        <button
          onClick={connect}
          className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link href="/events" className="text-sm text-muted hover:text-gp-text">
          ← Back to Events
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gp-text">Create Event</h1>
        <p className="mt-1 text-sm text-muted">
          Set up your event and proof requirements. Attendees will need to submit proof to earn a badge.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-4 space-y-1">
            {errors.map((e, i) => (
              <p key={i} className="text-sm text-danger">{e}</p>
            ))}
          </div>
        )}

        {/* Event details */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-gp-text">Event Details</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gp-text">
              Event Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. GenLayer Intelligent Contracts Workshop"
              maxLength={LIMITS.TITLE}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gp-text">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What is this event about?"
              maxLength={LIMITS.DESCRIPTION}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none resize-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">Event Type</label>
              {/* Values must exactly match VALID_EVENT_TYPES in the deployed contract */}
              <select
                value={form.event_type}
                onChange={(e) => set("event_type", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
              >
                <option value="workshop">Workshop</option>
                <option value="hackathon">Hackathon</option>
                <option value="course_session">Course / Session</option>
                <option value="community_call">Community Call</option>
                <option value="conference">Conference</option>
                <option value="online_event">Online Event</option>
                <option value="physical_event">In-Person Event</option>
                <option value="private_event">Private Event</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">Max Claims</label>
              <input
                type="number"
                min={0}
                max={100000}
                value={form.max_claims}
                onChange={(e) => set("max_claims", Number(e.target.value))}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-muted">0 means unlimited</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">
                Start Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">
                End Date <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => set("end_date", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">
                Claim Deadline <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.claim_deadline}
                onChange={(e) => set("claim_deadline", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
                required
              />
            </div>
          </div>
        </section>

        {/* Badge settings */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-gp-text">Badge Settings</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">
                Badge Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={form.badge_name}
                onChange={(e) => set("badge_name", e.target.value)}
                placeholder="e.g. Verified Workshop Participant"
                maxLength={LIMITS.BADGE_NAME}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">Badge Image URL (optional)</label>
              <input
                type="url"
                value={form.badge_image}
                onChange={(e) => set("badge_image", e.target.value)}
                placeholder="https://…"
                maxLength={LIMITS.BADGE_IMAGE}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.soulbound}
                onChange={(e) => set("soulbound", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-gp-text">Soulbound (non-transferable)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => set("is_public", e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm text-gp-text">Public event</span>
            </label>
          </div>
        </section>

        {/* Proof requirements */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-gp-text">Proof Requirements</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gp-text">
              Proof Question <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.proof_question}
              onChange={(e) => set("proof_question", e.target.value)}
              rows={2}
              placeholder="e.g. What is one thing you learnt about intelligent contracts?"
              maxLength={LIMITS.PROOF_QUESTION}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none resize-none"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">Event Code (optional)</label>
              <input
                type="text"
                value={form.event_secret}
                onChange={(e) => set("event_secret", e.target.value.toUpperCase())}
                placeholder="e.g. GENPROOF2026"
                maxLength={LIMITS.EVENT_CODE}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text placeholder-muted focus:border-primary focus:outline-none font-mono tracking-widest"
              />
              <p className="text-xs text-muted">
                Share with attendees during the event only. Stored as a hash — never exposed publicly.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gp-text">Verification Strictness</label>
              <select
                value={form.verification_strictness}
                onChange={(e) => set("verification_strictness", e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-gp-text focus:border-primary focus:outline-none"
              >
                <option value="light">Light — Brief genuine response</option>
                <option value="standard">Standard — Show understanding</option>
                <option value="strict">Strict — Detailed specific proof</option>
              </select>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {submitting ? "Creating event on GenLayer…" : "Create Event"}
        </button>
      </form>
    </div>
  );
}
