import { STATUS_COLORS, STATUS_LABELS } from "@/lib/utils/constants";

type Props = {
  status: string;
};

export default function StatusBadge({ status }: Props) {
  const color = STATUS_COLORS[status] || "bg-muted/20 text-muted";
  const label = STATUS_LABELS[status] || status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
