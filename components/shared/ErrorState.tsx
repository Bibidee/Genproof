import { AlertTriangle } from "lucide-react";

type Props = {
  message?: string;
  retry?: () => void;
};

export default function ErrorState({
  message = "Something went wrong.",
  retry,
}: Props) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-danger/20 bg-danger/5 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-danger" strokeWidth={1.5} />
      <p className="font-medium text-danger">Error</p>
      <p className="text-sm text-muted">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-2 rounded-lg border border-border px-4 py-2 text-sm text-muted hover:text-gp-text transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
