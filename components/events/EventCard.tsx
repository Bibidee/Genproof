import Link from "next/link";
import type { GenProofEvent } from "@/lib/types/event";
import { formatDate } from "@/lib/utils/format";
import { EVENT_TYPE_LABELS } from "@/lib/utils/constants";

type Props = {
  event: GenProofEvent;
};

export default function EventCard({ event }: Props) {
  const isOpen = event.status === "open";
  return (
    <Link
      href={`/event/${event.event_id}`}
      className="group block rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                isOpen ? "bg-success/10 text-success" : "bg-muted/10 text-muted"
              }`}
            >
              {isOpen ? "Open" : "Closed"}
            </span>
          </div>
          <h3 className="font-semibold text-gp-text truncate group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="mt-1 text-sm text-muted line-clamp-2">{event.description}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="space-y-0.5">
          <p className="text-xs text-muted">Badge</p>
          <p className="text-xs font-medium text-gp-text">{event.badge_name}</p>
        </div>
        <div className="text-right space-y-0.5">
          <p className="text-xs text-muted">Claim deadline</p>
          <p className="text-xs text-gp-text">{formatDate(event.claim_deadline)}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-4 text-xs text-muted">
        <span>{event.total_submissions} submissions</span>
        <span>{event.total_approved} approved</span>
      </div>
    </Link>
  );
}
