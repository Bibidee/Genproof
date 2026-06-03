export type Badge = {
  badge_id: string;
  event_id: string;
  submission_id: string;
  owner: string;
  organiser: string;
  badge_name: string;
  badge_image: string;
  badge_level: string;
  verification_score: number;
  verification_summary: string;
  proof_hash: string;
  soulbound: boolean;
  /** Unix seconds. Use for sorting/comparison. */
  issued_at: string;
  /** ISO 8601. Use for display. Added by the v2 contract. Optional for backwards-compat. */
  issued_at_iso?: string;
};
