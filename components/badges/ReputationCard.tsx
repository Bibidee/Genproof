import { User, TrendingUp } from "lucide-react";
import type { UserProfile } from "@/lib/types/profile";
import { REPUTATION_LEVELS } from "@/lib/utils/constants";
import { shortenAddress } from "@/lib/utils/format";

type Props = {
  profile: UserProfile;
};

const LEVEL_INDEX = REPUTATION_LEVELS.reduce<Record<string, number>>((acc, lvl, i) => {
  acc[lvl] = i;
  return acc;
}, {});

export default function ReputationCard({ profile }: Props) {
  const levelIdx = LEVEL_INDEX[profile.reputation_level] ?? 0;
  const progress = Math.round(((levelIdx + 1) / REPUTATION_LEVELS.length) * 100);

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <User className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <p className="font-semibold text-gp-text">{shortenAddress(profile.wallet)}</p>
          <p className="text-sm text-primary">{profile.reputation_level}</p>
        </div>
      </div>

      {/* Reputation progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>Reputation</span>
          </div>
          <span>{profile.reputation_points} pts</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>{REPUTATION_LEVELS[0]}</span>
          <span>{REPUTATION_LEVELS[REPUTATION_LEVELS.length - 1]}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Badges", value: profile.total_badges },
          { label: "Events", value: profile.events_attended },
          { label: "Avg Score", value: profile.average_score },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-background p-3 text-center">
            <p className="text-lg font-bold text-gp-text">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Badge type breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {[
          { label: "Attendee", value: profile.attendee_badges, color: "text-secondary" },
          { label: "Participant", value: profile.participant_badges, color: "text-primary" },
          { label: "Contributor", value: profile.contributor_badges, color: "text-success" },
          { label: "Builder", value: profile.builder_badges, color: "text-warning" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex justify-between rounded-lg bg-background px-3 py-2 text-muted">
            <span>{label}</span>
            <span className={color}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
