"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Calendar, Award, Users, TrendingUp } from "lucide-react";
import {
  getPlatformOwner,
  getPlatformSummary,
  getAllEventIds,
  getAllBadgeIds,
  getAllUsers,
  getEvent,
  getBadge,
  getUserProfile,
  type PlatformSummary,
} from "@/lib/genlayer/reads";
import type { GenProofEvent } from "@/lib/types/event";
import type { Badge } from "@/lib/types/badge";
import type { UserProfile } from "@/lib/types/profile";
import { useWallet } from "@/lib/context/WalletContext";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import BadgeLevelTag from "@/components/badges/BadgeLevelTag";
import { shortenAddress, formatChainTimestamp } from "@/lib/utils/format";
import { toChecksum, isSameAddress } from "@/lib/utils/address";
import { EVENT_TYPE_LABELS } from "@/lib/utils/constants";

/**
 * Platform-owner-only dashboard. Visible only when the connected wallet
 * matches `get_platform_owner()`.
 */
export default function PlatformDashboardPage() {
  const { address, connect } = useWallet();
  const [owner, setOwner] = useState<string | null>(null);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [events, setEvents] = useState<GenProofEvent[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const platformOwner = await getPlatformOwner();
        setOwner(platformOwner);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    load();
  }, []);

  const isOwner = isSameAddress(address, owner);

  // Fetch the heavier data only once we know we're the platform owner
  useEffect(() => {
    if (!isOwner) return;
    let cancelled = false;
    async function loadAll() {
      try {
        const [sum, eventIds, badgeIds, userAddrs] = await Promise.all([
          getPlatformSummary(),
          getAllEventIds(),
          getAllBadgeIds(),
          getAllUsers(),
        ]);
        if (cancelled) return;
        setSummary(sum);

        const eventsData = await Promise.all(eventIds.map((id) => getEvent(id).catch(() => null)));
        const badgesData = await Promise.all(badgeIds.map((id) => getBadge(id).catch(() => null)));
        const usersData = await Promise.all(
          userAddrs.map((a) => getUserProfile(toChecksum(a)).catch(() => null))
        );

        if (cancelled) return;
        setEvents(eventsData.filter(Boolean) as GenProofEvent[]);
        setBadges(badgesData.filter(Boolean) as Badge[]);
        setUsers(usersData.filter(Boolean) as UserProfile[]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }
    loadAll();
    return () => {
      cancelled = true;
    };
  }, [isOwner]);

  // ── Render guards ────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <LoadingState message="Checking platform access…" />
      </div>
    );

  if (error)
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <ErrorState message={error} />
      </div>
    );

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <ShieldAlert className="h-10 w-10 text-warning mx-auto" />
        <h1 className="text-2xl font-bold text-gp-text">Platform Dashboard</h1>
        <p className="text-muted">Connect your wallet to access platform-owner controls.</p>
        <button
          onClick={connect}
          className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <ShieldAlert className="h-10 w-10 text-danger mx-auto" />
        <h1 className="text-2xl font-bold text-gp-text">Restricted Page</h1>
        <p className="text-muted">
          This dashboard is only visible to the GenProof platform owner.
        </p>
        <div className="rounded-xl border border-border bg-card p-4 text-left space-y-1 text-sm">
          <p className="text-muted">Connected wallet</p>
          <code className="block font-mono text-xs text-gp-text break-all">{address}</code>
          <p className="text-muted pt-2 border-t border-border mt-2">Platform owner</p>
          <code className="block font-mono text-xs text-gp-text break-all">{owner}</code>
        </div>
      </div>
    );
  }

  // ── Owner view ───────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gp-text">Platform Dashboard</h1>
        <p className="text-sm text-muted mt-0.5">
          Owner view — visible to <code className="font-mono">{shortenAddress(owner!)}</code>
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Events", value: summary?.total_events ?? 0, Icon: Calendar, color: "text-primary" },
          { label: "Submissions", value: summary?.total_submissions ?? 0, Icon: TrendingUp, color: "text-secondary" },
          { label: "Issued Badges", value: summary?.total_badges ?? 0, Icon: Award, color: "text-success" },
          { label: "Users", value: users.length, Icon: Users, color: "text-warning" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5 space-y-2">
            <Icon className={`h-5 w-5 ${color}`} strokeWidth={1.5} />
            <p className="text-2xl font-bold text-gp-text">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Events table */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gp-text">All Events</h2>
        {events.length === 0 ? (
          <EmptyState title="No events yet" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {events.map((e) => (
                <Link
                  key={e.event_id}
                  href={`/event/${e.event_id}`}
                  className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gp-text truncate">{e.title}</p>
                    <p className="text-xs text-muted mt-0.5 font-mono">
                      {e.event_id} · {EVENT_TYPE_LABELS[e.event_type] || e.event_type} · organiser {shortenAddress(e.organiser)}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3 text-xs text-muted">
                    <span>{e.total_submissions} subs</span>
                    <span className="text-success">{e.total_approved} ✓</span>
                    <StatusBadge status={e.status === "closed" ? "rejected" : "approved"} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Badges table */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gp-text">All Issued Badges</h2>
        {badges.length === 0 ? (
          <EmptyState title="No badges issued yet" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {badges.map((b) => (
                <div key={b.badge_id} className="flex items-center justify-between p-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gp-text truncate">{b.badge_name}</p>
                    <p className="text-xs text-muted mt-0.5 font-mono">
                      {b.badge_id} · owner {shortenAddress(b.owner)} · event {b.event_id}
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                    <BadgeLevelTag level={b.badge_level} />
                    <span className="text-xs text-muted">{b.verification_score}/100</span>
                    <Link
                      href={`/badge/${b.badge_id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Users table */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gp-text">Users with Badges</h2>
        {users.length === 0 ? (
          <EmptyState title="No users yet" />
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {users.map((u) => (
                <Link
                  key={u.wallet}
                  href={`/profile/${toChecksum(u.wallet)}`}
                  className="flex items-center justify-between p-4 hover:bg-background/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm text-gp-text">{shortenAddress(u.wallet)}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {u.reputation_level} · {u.total_badges} badges · avg {u.average_score}/100
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-primary">{u.reputation_points} pts</p>
                    {u.last_updated && (
                      <p className="text-xs text-muted">{formatChainTimestamp(u.last_updated)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
