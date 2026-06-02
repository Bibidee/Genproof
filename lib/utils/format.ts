export function shortenAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert a `<input type="date">` value ("2026-06-15") to a Unix timestamp string.
 * The contract stores start_date / end_date / claim_deadline as Unix timestamps
 * (seconds, as decimal strings).
 */
export function dateInputToUnix(dateStr: string): string {
  if (!dateStr) return "";
  // Treat the date as UTC midnight to keep it timezone-stable
  const d = new Date(dateStr + "T00:00:00Z");
  if (isNaN(d.getTime())) return "";
  return Math.floor(d.getTime() / 1000).toString();
}

/**
 * Convert a date+time picker (e.g. "2026-06-15T12:30") to a Unix timestamp string.
 */
export function dateTimeInputToUnix(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return Math.floor(d.getTime() / 1000).toString();
}

/**
 * Convert a Unix timestamp string back to "yyyy-mm-dd" for use in a `<input type="date">`.
 */
export function unixToDateInput(ts: string): string {
  if (!ts) return "";
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return "";
  const d = new Date(n * 1000);
  return d.toISOString().slice(0, 10);
}

/**
 * Format any timestamp-ish input (Unix string, Unix int, or ISO string) for display.
 * Returns "—" for empty/invalid.
 */
export function formatDate(input: string | number | undefined | null): string {
  if (input === undefined || input === null || input === "") return "—";
  let d: Date;
  if (typeof input === "number") {
    d = new Date(input * 1000);
  } else {
    const n = Number(input);
    if (Number.isFinite(n) && n > 0 && /^\d+$/.test(input.trim())) {
      d = new Date(n * 1000);
    } else {
      d = new Date(input);
    }
  }
  if (isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTimestamp(ts: string | number | undefined | null): string {
  if (ts === undefined || ts === null || ts === "") return "—";
  let d: Date;
  if (typeof ts === "number") {
    d = new Date(ts * 1000);
  } else {
    const n = Number(ts);
    if (Number.isFinite(n) && n > 0 && /^\d+$/.test(ts.trim())) {
      d = new Date(n * 1000);
    } else {
      d = new Date(ts);
    }
  }
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function scoreToGrade(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Weak";
  return "Insufficient";
}

export function riskFlagLabel(flag: string): string {
  const labels: Record<string, string> = {
    generic_response: "Generic response",
    copied_response: "Possibly copied",
    event_mismatch: "Doesn't match event",
    low_effort: "Low effort",
    wrong_quiz_answer: "Incorrect quiz answer",
    irrelevant_proof: "Irrelevant proof",
    unsupported_claim: "Unsupported claim",
    possible_farming: "Farming risk",
    weak_supporting_evidence: "Weak supporting evidence",
    parse_error: "Parse error",
  };
  return labels[flag] || flag;
}
