import { scoreToGrade } from "@/lib/utils/format";

type Props = {
  score: number;
};

function barColor(score: number) {
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-secondary";
  if (score >= 40) return "bg-warning";
  return "bg-danger";
}

export default function ScoreMeter({ score }: Props) {
  const color = barColor(score);
  const grade = scoreToGrade(score);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">Verification Score</span>
        <span className="font-bold text-gp-text">
          {score}
          <span className="ml-1 text-xs text-muted">/ 100</span>
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
      <p className={`text-xs ${color.replace("bg-", "text-")}`}>{grade}</p>
    </div>
  );
}
