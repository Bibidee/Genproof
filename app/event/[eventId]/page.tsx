"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, Users, CheckCircle2 } from "lucide-react";
import { getEvent, getEventBadges, getBadge } from "@/lib/genlayer/reads";
import type { GenProofEvent } from "@/lib/types/event";
import type { Badge } from "@/lib/types/badge";
import ClaimForm from "@/components/events/ClaimForm";
import ProofRequirementBox from "@/components/events/ProofRequirementBox";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import BadgeLevelTag from "@/components/badges/BadgeLevelTag";
import { formatDate, shortenAddress } from "@/lib/utils/format";
import { EVENT_TYPE_LABELS } from "@/lib/utils/constants";

export default function EventPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<GenProofEvent | null>(null);
  const [badgeHolders, setBadgeHolders] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const e = await getEvent(eventId);
        setEvent(e);
        // Load issued badge holders for this event
        try {
          const ids = await getEventBadges(eventId);
          const badges = await Promise.all(ids.map((id) => getBadge(id).catch(() => null)));
          setBadgeHolders(badges.filter(Boolean) as Badge[]);
        } catch {
          // Older events may not have an event_badges entry — ignore
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  if (loading)
    return <div className="mx-auto max-w-3xl px-4 py-16"><LoadingState message="Loading event…" /></div>;
  if (error || !event)
    return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorState message={error || "Event not found"} /></div>;

  const isOpen = event.status === "open";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
      <Link href="/events" className="text-sm text-muted hover:text-gp-text">
        ← Back to Events
      </Link>

      {/* Event header */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
            {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              isOpen ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
            }`}
          >
            {isOpen ? "Open for Claims" : "Closed"}
          </span>
          {event.soulbound && (
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs text-secondary">
              Soulbound Credential
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gp-text">{event.title}</h1>
        <p className="text-muted">{event.description}</p>

        <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-3 text-sm">
          <div>
            <p className="text-xs text-muted">Event Dates</p>
            <p className="text-gp-text">
              {formatDate(event.start_date)} — {formatDate(event.end_date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted">Claim Deadline</p>
            <p className="text-gp-text">{formatDate(event.claim_deadline)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">Badge</p>
            <p className="text-gp-text">{event.badge_name}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted border-t border-border pt-4">
          <span>{event.total_submissions} submitted</span>
          <span className="text-success">{event.total_approved} approved</span>
          <span className="text-danger">{event.total_rejected} rejected</span>
          {event.total_manual_review > 0 && (
            <span className="text-warning">{event.total_manual_review} under review</span>
          )}
          <span>Organiser: <code className="font-mono text-xs">{shortenAddress(event.organiser)}</code></span>
        </div>
      </div>

      {/* Proof requirement */}
      <ProofRequirementBox
        question={event.proof_question}
        strictness={event.verification_strictness}
      />

      {/* Claim form */}
      {isOpen ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gp-text">Submit Your Proof</h2>
          <ClaimForm event={event} />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center text-muted text-sm">
          This event is closed. No more proof submissions are accepted.
        </div>
      )}

      {/* Issued badge holders */}
      {badgeHolders.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted" />
            <h2 className="font-semibold text-gp-text">
              Verified Attendees ({badgeHolders.length})
            </h2>
          </div>
          <p className="text-xs text-muted">
            Public list of wallets who earned a GenProof credential for this event.
          </p>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {badgeHolders.map((b) => (
              <div key={b.badge_id} className="flex items-center justify-between p-4 gap-3">
                <div className="min-w-0 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Award className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/profile/${b.owner}`}
                      className="text-sm font-mono text-gp-text hover:text-primary truncate block transition-colors"
                    >
                      {shortenAddress(b.owner)}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      <span>Score {b.verification_score}/100</span>
                    </div>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-3">
                  <BadgeLevelTag level={b.badge_level} />
                  <Link href={`/badge/${b.badge_id}`} className="text-xs text-primary hover:underline">
                    Verify
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
