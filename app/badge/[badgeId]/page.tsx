"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Award, ShieldCheck, ExternalLink, Calendar, User as UserIcon } from "lucide-react";
import { getBadge, getEvent } from "@/lib/genlayer/reads";
import type { Badge } from "@/lib/types/badge";
import type { GenProofEvent } from "@/lib/types/event";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import ScoreMeter from "@/components/shared/ScoreMeter";
import BadgeLevelTag from "@/components/badges/BadgeLevelTag";
import { shortenAddress, formatTimestamp, formatDate } from "@/lib/utils/format";
import { toChecksum } from "@/lib/utils/address";
import { EVENT_TYPE_LABELS } from "@/lib/utils/constants";

/**
 * Public badge verification page — no wallet connection required.
 * Anyone can paste a badge ID and verify on-chain that the credential
 * exists, who it belongs to, and what event it was issued for.
 */
export default function PublicBadgePage() {
  const params = useParams();
  const badgeId = params.badgeId as string;

  const [badge, setBadge] = useState<Badge | null>(null);
  const [event, setEvent] = useState<GenProofEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const b = await getBadge(badgeId);
        setBadge(b);
        try {
          setEvent(await getEvent(b.event_id));
        } catch {
          // Event may have been removed; badge still verifies
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [badgeId]);

  if (loading)
    return <div className="mx-auto max-w-2xl px-4 py-16"><LoadingState message="Verifying credential on GenLayer…" /></div>;

  if (error || !badge)
    return <div className="mx-auto max-w-2xl px-4 py-16"><ErrorState message={error || "Badge not found"} /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      <Link href="/events" className="text-sm text-muted hover:text-gp-text">
        ← Back to Events
      </Link>

      {/* Verification banner */}
      <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center gap-3">
        <ShieldCheck className="h-6 w-6 text-success shrink-0" />
        <div>
          <p className="text-sm font-medium text-success">GenLayer Verified Credential</p>
          <p className="text-xs text-muted">
            This badge was issued after intelligent proof verification on chain.
          </p>
        </div>
      </div>

      {/* Badge card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-8 w-8 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gp-text">{badge.badge_name}</h1>
              {badge.soulbound && (
                <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                  Soulbound
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <BadgeLevelTag level={badge.badge_level} />
              <span className="text-xs text-muted">Badge ID: {badge.badge_id}</span>
            </div>
          </div>
        </div>

        <ScoreMeter score={badge.verification_score} />

        {badge.verification_summary && (
          <div className="rounded-lg bg-background/50 border border-border px-4 py-3">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">Verification Summary</p>
            <p className="text-sm text-gp-text">{badge.verification_summary}</p>
          </div>
        )}
      </div>

      {/* Owner card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-gp-text flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-muted" /> Credential Owner
        </h3>
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono text-gp-text break-all">{badge.owner}</code>
          <Link
            href={`/profile/${toChecksum(badge.owner)}`}
            className="shrink-0 ml-3 flex items-center gap-1 text-xs text-primary hover:underline"
          >
            View profile <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* Event card */}
      {event && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-gp-text flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted" /> Issued For
          </h3>
          <div>
            <Link
              href={`/event/${event.event_id}`}
              className="text-base font-medium text-gp-text hover:text-primary transition-colors"
            >
              {event.title}
            </Link>
            <p className="mt-1 text-sm text-muted line-clamp-2">{event.description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted pt-2 border-t border-border">
            <div>
              <span className="block">Event type</span>
              <span className="text-gp-text">{EVENT_TYPE_LABELS[event.event_type] || event.event_type}</span>
            </div>
            <div>
              <span className="block">Event date</span>
              <span className="text-gp-text">{formatDate(event.start_date)}</span>
            </div>
            <div>
              <span className="block">Organiser</span>
              <span className="font-mono text-gp-text">{shortenAddress(event.organiser)}</span>
            </div>
            <div>
              <span className="block">Issued</span>
              <span className="text-gp-text">{formatTimestamp(badge.issued_at)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Proof hash */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-2">
        <p className="text-xs text-muted uppercase tracking-wider">Proof Hash</p>
        <code
          className="block text-xs font-mono text-muted break-all"
          title="SHA-256 of the canonical submitted proof"
        >
          {badge.proof_hash}
        </code>
        <p className="text-xs text-muted pt-2 border-t border-border">
          This badge is part of a public on-chain registry on GenLayer Studionet. Anyone can verify it by reading
          this contract.
        </p>
      </div>
    </div>
  );
}
