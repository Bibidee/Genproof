import { BADGE_LEVEL_COLORS, BADGE_LEVEL_LABELS } from "@/lib/utils/constants";

type Props = {
  level: string;
};

export default function BadgeLevelTag({ level }: Props) {
  const color = BADGE_LEVEL_COLORS[level] || "bg-muted/20 text-muted";
  const label = BADGE_LEVEL_LABELS[level] || level;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}
