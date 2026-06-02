"use client";

import { getClient } from "./client";
import { getContractAddress } from "./contract";
import type { GenProofEvent } from "@/lib/types/event";
import type { Submission } from "@/lib/types/submission";
import type { Badge } from "@/lib/types/badge";
import type { UserProfile } from "@/lib/types/profile";

async function callView(method: string, args: unknown[] = []): Promise<unknown> {
  const client = getClient();
  return await client.readContract({
    address: getContractAddress(),
    functionName: method,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
  });
}

function parseJson<T>(raw: unknown): T {
  if (typeof raw === "string") return JSON.parse(raw) as T;
  if (raw instanceof Map) return Object.fromEntries(raw) as T;
  return raw as T;
}

// ── Event reads ────────────────────────────────────────────────────────────
export async function getEvent(eventId: string): Promise<GenProofEvent> {
  return parseJson<GenProofEvent>(await callView("get_event", [eventId]));
}

export async function getTotalEvents(): Promise<number> {
  return Number(await callView("get_total_events", []));
}

export async function getEventSubmissions(eventId: string): Promise<string[]> {
  return parseJson<string[]>(await callView("get_event_submissions", [eventId]));
}

export async function getEventBadges(eventId: string): Promise<string[]> {
  return parseJson<string[]>(await callView("get_event_badges", [eventId]));
}

// ── Submission / badge / profile reads ─────────────────────────────────────
export async function getSubmission(submissionId: string): Promise<Submission> {
  return parseJson<Submission>(await callView("get_submission", [submissionId]));
}

export async function getBadge(badgeId: string): Promise<Badge> {
  return parseJson<Badge>(await callView("get_badge", [badgeId]));
}

export async function getUserProfile(wallet: string): Promise<UserProfile> {
  return parseJson<UserProfile>(await callView("get_user_profile", [wallet]));
}

export async function getUserBadges(wallet: string): Promise<string[]> {
  return parseJson<string[]>(await callView("get_user_badges", [wallet]));
}

// ── Platform-level reads (new in this contract version) ────────────────────
export async function getPlatformOwner(): Promise<string> {
  const owner = await callView("get_platform_owner", []);
  return String(owner ?? "");
}

export async function getAllEventIds(): Promise<string[]> {
  return parseJson<string[]>(await callView("get_all_events", []));
}

export async function getAllBadgeIds(): Promise<string[]> {
  return parseJson<string[]>(await callView("get_all_badges", []));
}

export async function getAllUsers(): Promise<string[]> {
  return parseJson<string[]>(await callView("get_all_users", []));
}

export async function getTotalBadges(): Promise<number> {
  return Number(await callView("get_total_badges", []));
}

export async function getTotalSubmissions(): Promise<number> {
  return Number(await callView("get_total_submissions", []));
}

export type PlatformSummary = {
  platform_owner: string;
  total_events: number;
  total_submissions: number;
  total_badges: number;
};

export async function getPlatformSummary(): Promise<PlatformSummary> {
  return parseJson<PlatformSummary>(await callView("get_platform_summary", []));
}

/**
 * Fetch all events via the platform registry (preferred — single read instead of looping).
 * Falls back to the counter-based loop if get_all_events isn't available.
 */
export async function getAllEvents(): Promise<GenProofEvent[]> {
  let ids: string[];
  try {
    ids = await getAllEventIds();
  } catch {
    const total = await getTotalEvents();
    ids = Array.from({ length: total }, (_, i) => `event_${i + 1}`);
  }
  const out: GenProofEvent[] = [];
  for (const id of ids) {
    try {
      out.push(await getEvent(id));
    } catch {
      // skip
    }
  }
  return out;
}
