import { ShieldAlert } from "lucide-react";
import { riskFlagLabel } from "@/lib/utils/format";

type Props = {
  flags: string[];
};

export default function RiskFlagList({ flags }: Props) {
  if (!flags || flags.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5 text-warning" />
        <p className="text-xs font-medium text-warning uppercase tracking-wider">Risk Flags</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {flags.map((flag) => (
          <span
            key={flag}
            className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs text-warning"
          >
            {riskFlagLabel(flag)}
          </span>
        ))}
      </div>
    </div>
  );
}
