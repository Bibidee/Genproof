type Props = {
  message?: string;
};

export default function LoadingState({ message = "Loading…" }: Props) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-muted">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
