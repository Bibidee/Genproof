"use client";

import { getClient } from "./client";
import { getContractAddress } from "./contract";
import type { GenLayerTransaction } from "genlayer-js/types";

async function callWrite(method: string, args: unknown[]): Promise<GenLayerTransaction> {
  const client = getClient();
  const hash = await client.writeContract({
    address: getContractAddress(),
    functionName: method,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: args as any,
    value: 0n,
  });
  const receipt = await client.waitForTransactionReceipt({
    hash,
    retries: 60,
    interval: 4000,
  });
  // Surface contract-level reverts as JS errors so callers can display them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = receipt as any;
  const leaderArr = r?.consensus_data?.leader_receipt;
  const leader0 = Array.isArray(leaderArr) ? leaderArr[0] : leaderArr;
  const status: string = leader0?.result?.status ?? "";
  const execResult: string = leader0?.execution_result ?? "";
  const isRevert =
    execResult === "ERROR" ||
    execResult === "ROLLBACK" ||
    status === "contract_error" ||
    status === "rollback";
  if (isRevert) {
    throw new Error(extractAssertion(leader0));
  }
  return receipt;
}

/**
 * Pull the assertion message out of a GenVM Python traceback in genvm_result.stderr.
 *   "AssertionError: Already submitted for this event"  →  "Already submitted for this event"
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAssertion(leader0: any): string {
  const stderr: string = leader0?.genvm_result?.stderr ?? "";
  const m = stderr.match(/AssertionError:\s*(.+?)\s*$/m);
  if (m) return m[1];
  const errDesc = leader0?.genvm_result?.error_description;
  if (errDesc) return String(errDesc);
  const payload = leader0?.result?.payload;
  if (typeof payload === "string") return payload;
  if (payload?.readable) return String(payload.readable).replace(/^"|"$/g, "");
  return "Transaction reverted by contract";
}

/**
 * Pull the function's return value out of a v1.2 GenLayer receipt.
 *
 *   receipt.consensus_data.leader_receipt[0].result.payload.readable
 *
 * `.readable` is a JSON-encoded value — e.g. "\"event_2\"" for a string return,
 * or "42" for a number. We JSON-parse it once to unwrap.
 */
function extractResult(receipt: GenLayerTransaction): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = receipt as any;
  const leaderArr = r?.consensus_data?.leader_receipt;
  const leader0 = Array.isArray(leaderArr) ? leaderArr[0] : leaderArr;
  const readable: string | undefined = leader0?.result?.payload?.readable;
  if (typeof readable !== "string") return "";
  try {
    const parsed = JSON.parse(readable);
    return typeof parsed === "string" ? parsed : String(parsed);
  } catch {
    return readable;
  }
}

export async function createEvent(params: {
  title: string;
  description: string;
  event_type: string;
  start_date: string;
  end_date: string;
  claim_deadline: string;
  badge_name: string;
  badge_image: string;
  proof_question: string;
  event_secret_hash: string;
  verification_strictness: string;
  max_claims: number;
  soulbound: boolean;
  is_public: boolean;
}): Promise<string> {
  const receipt = await callWrite("create_event", [
    params.title,
    params.description,
    params.event_type,
    params.start_date,
    params.end_date,
    params.claim_deadline,
    params.badge_name,
    params.badge_image,
    params.proof_question,
    params.event_secret_hash,
    params.verification_strictness,
    params.max_claims,
    params.soulbound,
    params.is_public,
  ]);
  const id = extractResult(receipt);
  if (!id) throw new Error("create_event returned no event_id");
  return id;
}

export async function submitProof(params: {
  event_id: string;
  reflection: string;
  quiz_answer_1: string;
  quiz_answer_2: string;
  event_code: string;
  proof_link: string;
  project_link: string;
}): Promise<string> {
  const receipt = await callWrite("submit_proof", [
    params.event_id,
    params.reflection,
    params.quiz_answer_1,
    params.quiz_answer_2,
    params.event_code,
    params.proof_link,
    params.project_link,
  ]);
  const id = extractResult(receipt);
  if (!id) throw new Error("submit_proof returned no submission_id");
  return id;
}

export async function reviewSubmission(submissionId: string): Promise<string> {
  const receipt = await callWrite("review_submission", [submissionId]);
  return extractResult(receipt);
}

export async function issueBadge(submissionId: string): Promise<string> {
  const receipt = await callWrite("issue_badge", [submissionId]);
  const id = extractResult(receipt);
  if (!id) throw new Error("issue_badge returned no badge_id");
  return id;
}

export async function manualReview(params: {
  submission_id: string;
  decision: "approved" | "rejected";
  badge_level: string;
  reason: string;
}): Promise<void> {
  await callWrite("manual_review", [
    params.submission_id,
    params.decision,
    params.badge_level,
    params.reason,
  ]);
}

export async function closeEvent(eventId: string): Promise<void> {
  await callWrite("close_event", [eventId]);
}
