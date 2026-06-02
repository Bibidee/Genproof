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
  issued_at: string;
};
