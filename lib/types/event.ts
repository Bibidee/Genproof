export type GenProofEvent = {
  event_id: string;
  organiser: string;
  title: string;
  description: string;
  event_type: string;
  /** Unix seconds (user-supplied). */
  start_date: string;
  /** Unix seconds (user-supplied). */
  end_date: string;
  /** Unix seconds (user-supplied). */
  claim_deadline: string;
  badge_name: string;
  badge_image: string;
  proof_question: string;
  /** Stored as "0x<sha256>" — never expose to attendees */
  event_secret_hash: string;
  verification_strictness: "light" | "standard" | "strict";
  max_claims: number;
  soulbound: boolean;
  is_public: boolean;
  status: "open" | "closed";
  total_submissions: number;
  total_approved: number;
  total_rejected: number;
  total_manual_review: number;
  /** Unix seconds */
  created_at: string;
  /** Unix seconds (empty until closed) */
  closed_at: string;
  /** ISO 8601 (v2 contract) */
  created_at_iso?: string;
  /** ISO 8601 (v2 contract) */
  closed_at_iso?: string;
};
