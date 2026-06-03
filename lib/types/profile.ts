export type UserProfile = {
  wallet: string;
  total_badges: number;
  events_attended: number;
  attendee_badges: number;
  participant_badges: number;
  contributor_badges: number;
  builder_badges: number;
  speaker_badges: number;
  winner_badges: number;
  average_score: number;
  reputation_points: number;
  reputation_level: string;
  /** Unix seconds */
  last_updated: string;
  /** ISO 8601 (v2 contract) */
  last_updated_iso?: string;
};
