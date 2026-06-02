"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/lib/context/WalletContext";
import { getAllEvents, getEventSubmissions, getSubmission } from "@/lib/genlayer/reads";
import { closeEvent } from "@/lib/genlayer/writes";
import type { GenProofEvent } from "@/lib/types/event";
import type { Submission } from "@/lib/types/submission";
import ManualReviewPanel from "@/components/dashboard/ManualReviewPanel";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingState from "@/components/shared/LoadingState";
import EmptyState from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils/format";
import Link from "next/link";

export default function DashboardPage() {
  const { address, connect } = useWallet();
  const [events, setEvents] = useState<GenProofEvent[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    try {
      const all = await getAllEvents();
      // Filter to events created by this wallet (case-insensitive)
      const mine = all.filter(
        (e) => e.organiser.toLowerCase() === address.toLowerCase()
      );
      setEvents(mine);

      // Fetch all submissions for each organiser event
      const subMap: Record<string, Submission[]> = {};
      await Promise.all(
        mine.map(async (event) => {
          try {
            const ids = await getEventSubmissions(event.event_id);
            const subs = await Promise.all(
              ids.map((id: string) =>
                getSubmission(id).catch(() => null)
              )
            );
            subMap[event.event_id] = subs.filter(Boolean) as Submission[];
          } catch {
            subMap[event.event_id] = [];
          }
        })
      );
      setSubmissions(subMap);

      if (mine.length > 0) {
        setSelectedEventId((prev) => prev || mine[0].event_id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCloseEvent(eventId: string) {
    setClosingId(eventId);
    try {
      await closeEvent(eventId);
      await loadData();
    } finally {
      setClosingId(null);
    }
  }

  if (!address) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gp-text">Organiser Dashboard</h1>
        <p className="text-muted">Connect your wallet to view your events and manage submissions.</p>
        <button
          onClick={connect}
          className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading)
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <LoadingState message="Loading your events…" />
      </div>
    );

  const selectedEvent = events.find((e) => e.event_id === selectedEventId);
  const selectedSubs = selectedEventId ? (submissions[selectedEventId] || []) : [];

  const statusCounts = selectedSubs.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gp-text">Organiser Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            {events.length} event{events.length !== 1 ? "s" : ""} created by your wallet
          </p>
        </div>
        <Link
          href="/create"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          + New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          message="Create your first GenProof event and start collecting verified attendance proof."
          action={
            <Link href="/create" className="text-sm text-primary hover:underline">
              Create Event
            </Link>
          }
        />
      ) : (
        <div className="grid gap-8 md:grid-cols-3">
          {/* Event sidebar */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-muted uppercase tracking-wider px-1">
              Your Events
            </h2>
            {events.map((event) => (
              <button
                key={event.event_id}
                onClick={() => setSelectedEventId(event.event_id)}
                className={`w-full rounded-xl border p-3 text-left transition-colors ${
                  selectedEventId === event.event_id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <p className="text-sm font-medium text-gp-text truncate">{event.title}</p>
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className={event.status === "open" ? "text-success" : "text-muted"}>
                    {event.status}
                  </span>
                  <span className="text-muted">·</span>
                  <span className="text-muted">{event.total_submissions} submissions</span>
                </div>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div className="md:col-span-2 space-y-6">
            {selectedEvent ? (
              <>
                {/* Stats card */}
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gp-text truncate">{selectedEvent.title}</h3>
                      <p className="text-xs text-muted mt-0.5">
                        Deadline: {formatDate(selectedEvent.claim_deadline)}
                      </p>
                    </div>
                    {selectedEvent.status === "open" && (
                      <button
                        onClick={() => handleCloseEvent(selectedEvent.event_id)}
                        disabled={closingId === selectedEvent.event_id}
                        className="shrink-0 rounded-lg border border-danger/30 px-3 py-1.5 text-xs text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
                      >
                        {closingId === selectedEvent.event_id ? "Closing…" : "Close Event"}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Total", value: selectedSubs.length, color: "text-gp-text" },
                      { label: "Approved", value: statusCounts.approved || 0, color: "text-success" },
                      { label: "Rejected", value: statusCounts.rejected || 0, color: "text-danger" },
                      {
                        label: "Manual",
                        value: statusCounts.needs_manual_review || 0,
                        color: "text-warning",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-lg bg-background p-3 text-center">
                        <p className={`text-lg font-bold ${color}`}>{value}</p>
                        <p className="text-xs text-muted">{label}</p>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/event/${selectedEvent.event_id}`}
                    className="block text-center rounded-lg border border-border py-2 text-xs text-muted hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    View public event page →
                  </Link>
                </div>

                {/* All submissions */}
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-gp-text">All Submissions</h3>
                    <span className="text-xs text-muted">{selectedSubs.length} total</span>
                  </div>
                  {selectedSubs.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted">
                      No submissions yet for this event.
                    </div>
                  ) : (
                    <div className="divide-y divide-border max-h-96 overflow-y-auto">
                      {selectedSubs.map((sub) => (
                        <div
                          key={sub.submission_id}
                          className="flex items-center justify-between p-4 gap-4 hover:bg-background/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-mono text-muted truncate">
                              {sub.attendee.slice(0, 20)}…
                            </p>
                            <p className="text-xs text-muted mt-0.5">
                              Score: {sub.score} · {sub.badge_level}
                              {sub.badge_id ? " · Badge issued" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <StatusBadge status={sub.status} />
                            <Link
                              href={`/review/${sub.submission_id}`}
                              className="text-xs text-primary hover:underline"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual review queue */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gp-text">Manual Review Queue</h3>
                    {(statusCounts.needs_manual_review || 0) > 0 && (
                      <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs text-warning">
                        {statusCounts.needs_manual_review}
                      </span>
                    )}
                  </div>
                  <ManualReviewPanel
                    submissions={selectedSubs}
                    onRefresh={loadData}
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-muted text-sm py-12">
                Select an event from the left.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
