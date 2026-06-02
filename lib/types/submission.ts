export type Submission = {
  submission_id: string;
  event_id: string;
  attendee: string;
  reflection: string;
  quiz_answers: string[];
  /** Hashed event code stored on-chain — not the original plain text */
  event_code_hash: string;
  proof_link: string;
  project_link: string;
  proof_hash: string;
  status: "pending" | "approved" | "rejected" | "needs_manual_review";
  score: number;
  badge_level: string;
  verdict: string;
  reasons: string[];
  risk_flags: string[];
  verification_summary: string;
  /** Set after issue_badge is called — empty string means badge not yet issued */
  badge_id: string;
  submitted_at: string;
  reviewed_at: string;
};
