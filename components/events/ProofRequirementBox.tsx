import { ClipboardList } from "lucide-react";

type Props = {
  question: string;
  strictness: string;
};

const strictnessInfo: Record<string, { label: string; desc: string; color: string }> = {
  light: {
    label: "Light",
    desc: "A brief, genuine response is enough.",
    color: "text-success",
  },
  standard: {
    label: "Standard",
    desc: "Show that you understood the key topics.",
    color: "text-warning",
  },
  strict: {
    label: "Strict",
    desc: "Detailed, specific proof required.",
    color: "text-danger",
  },
};

export default function ProofRequirementBox({ question, strictness }: Props) {
  const info = strictnessInfo[strictness] || strictnessInfo.standard;
  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-primary" strokeWidth={1.5} />
        <h3 className="font-semibold text-gp-text">Proof Requirement</h3>
      </div>
      <p className="text-sm text-gp-text">{question}</p>
      <div className="flex items-center gap-2 pt-1 border-t border-border flex-wrap">
        <span className="text-xs text-muted">Strictness:</span>
        <span className={`text-xs font-medium ${info.color}`}>{info.label}</span>
        <span className="text-xs text-muted">—</span>
        <span className="text-xs text-muted">{info.desc}</span>
      </div>
    </div>
  );
}
