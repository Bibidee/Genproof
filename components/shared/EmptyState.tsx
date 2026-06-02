import { Inbox } from "lucide-react";

type Props = {
  title?: string;
  message?: string;
  action?: React.ReactNode;
};

export default function EmptyState({
  title = "Nothing here yet",
  message,
  action,
}: Props) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
      <Inbox className="h-8 w-8 text-muted" strokeWidth={1.5} />
      <p className="font-medium text-gp-text">{title}</p>
      {message && <p className="text-sm text-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
