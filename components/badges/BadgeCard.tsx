import Link from "next/link";
import { Award, ShieldCheck, ExternalLink } from "lucide-react";
import type { Badge } from "@/lib/types/badge";
import { formatChainDate } from "@/lib/utils/format";
import BadgeLevelTag from "./BadgeLevelTag";
import ScoreMeter from "@/components/shared/ScoreMeter";

type Props = {
  badge: Badge;
};

export default function BadgeCard({ badge }: Props) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Award className="h-7 w-7 text-primary" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gp-text">{badge.badge_name}</h3>
            {badge.soulbound && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary">
                Soulbound
              </span>
            )}
          </div>
          <div className="mt-1">
            <BadgeLevelTag level={badge.badge_level} />
          </div>
        </div>
      </div>

      <ScoreMeter score={badge.verification_score} />

      {badge.verification_summary && (
        <p className="text-sm text-muted italic">{badge.verification_summary}</p>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted">
        <span>Issued {formatChainDate(badge.issued_at)}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-success">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Verified</span>
          </div>
          <Link
            href={`/badge/${badge.badge_id}`}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            Public link
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
