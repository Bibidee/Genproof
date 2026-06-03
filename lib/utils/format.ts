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
  const ms = normaliseTimestampToMs(ts);
  if (!ms) return "";
  const d = new Date(ms);
  return d.toISOString().slice(0, 10);
}

/**
 * Normalise ANY chain timestamp value (string OR number) to milliseconds since epoch.
 *
 * GenLayer's `gl.block.timestamp` returns an integer whose unit varies by runtime:
 * seconds (10 digits), milliseconds (13 digits), microseconds (16 digits), or
 * nanoseconds (19+ digits). Passing the raw string to `new Date()` is unsafe:
 * `new Date("0")` → "Jan 1 2000" because Date parses it as a year string, and
 * very large numeric strings overflow into bogus dates.
 *
 * Use this for issued_at, created_at, submitted_at, reviewed_at, closed_at,
 * start_date, end_date, claim_deadline — anything coming back from the contract.
 *
 * Returns 0 for empty, "0", or unparseable input.
 */
export function normaliseTimestampToMs(
  value: string | number | undefined | null
): number {
  if (value === undefined || value === null) return 0;

  const raw = String(value).trim();
  if (!raw || raw === "0") return 0;

  // ISO 8601 string — the new contract emits these as `*_iso` fields
  // (e.g. "2026-06-03T10:38:08.435770Z"). Try them first because Number()
  // would coerce them to NaN.
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const ms = new Date(raw).getTime();
    if (Number.isFinite(ms) && ms > 0) return ms;
  }

  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;

  // Unix seconds: 10 digits
  if (raw.length <= 10) return n * 1000;

  // Unix milliseconds: 13 digits
  if (raw.length <= 13) return n;

  // Microseconds: 16 digits
  if (raw.length <= 16) return Math.floor(n / 1000);

  // Nanoseconds or larger
  return Math.floor(n / 1_000_000);
}

/**
 * Prefer an ISO timestamp when present, fall back to the Unix variant.
 * The new contract emits both `<field>` (Unix seconds) and `<field>_iso`
 * (ISO 8601) for every chain-written time. Always pass ISO first.
 *
 * Use Unix variants for sorting/comparison; use ISO variants for display.
 */
export function pickChainDate(
  iso: string | undefined | null,
  unix: string | number | undefined | null
): string | number | undefined | null {
  if (typeof iso === "string" && iso.trim() && iso.trim() !== "0") return iso;
  return unix;
}

/**
 * Format a USER-SUPPLIED date (event start/end/claim_deadline) — these come
 * from the create form as real Unix seconds. Returns "—" for empty/invalid.
 */
export function formatDate(value: string | number | undefined | null): string {
  const ms = normaliseTimestampToMs(value);
  if (!ms) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format a USER-SUPPLIED timestamp including hour:minute. Returns "—" for
 * empty/invalid.
 */
export function formatTimestamp(value: string | number | undefined | null): string {
  const ms = normaliseTimestampToMs(value);
  if (!ms) return "—";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format a CHAIN-WRITTEN timestamp (issued_at, submitted_at, reviewed_at,
 * created_at, closed_at) — these come from now_timestamp() in the contract,
 * which can fall back to "0" on the GenVM runtime when gl.block.timestamp
 * is unavailable.
 *
 * Returns "Unknown" for empty / "0" / invalid input — never lies with a
 * placeholder year like 1 Jan 2000.
 */
export function formatChainDate(value: string | number | undefined | null): string {
  const ms = normaliseTimestampToMs(value);
  if (!ms) return "Unknown";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Same as formatChainDate but includes hour:minute. For chain-issued
 * timestamps the wall-clock precision is usually not meaningful, but kept
 * separate so we can swap the granularity per-call.
 */
export function formatChainTimestamp(value: string | number | undefined | null): string {
  const ms = normaliseTimestampToMs(value);
  if (!ms) return "Unknown";
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "Unknown";
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
