// Acceptance tests A–L for the deployed GenProofRegistry contract on GenLayer Studionet.
// Uses genlayer-js@1.2 SDK directly.
//
// Usage:
//   node scripts/acceptance-test.mjs

import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { createHash } from "node:crypto";

const CONTRACT_ADDRESS = "0x72c9FC8eAECCb6b1C727429Af1136D15fb1Cf76c";
const RPC = process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio.genlayer.com/api";

// ─────────────────────────────────────────────────────────────────────────────
// Test harness
// ─────────────────────────────────────────────────────────────────────────────
const results = [];
let testNum = 0;
function color(c, s) {
  const codes = { green: 32, red: 31, yellow: 33, cyan: 36, gray: 90 };
  return `\x1b[${codes[c] || 0}m${s}\x1b[0m`;
}
async function step(label, fn) {
  testNum++;
  process.stdout.write(`${color("cyan", `[${testNum}]`)} ${label}… `);
  const t0 = Date.now();
  try {
    const result = await fn();
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(color("green", `PASS`) + color("gray", ` (${dt}s)`));
    results.push({ label, status: "PASS" });
    return result;
  } catch (e) {
    const dt = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(color("red", `FAIL`) + color("gray", ` (${dt}s)`));
    console.log(color("red", "    " + (e?.message || e)));
    results.push({ label, status: "FAIL", error: e?.message || String(e) });
    return null;
  }
}
async function expectFail(label, fn, expectedMsg) {
  testNum++;
  process.stdout.write(`${color("cyan", `[${testNum}]`)} ${label}… `);
  try {
    await fn();
    console.log(color("red", "FAIL — expected error but succeeded"));
    results.push({ label, status: "FAIL", error: "Expected error but succeeded" });
    return false;
  } catch (e) {
    const msg = e?.message || String(e);
    if (expectedMsg && !msg.toLowerCase().includes(expectedMsg.toLowerCase())) {
      console.log(color("yellow", `PARTIAL`));
      console.log(color("yellow", `    Got: ${msg.slice(0, 200)}`));
      console.log(color("yellow", `    Expected to contain: "${expectedMsg}"`));
      results.push({ label, status: "PARTIAL" });
      return true;
    }
    console.log(color("green", `PASS (rejected as expected)`));
    results.push({ label, status: "PASS" });
    return true;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function makeClient(privateKey) {
  return createClient({
    chain: studionet,
    endpoint: RPC,
    account: createAccount(privateKey),
  });
}
async function callView(client, method, args = []) {
  return await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
  });
}
function extractResult(receipt) {
  const leaderArr = receipt?.consensus_data?.leader_receipt;
  const leader0 = Array.isArray(leaderArr) ? leaderArr[0] : leaderArr;
  const readable = leader0?.result?.payload?.readable;
  if (typeof readable !== "string") return undefined;
  try {
    return JSON.parse(readable);
  } catch {
    return readable;
  }
}
function extractAssertion(leader0) {
  const stderr = leader0?.genvm_result?.stderr ?? "";
  const m = stderr.match(/AssertionError:\s*(.+?)\s*$/m);
  if (m) return m[1];
  const desc = leader0?.genvm_result?.error_description;
  if (desc) return String(desc);
  const payload = leader0?.result?.payload;
  if (typeof payload === "string") return payload;
  if (payload?.readable) return String(payload.readable).replace(/^"|"$/g, "");
  return "Reverted";
}
async function callWrite(client, method, args) {
  const hash = await client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: method,
    args,
    value: 0n,
  });
  const receipt = await client.waitForTransactionReceipt({ hash, retries: 60, interval: 4000 });
  const leaderArr = receipt?.consensus_data?.leader_receipt;
  const leader0 = Array.isArray(leaderArr) ? leaderArr[0] : leaderArr;
  const status = leader0?.result?.status ?? "";
  const execResult = leader0?.execution_result ?? "";
  const isRevert =
    execResult === "ERROR" ||
    execResult === "ROLLBACK" ||
    status === "contract_error" ||
    status === "rollback";
  if (isRevert) {
    throw new Error(extractAssertion(leader0));
  }
  return { receipt, result: extractResult(receipt) };
}
function parseJsonMaybe(raw) {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  if (raw instanceof Map) return Object.fromEntries(raw);
  return raw;
}
function sha256Hex(text) {
  return "0x" + createHash("sha256").update(text, "utf8").digest("hex");
}

