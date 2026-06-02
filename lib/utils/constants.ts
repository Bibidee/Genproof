export const CONTRACT_ADDRESS =
  process.env.NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "";

export const GENLAYER_RPC =
  process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio.genlayer.com/api";

/** Must match VALID_EVENT_TYPES in the deployed contract */
export const EVENT_TYPE_LABELS: Record<string, string> = {
  workshop: "Workshop",
  hackathon: "Hackathon",
  course_session: "Course / Session",
  community_call: "Community Call",
  conference: "Conference",
  online_event: "Online Event",
  physical_event: "In-Person Event",
  private_event: "Private Event",
};

export const BADGE_LEVEL_LABELS: Record<string, string> = {
  none: "None",
  attendee: "Attendee",
  participant: "Participant",
  contributor: "Contributor",
  builder: "Builder",
  speaker: "Speaker",
  winner: "Winner",
};

export const BADGE_LEVEL_COLORS: Record<string, string> = {
  none: "bg-muted/20 text-muted",
  attendee: "bg-secondary/20 text-secondary",
  participant: "bg-primary/20 text-primary",
  contributor: "bg-success/20 text-success",
  builder: "bg-warning/20 text-warning",
  speaker: "bg-pink-500/20 text-pink-400",
  winner: "bg-yellow-500/20 text-yellow-400",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-warning/20 text-warning",
  approved: "bg-success/20 text-success",
  rejected: "bg-danger/20 text-danger",
  needs_manual_review: "bg-primary/20 text-primary",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Awaiting Review",
  approved: "Approved",
  rejected: "Needs More Detail",
  needs_manual_review: "Under Review",
};

export const REPUTATION_LEVELS = [
  "Newcomer",
  "Explorer",
  "Active Participant",
  "Active Contributor",
  "Core Builder",
];

/** Badge levels the organiser can assign in manual review (never "none" on approve) */
export const MANUAL_BADGE_LEVELS = [
  "attendee",
  "participant",
  "contributor",
  "builder",
  "speaker",
  "winner",
] as const;

/**
 * Length limits — must match MAX_* constants in GenProofRegistry.py exactly.
 * The contract will revert if any of these are exceeded.
 */
export const LIMITS = {
  TITLE: 120,
  DESCRIPTION: 1200,
  DATE: 40,
  BADGE_NAME: 120,
  BADGE_IMAGE: 500,
  PROOF_QUESTION: 500,
  SECRET_HASH: 100,
  REFLECTION_MIN: 20,
  REFLECTION_MAX: 2500,
  QUIZ_ANSWER: 500,
  EVENT_CODE: 100,
  LINK: 500,
  REASON: 1000,
} as const;
