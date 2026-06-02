"use client";

import { useEffect, useState } from "react";
import { getAllEvents } from "@/lib/genlayer/reads";
import type { GenProofEvent } from "@/lib/types/event";
import EventCard from "@/components/events/EventCard";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
import { EVENT_TYPE_LABELS } from "@/lib/utils/constants";

const EVENT_TYPES = ["all", ...Object.keys(EVENT_TYPE_LABELS)];

export default function EventsPage() {
  const [events, setEvents] = useState<GenProofEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const all = await getAllEvents();
      setEvents(all.filter((e) => e.is_public));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = events.filter((e) => {
    const typeMatch = filter === "all" || e.event_type === filter;
    const statusMatch = statusFilter === "all" || e.status === statusFilter;
    return typeMatch && statusMatch;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gp-text">Events</h1>
          <p className="text-sm text-muted mt-1">
            Browse events and submit proof to earn verified badges.
          </p>
        </div>
        <Link
          href="/create"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          + Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap gap-2">
          {["all", "open", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-white"
                  : "border border-border text-muted hover:text-gp-text"
              }`}
            >
              {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.slice(0, 6).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === t
                  ? "bg-secondary text-white"
                  : "border border-border text-muted hover:text-gp-text"
              }`}
            >
              {t === "all" ? "All Types" : EVENT_TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState message="Loading events from contract…" />
      ) : error ? (
        <ErrorState message={error} retry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No events found"
          message="No public events match your filters."
          action={
            <Link href="/create" className="text-sm text-primary hover:underline">
              Create the first one
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