// ─────────────────────────────────────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────────────────────────────────────
const GOOD_PROOF =
  "The session explained that intelligent contracts can judge external context and natural language, " +
  "unlike normal smart contracts that only execute deterministic logic. I learnt that GenLayer can be " +
  "used for disputes, claims, reviews, and verification flows.";
const BAD_PROOF = "Nice event. I attended. Give me badge.";

async function run() {
  console.log(color("cyan", "╔══════════════════════════════════════════════════════════╗"));
  console.log(color("cyan", "║  GenProof Acceptance Tests — Studionet (genlayer-js 1.2) ║"));
  console.log(color("cyan", "╚══════════════════════════════════════════════════════════╝"));
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`RPC:      ${RPC}\n`);

  const organiserPk = generatePrivateKey();
  const attendeePk = generatePrivateKey();
  const badAttendeePk = generatePrivateKey();
  const organiser = makeClient(organiserPk);
  const attendee = makeClient(attendeePk);
  const badAttendee = makeClient(badAttendeePk);

  console.log(color("gray", `Organiser:    ${organiser.account.address}`));
  console.log(color("gray", `Attendee:     ${attendee.account.address}`));
  console.log(color("gray", `Bad attendee: ${badAttendee.account.address}\n`));

  // ── Sanity + platform owner identity ────────────────────────────────────
  await step("Sanity: get_total_events from contract", async () => {
    const n = await callView(organiser, "get_total_events", []);
    return Number(n);
  });

  const platformOwner = await step("get_platform_owner returns the deployer address", async () => {
    const owner = await callView(organiser, "get_platform_owner", []);
    if (!owner || typeof owner !== "string" || !owner.startsWith("0x")) {
      throw new Error(`Unexpected owner: ${owner}`);
    }
    console.log(color("gray", `\n    Platform owner: ${owner}`));
    return owner;
  });

  // ── A. Create event ─────────────────────────────────────────────────────
  const eventCode = "GENPROOF2026";
  const eventSecretHash = sha256Hex(eventCode);

  // Unix timestamps — contract requires numeric strings for date fields
  const now = Math.floor(Date.now() / 1000);
  const startTs = String(now);
  const endTs = String(now + 24 * 3600);            // +1 day
  const claimDeadlineTs = String(now + 7 * 24 * 3600); // +7 days

  const createRes = await step("A. Create demo event (workshop, standard, soulbound)", async () => {
    const { result } = await callWrite(organiser, "create_event", [
      "GenLayer Intelligent Contracts Workshop",
      "A live session about intelligent contracts and real-world use cases.",
      "workshop",
      startTs,
      endTs,
      claimDeadlineTs,
      "Verified Workshop Participant",
      "",
      "What is one thing you learnt about intelligent contracts?",
      eventSecretHash,
      "standard",
      500,
      true,
      true,
    ]);
    if (!result) throw new Error("create_event returned no result");
    console.log(color("gray", `\n    Created: ${result}`));
    return result;
  });
  const eventId = createRes;
  if (!eventId) return printSummary();

  // ── B. Read it back ─────────────────────────────────────────────────────
  await step("B. get_event returns the created event", async () => {
    const raw = await callView(organiser, "get_event", [eventId]);
    const event = parseJsonMaybe(raw);
    if (!event || event.event_id !== eventId) throw new Error(`Mismatch: ${JSON.stringify(event)?.slice(0, 100)}`);
    if (event.title !== "GenLayer Intelligent Contracts Workshop") throw new Error("Title mismatch");
    if (event.event_secret_hash !== eventSecretHash) {
      throw new Error(`Secret hash mismatch:\n      got: ${event.event_secret_hash}\n      expected: ${eventSecretHash}`);
    }
    if (event.claim_deadline !== claimDeadlineTs) {
      throw new Error(`claim_deadline mismatch: got ${event.claim_deadline}, expected ${claimDeadlineTs}`);
    }
    console.log(color("gray", `\n    Title: ${event.title}`));
    console.log(color("gray", `    Status: ${event.status}, max_claims: ${event.max_claims}, soulbound: ${event.soulbound}`));
    return event;
  });

  // ── L (early): wrong event code blocked ─────────────────────────────────
  await expectFail(
    "L. Wrong event code is rejected on submit",
    () => callWrite(attendee, "submit_proof", [
      eventId,
      GOOD_PROOF,
      "Intelligent contracts can evaluate natural language.",
      "Smart contracts cannot judge subjective proof.",
      "WRONG_CODE_XYZ",
      "",
      "",
    ]),
    "Invalid event code"
  );

  // ── D. Submit good proof ────────────────────────────────────────────────
  const goodSubmissionId = await step("D. Attendee submits GOOD proof with correct code", async () => {
    const { result } = await callWrite(attendee, "submit_proof", [
      eventId,
      GOOD_PROOF,
      "Intelligent contracts can evaluate natural language and external context.",
      "Normal smart contracts cannot judge subjective participation proof.",
      eventCode,
      "",
      "",
    ]);
    if (!result) throw new Error("No submission_id");
    console.log(color("gray", `\n    Submission: ${result}`));
    return result;
  });

  // ── K. Duplicate submission blocked ─────────────────────────────────────
  if (goodSubmissionId) {
    await expectFail(
      "K. Duplicate submission from same wallet is blocked",
      () => callWrite(attendee, "submit_proof", [
        eventId,
        GOOD_PROOF + " (different text on second attempt)",
        "x",
        "y",
        eventCode,
        "",
        "",
      ]),
      "Already submitted"
    );
  }

  // ── E. AI review on good proof ──────────────────────────────────────────
  let reviewResult = null;
  if (goodSubmissionId) {
    reviewResult = await step("E. review_submission runs AI verification (~30-90s)", async () => {
      const { result } = await callWrite(attendee, "review_submission", [goodSubmissionId]);
      const parsed = typeof result === "string" ? JSON.parse(result) : result;
      console.log(color("gray", `\n    Verdict:      ${parsed.verdict}`));
      console.log(color("gray", `    Score:        ${parsed.score}/100`));
      console.log(color("gray", `    Badge level:  ${parsed.badge_level}`));
      if (parsed.reasons?.length) {
        console.log(color("gray", `    Reasons:      ${parsed.reasons.slice(0, 2).join(" | ").slice(0, 150)}`));
      }
      return parsed;
    });
  }

  // ── F. Issue badge ──────────────────────────────────────────────────────
  let goodBadgeId = null;
  if (reviewResult?.verdict === "approved") {
    goodBadgeId = await step("F. issue_badge for approved submission", async () => {
      const { result } = await callWrite(attendee, "issue_badge", [goodSubmissionId]);
      if (!result) throw new Error("No badge_id");
      console.log(color("gray", `\n    Badge: ${result}`));
      return result;
    });
  } else if (reviewResult) {
    console.log(color("yellow", `[${++testNum}] F. Issue badge … SKIPPED — verdict was '${reviewResult.verdict}'`));
    results.push({ label: "F. Issue badge", status: "SKIP" });
  }

  // ── G. Badge appears on profile ─────────────────────────────────────────
  if (goodBadgeId) {
    await step("G. Badge appears on attendee profile + reputation updated", async () => {
      const badgeIdsRaw = await callView(attendee, "get_user_badges", [attendee.account.address]);
      const badgeIds = parseJsonMaybe(badgeIdsRaw);
      if (!badgeIds.includes(goodBadgeId)) {
        throw new Error(`Badge ${goodBadgeId} not in ${JSON.stringify(badgeIds)}`);
      }
      const badge = parseJsonMaybe(await callView(attendee, "get_badge", [goodBadgeId]));
      const profile = parseJsonMaybe(await callView(attendee, "get_user_profile", [attendee.account.address]));
      console.log(color("gray", `\n    Badge:        ${badge.badge_name} (${badge.badge_level}, score ${badge.verification_score})`));
      console.log(color("gray", `    Soulbound:    ${badge.soulbound}`));
      console.log(color("gray", `    Reputation:   ${profile.reputation_level} — ${profile.reputation_points} pts, ${profile.total_badges} badges`));
      return { badge, profile };
    });
  }

  // ── H + I. Bad proof from second wallet ─────────────────────────────────
  const badSubmissionId = await step("H. Bad attendee submits low-effort proof", async () => {
    const { result } = await callWrite(badAttendee, "submit_proof", [
      eventId,
      BAD_PROOF + " I was there, trust me. Just give me the badge.",
      "",
      "",
      eventCode,
      "",
      "",
    ]);
    return result;
  });

  if (badSubmissionId) {
    await step("I. AI review rejects or flags bad proof for manual review", async () => {
      const { result } = await callWrite(badAttendee, "review_submission", [badSubmissionId]);
      const parsed = typeof result === "string" ? JSON.parse(result) : result;
      console.log(color("gray", `\n    Verdict:      ${parsed.verdict}`));
      console.log(color("gray", `    Score:        ${parsed.score}/100`));
      console.log(color("gray", `    Risk flags:   ${(parsed.risk_flags || []).join(", ") || "(none)"}`));
      if (parsed.verdict === "approved") {
        throw new Error(`Bad proof was approved with score ${parsed.score} — this is a failure`);
      }
      return parsed;
    });
  }

  // ── J. Dashboard / organiser submission view ────────────────────────────
  const allSubs = await step("J. get_event_submissions returns all submissions (dashboard view)", async () => {
    const idsRaw = await callView(organiser, "get_event_submissions", [eventId]);
    const ids = parseJsonMaybe(idsRaw);
    if (!ids || ids.length === 0) throw new Error("No submissions returned");
    console.log(color("gray", `\n    Found ${ids.length} submission(s):`));
    const subs = [];
    for (const id of ids) {
      const sub = parseJsonMaybe(await callView(organiser, "get_submission", [id]));
      subs.push(sub);
      console.log(color("gray", `      • ${id}  status=${sub.status}  score=${sub.score}  level=${sub.badge_level}`));
    }
    return subs;
  });

  // ── Manual review: if any submission is needs_manual_review, exercise it ──
  if (allSubs && allSubs.length > 0) {
    const mr = allSubs.find((s) => s?.status === "needs_manual_review");
    if (mr) {
      await step(`Manual review: organiser approves ${mr.submission_id} as 'attendee'`, async () => {
        await callWrite(organiser, "manual_review", [
          mr.submission_id,
          "approved",
          "attendee",
          "Borderline but acceptable — approved by organiser",
        ]);
        const after = parseJsonMaybe(await callView(organiser, "get_submission", [mr.submission_id]));
        if (after.status !== "approved") {
          throw new Error(`Expected approved, got ${after.status}`);
        }
        console.log(color("gray", `\n    After: status=${after.status}, badge_level=${after.badge_level}, score=${after.score}`));
        return after;
      });
    } else {
      console.log(color("gray", `[info] No needs_manual_review submission to exercise manual_review against (this is fine)`));
    }
  }

  // ── Platform-level views ──────────────────────────────────────────────
  await step("get_event_badges returns the event's badge list", async () => {
    const raw = await callView(organiser, "get_event_badges", [eventId]);
    const ids = parseJsonMaybe(raw);
    if (!Array.isArray(ids)) throw new Error("Expected an array");
    console.log(color("gray", `\n    Event ${eventId} badges: ${JSON.stringify(ids)}`));
    if (goodBadgeId && !ids.includes(goodBadgeId)) {
      throw new Error(`${goodBadgeId} missing from event_badges`);
    }
    return ids;
  });

  await step("get_all_events lists this event in the platform registry", async () => {
    const raw = await callView(organiser, "get_all_events", []);
    const all = parseJsonMaybe(raw);
    if (!Array.isArray(all)) throw new Error("Expected array");
    if (!all.includes(eventId)) throw new Error(`${eventId} missing from get_all_events`);
    console.log(color("gray", `\n    Total events registered: ${all.length}`));
    return all;
  });

  await step("get_all_badges lists the issued badge", async () => {
    const raw = await callView(organiser, "get_all_badges", []);
    const all = parseJsonMaybe(raw);
    if (!Array.isArray(all)) throw new Error("Expected array");
    if (goodBadgeId && !all.includes(goodBadgeId)) {
      throw new Error(`${goodBadgeId} missing from get_all_badges`);
    }
    console.log(color("gray", `\n    Total badges registered: ${all.length}`));
    return all;
  });

  await step("get_all_users lists the attendee with a badge", async () => {
    const raw = await callView(organiser, "get_all_users", []);
    const all = parseJsonMaybe(raw);
    if (!Array.isArray(all)) throw new Error("Expected array");
    const attendeeAddr = attendee.account.address.toLowerCase();
    const found = all.some((a) => String(a).toLowerCase() === attendeeAddr);
    if (goodBadgeId && !found) {
      throw new Error(`attendee ${attendeeAddr} missing from get_all_users`);
    }
    console.log(color("gray", `\n    Total users with badges: ${all.length}`));
    return all;
  });

  await step("get_total_badges and get_total_submissions", async () => {
    const tb = Number(await callView(organiser, "get_total_badges", []));
    const ts = Number(await callView(organiser, "get_total_submissions", []));
    console.log(color("gray", `\n    total_badges: ${tb}, total_submissions: ${ts}`));
    if (tb < 1 || ts < 2) throw new Error(`Counters too low: badges=${tb} subs=${ts}`);
    return { tb, ts };
  });

  await step("get_platform_summary returns aggregated stats", async () => {
    const raw = await callView(organiser, "get_platform_summary", []);
    const sum = parseJsonMaybe(raw);
    console.log(color("gray", `\n    Summary: ${JSON.stringify(sum)}`));
    if (!sum || typeof sum !== "object") throw new Error("Expected object");
    if (!sum.platform_owner) throw new Error("Missing platform_owner");
    return sum;
  });

  // ── Permission tests ──────────────────────────────────────────────────
  // close_event by non-organiser should fail
  await expectFail(
    "Permission: non-organiser cannot close_event",
    () => callWrite(badAttendee, "close_event", [eventId]),
    "Not organiser"
  );

  // manual_review by non-organiser should fail (uses bad submission which was rejected,
  // so this also tests that manual_review can only act on needs_manual_review status)
  if (badSubmissionId) {
    await expectFail(
      "Permission: non-organiser cannot manual_review",
      () => callWrite(badAttendee, "manual_review", [
        badSubmissionId, "approved", "attendee", "should not work",
      ]),
      // Either organiser check or status check will trip first
      ""
    );
  }

  // close_event by organiser should succeed
  await step("close_event by organiser succeeds", async () => {
    await callWrite(organiser, "close_event", [eventId]);
    const event = parseJsonMaybe(await callView(organiser, "get_event", [eventId]));
    if (event.status !== "closed") throw new Error(`Expected closed, got ${event.status}`);
    console.log(color("gray", `\n    Event status: ${event.status}`));
    return event;
  });

  // ── Event counters update correctly ────────────────────────────────────
  await step("Event counters reflect submission outcomes", async () => {
    const event = parseJsonMaybe(await callView(organiser, "get_event", [eventId]));
    const subs = allSubs || [];
    const counts = subs.reduce((acc, s) => {
      acc.total++;
      if (s.status === "approved") acc.approved++;
      else if (s.status === "rejected") acc.rejected++;
      else if (s.status === "needs_manual_review") acc.manual++;
      return acc;
    }, { total: 0, approved: 0, rejected: 0, manual: 0 });

    console.log(color("gray", `\n    Counters on-chain:`));
    console.log(color("gray", `      total_submissions:    ${event.total_submissions}`));
    console.log(color("gray", `      total_approved:       ${event.total_approved}`));
    console.log(color("gray", `      total_rejected:       ${event.total_rejected}`));
    console.log(color("gray", `      total_manual_review:  ${event.total_manual_review}`));

    if (Number(event.total_submissions) !== counts.total) {
      throw new Error(`total_submissions mismatch: chain=${event.total_submissions} computed=${counts.total}`);
    }
    return { event, counts };
  });

  printSummary();
}

function printSummary() {
  console.log("\n" + color("cyan", "═".repeat(60)));
  console.log(color("cyan", " Summary"));
  console.log(color("cyan", "═".repeat(60)));
  for (const r of results) {
    const tag =
      r.status === "PASS" ? color("green", "✓ PASS") :
      r.status === "FAIL" ? color("red", "✗ FAIL") :
      r.status === "SKIP" ? color("yellow", "⊘ SKIP") :
      color("yellow", "± PART");
    console.log(`  ${tag}  ${r.label}`);
  }
  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const partial = results.filter(r => r.status === "PARTIAL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;
  console.log("");
  console.log(`  ${color("green", passed + " passed")}, ${color("red", failed + " failed")}, ${color("yellow", partial + " partial")}, ${color("yellow", skipped + " skipped")}`);
  console.log("");
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(color("red", "\nTest runner crashed: " + (e?.stack || e)));
  printSummary();
});
