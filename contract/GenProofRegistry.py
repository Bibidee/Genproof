# v0.2.17
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import hashlib


# ---------------------------------------------------------------------------
# GenProofRegistry — GenLayer Intelligent Contract
# Proof-of-Attendance With Intelligence
#
# Registry-based verified credentials.
# NOT ERC-721.
# NOT NFT badges.
# Badges are stored as GenLayer credential records.
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

VALID_EVENT_TYPES = {
    "online_event",
    "physical_event",
    "workshop",
    "hackathon",
    "course_session",
    "community_call",
    "conference",
    "private_event",
}

VALID_STRICTNESS = {
    "light",
    "standard",
    "strict",
}

VALID_BADGE_LEVELS = {
    "none",
    "attendee",
    "participant",
    "contributor",
    "builder",
    "speaker",
    "winner",
}

VALID_MANUAL_DECISIONS = {
    "approved",
    "rejected",
}

MAX_TITLE_LEN = 120
MAX_DESCRIPTION_LEN = 1200
MAX_DATE_LEN = 40
MAX_BADGE_NAME_LEN = 120
MAX_BADGE_IMAGE_LEN = 500
MAX_PROOF_QUESTION_LEN = 500
MAX_SECRET_HASH_LEN = 100
MAX_REFLECTION_LEN = 2500
MAX_QUIZ_ANSWER_LEN = 500
MAX_EVENT_CODE_LEN = 100
MAX_LINK_LEN = 500
MAX_REASON_LEN = 1000


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def sha256_text(value: str) -> str:
    return "0x" + hashlib.sha256(value.encode("utf-8")).hexdigest()


def safe_json_loads(raw: str, fallback):
    if raw is None or raw == "":
        return fallback

    try:
        return json.loads(raw)
    except Exception:
        return fallback


def to_json(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


def now_timestamp() -> str:
    try:
        return str(gl.block.timestamp)
    except Exception:
        return "0"


def now_int() -> int:
    try:
        return int(gl.block.timestamp)
    except Exception:
        return 0


def normalise_text(value: str) -> str:
    if value is None:
        return ""
    return str(value).strip()


def parse_int_or_zero(value: str) -> int:
    try:
        if value is None:
            return 0
        value = str(value).strip()
        if value == "":
            return 0
        return int(value)
    except Exception:
        return 0


def assert_max_len(value: str, max_len: int, label: str) -> None:
    assert len(value) <= max_len, label + " is too long"


def append_to_json_list(raw: str, item: str) -> str:
    items = safe_json_loads(raw, [])
    if not isinstance(items, list):
        items = []
    items.append(item)
    return to_json(items)


def append_unique_to_json_list(raw: str, item: str) -> str:
    items = safe_json_loads(raw, [])
    if not isinstance(items, list):
        items = []

    if item not in items:
        items.append(item)

    return to_json(items)


def clean_ai_json(raw: str) -> dict:
    cleaned = normalise_text(raw)

    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1).strip()

    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```", "", 1).strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except Exception:
        pass

    try:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start >= 0 and end > start:
            return json.loads(cleaned[start:end + 1])
    except Exception:
        pass

    return {
        "verdict": "needs_manual_review",
        "score": 0,
        "badge_level": "none",
        "reasons": ["AI review could not be parsed. Manual review is required."],
        "risk_flags": ["parse_error"],
        "verification_summary": "Automatic review failed and the submission was sent to manual review.",
    }


def clamp_score(value) -> int:
    try:
        score = int(value)
    except Exception:
        return 0

    if score < 0:
        return 0

    if score > 100:
        return 100

    return score


def reputation_level_from_points(points: int) -> str:
    if points >= 500:
        return "Core Builder"
    if points >= 200:
        return "Active Contributor"
    if points >= 75:
        return "Active Participant"
    if points >= 25:
        return "Explorer"
    return "Newcomer"


def points_for_badge_level(badge_level: str) -> int:
    if badge_level == "attendee":
        return 10
    if badge_level == "participant":
        return 25
    if badge_level == "contributor":
        return 50
    if badge_level == "builder":
        return 50
    if badge_level == "speaker":
        return 30
    if badge_level == "winner":
        return 40
    return 0


def expected_badge_level_from_score(score: int) -> str:
    if score >= 90:
        return "contributor"
    if score >= 80:
        return "participant"
    if score >= 60:
        return "attendee"
    return "none"


def expected_verdict_from_score(score: int) -> str:
    if score >= 60:
        return "approved"
    if score >= 40:
        return "needs_manual_review"
    return "rejected"


# ---------------------------------------------------------------------------
# Contract
# ---------------------------------------------------------------------------

class GenProofRegistry(gl.Contract):
    platform_owner: str

    events: TreeMap[str, str]
    submissions: TreeMap[str, str]
    badges: TreeMap[str, str]
    user_profiles: TreeMap[str, str]

    event_submissions: TreeMap[str, str]
    event_badges: TreeMap[str, str]

    user_badges: TreeMap[str, str]

    platform_events: TreeMap[str, str]
    platform_badges: TreeMap[str, str]
    platform_users: TreeMap[str, str]

    proof_hashes: TreeMap[str, str]

    event_counter: u256
    submission_counter: u256
    badge_counter: u256

    def __init__(self) -> None:
        self.platform_owner = str(gl.message.sender_address)

        self.events = TreeMap()
        self.submissions = TreeMap()
        self.badges = TreeMap()
        self.user_profiles = TreeMap()

        self.event_submissions = TreeMap()
        self.event_badges = TreeMap()

        self.user_badges = TreeMap()

        self.platform_events = TreeMap()
        self.platform_badges = TreeMap()
        self.platform_users = TreeMap()

        self.proof_hashes = TreeMap()

        self.event_counter = u256(0)
        self.submission_counter = u256(0)
        self.badge_counter = u256(0)

        self.platform_events["all"] = "[]"
        self.platform_badges["all"] = "[]"
        self.platform_users["all"] = "[]"

    # -----------------------------------------------------------------------
    # Platform views
    # -----------------------------------------------------------------------

    @gl.public.view
    def get_platform_owner(self) -> str:
        return self.platform_owner

    @gl.public.view
    def get_all_events(self) -> str:
        if "all" not in self.platform_events:
            return "[]"
        return self.platform_events["all"]

    @gl.public.view
    def get_all_badges(self) -> str:
        if "all" not in self.platform_badges:
            return "[]"
        return self.platform_badges["all"]

    @gl.public.view
    def get_all_users(self) -> str:
        if "all" not in self.platform_users:
            return "[]"
        return self.platform_users["all"]

    @gl.public.view
    def get_total_events(self) -> int:
        return int(self.event_counter)

    @gl.public.view
    def get_total_submissions(self) -> int:
        return int(self.submission_counter)

    @gl.public.view
    def get_total_badges(self) -> int:
        return int(self.badge_counter)

    @gl.public.view
    def get_platform_summary(self) -> str:
        return to_json({
            "platform_owner": self.platform_owner,
            "total_events": int(self.event_counter),
            "total_submissions": int(self.submission_counter),
            "total_badges": int(self.badge_counter),
        })

    # -----------------------------------------------------------------------
    # Event management
    # -----------------------------------------------------------------------

    @gl.public.write
    def create_event(
        self,
        title: str,
        description: str,
        event_type: str,
        start_date: str,
        end_date: str,
        claim_deadline: str,
        badge_name: str,
        badge_image: str,
        proof_question: str,
        event_secret_hash: str,
        verification_strictness: str,
        max_claims: u256,
        soulbound: bool,
        is_public: bool,
    ) -> str:
        title = normalise_text(title)
        description = normalise_text(description)
        event_type = normalise_text(event_type)
        start_date = normalise_text(start_date)
        end_date = normalise_text(end_date)
        claim_deadline = normalise_text(claim_deadline)
        badge_name = normalise_text(badge_name)
        badge_image = normalise_text(badge_image)
        proof_question = normalise_text(proof_question)
        event_secret_hash = normalise_text(event_secret_hash)
        verification_strictness = normalise_text(verification_strictness)

        assert title != "", "Title required"
        assert description != "", "Description required"
        assert badge_name != "", "Badge name required"
        assert proof_question != "", "Proof question required"
        assert event_type in VALID_EVENT_TYPES, "Invalid event type"
        assert verification_strictness in VALID_STRICTNESS, "Invalid strictness"
        assert int(max_claims) >= 0, "Invalid max claims"

        assert_max_len(title, MAX_TITLE_LEN, "Title")
        assert_max_len(description, MAX_DESCRIPTION_LEN, "Description")
        assert_max_len(start_date, MAX_DATE_LEN, "Start date")
        assert_max_len(end_date, MAX_DATE_LEN, "End date")
        assert_max_len(claim_deadline, MAX_DATE_LEN, "Claim deadline")
        assert_max_len(badge_name, MAX_BADGE_NAME_LEN, "Badge name")
        assert_max_len(badge_image, MAX_BADGE_IMAGE_LEN, "Badge image")
        assert_max_len(proof_question, MAX_PROOF_QUESTION_LEN, "Proof question")
        assert_max_len(event_secret_hash, MAX_SECRET_HASH_LEN, "Event secret hash")

        if claim_deadline != "":
            assert parse_int_or_zero(claim_deadline) > 0, "Claim deadline must be a Unix timestamp string"

        if start_date != "":
            assert parse_int_or_zero(start_date) >= 0, "Invalid start date"

        if end_date != "":
            assert parse_int_or_zero(end_date) >= 0, "Invalid end date"

        if start_date != "" and end_date != "":
            start_ts = parse_int_or_zero(start_date)
            end_ts = parse_int_or_zero(end_date)
            assert end_ts >= start_ts, "End date must be after start date"

        if event_secret_hash != "":
            assert event_secret_hash.startswith("0x"), "Event secret hash must start with 0x"

        self.event_counter = u256(int(self.event_counter) + 1)
        event_id = "event_" + str(int(self.event_counter))
        organiser = str(gl.message.sender_address)

        event = {
            "event_id": event_id,
            "organiser": organiser,
            "title": title,
            "description": description,
            "event_type": event_type,
            "start_date": start_date,
            "end_date": end_date,
            "claim_deadline": claim_deadline,
            "badge_name": badge_name,
            "badge_image": badge_image,
            "proof_question": proof_question,
            "event_secret_hash": event_secret_hash,
            "verification_strictness": verification_strictness,
            "max_claims": int(max_claims),
            "soulbound": bool(soulbound),
            "is_public": bool(is_public),
            "status": "open",
            "total_submissions": 0,
            "total_approved": 0,
            "total_rejected": 0,
            "total_manual_review": 0,
            "created_at": now_timestamp(),
            "closed_at": "",
        }

        self.events[event_id] = to_json(event)
        self.event_submissions[event_id] = "[]"
        self.event_badges[event_id] = "[]"

        self.platform_events["all"] = append_to_json_list(
            self.platform_events["all"],
            event_id,
        )

        return event_id

    @gl.public.view
    def get_event(self, event_id: str) -> str:
        assert event_id in self.events, "Event not found"
        return self.events[event_id]

    @gl.public.view
    def get_event_submissions(self, event_id: str) -> str:
        assert event_id in self.events, "Event not found"

        if event_id not in self.event_submissions:
            return "[]"

        return self.event_submissions[event_id]

    @gl.public.view
    def get_event_badges(self, event_id: str) -> str:
        assert event_id in self.events, "Event not found"

        if event_id not in self.event_badges:
            return "[]"

        return self.event_badges[event_id]

    @gl.public.write
    def close_event(self, event_id: str) -> None:
        assert event_id in self.events, "Event not found"

        event = safe_json_loads(self.events[event_id], {})
        assert event.get("organiser") == str(gl.message.sender_address), "Not organiser"
        assert event.get("status") == "open", "Event already closed"

        event["status"] = "closed"
        event["closed_at"] = now_timestamp()

        self.events[event_id] = to_json(event)

    # -----------------------------------------------------------------------
    # Proof submission
    # -----------------------------------------------------------------------

    @gl.public.write
    def submit_proof(
        self,
        event_id: str,
        reflection: str,
        quiz_answer_1: str,
        quiz_answer_2: str,
        event_code: str,
        proof_link: str,
        project_link: str,
    ) -> str:
        assert event_id in self.events, "Event not found"

        event = safe_json_loads(self.events[event_id], {})
        assert event.get("status") == "open", "Event is closed"

        claim_deadline = normalise_text(event.get("claim_deadline", ""))
        if claim_deadline != "":
            assert now_int() <= parse_int_or_zero(claim_deadline), "Claim deadline has passed"

        attendee = str(gl.message.sender_address)

        reflection = normalise_text(reflection)
        quiz_answer_1 = normalise_text(quiz_answer_1)
        quiz_answer_2 = normalise_text(quiz_answer_2)
        event_code = normalise_text(event_code)
        proof_link = normalise_text(proof_link)
        project_link = normalise_text(project_link)

        assert len(reflection) >= 20, "Proof is too short. Please provide more detail."

        assert_max_len(reflection, MAX_REFLECTION_LEN, "Reflection")
        assert_max_len(quiz_answer_1, MAX_QUIZ_ANSWER_LEN, "Quiz answer 1")
        assert_max_len(quiz_answer_2, MAX_QUIZ_ANSWER_LEN, "Quiz answer 2")
        assert_max_len(event_code, MAX_EVENT_CODE_LEN, "Event code")
        assert_max_len(proof_link, MAX_LINK_LEN, "Proof link")
        assert_max_len(project_link, MAX_LINK_LEN, "Project link")

        wallet_event_key = "submitted:" + event_id + ":" + attendee
        assert wallet_event_key not in self.proof_hashes, "Already submitted for this event"

        max_claims = int(event.get("max_claims", 0))
        total_submissions = int(event.get("total_submissions", 0))

        if max_claims > 0:
            assert total_submissions < max_claims, "Event claim limit reached"

        expected_secret_hash = normalise_text(event.get("event_secret_hash", ""))
        if expected_secret_hash != "":
            submitted_code_hash = sha256_text(event_code)
            assert submitted_code_hash == expected_secret_hash, "Invalid event code"

        canonical_proof = to_json({
            "event_id": event_id,
            "reflection": reflection.lower(),
            "quiz_answer_1": quiz_answer_1.lower(),
            "quiz_answer_2": quiz_answer_2.lower(),
            "event_code_hash": sha256_text(event_code) if event_code != "" else "",
            "proof_link": proof_link,
            "project_link": project_link,
        })

        proof_hash = sha256_text(canonical_proof)
        duplicate_key = "proof:" + proof_hash
        assert duplicate_key not in self.proof_hashes, "Duplicate proof detected"

        self.submission_counter = u256(int(self.submission_counter) + 1)
        submission_id = "submission_" + str(int(self.submission_counter))

        submission = {
            "submission_id": submission_id,
            "event_id": event_id,
            "attendee": attendee,
            "reflection": reflection,
            "quiz_answers": [quiz_answer_1, quiz_answer_2],
            "event_code_hash": sha256_text(event_code) if event_code != "" else "",
            "proof_link": proof_link,
            "project_link": project_link,
            "proof_hash": proof_hash,
            "status": "pending",
            "score": 0,
            "badge_level": "none",
            "verdict": "pending",
            "reasons": [],
            "risk_flags": [],
            "verification_summary": "",
            "badge_id": "",
            "submitted_at": now_timestamp(),
            "reviewed_at": "",
        }

        self.submissions[submission_id] = to_json(submission)

        self.proof_hashes[wallet_event_key] = submission_id
        self.proof_hashes[duplicate_key] = submission_id

        self.event_submissions[event_id] = append_to_json_list(
            self.event_submissions[event_id],
            submission_id,
        )

        event["total_submissions"] = total_submissions + 1
        self.events[event_id] = to_json(event)

        return submission_id

    @gl.public.view
    def get_submission(self, submission_id: str) -> str:
        assert submission_id in self.submissions, "Submission not found"
        return self.submissions[submission_id]

    # -----------------------------------------------------------------------
    # Intelligent AI review
    # -----------------------------------------------------------------------

    @gl.public.write
    def review_submission(self, submission_id: str) -> str:
        assert submission_id in self.submissions, "Submission not found"

        submission = safe_json_loads(self.submissions[submission_id], {})
        assert submission.get("status") == "pending", "Submission already reviewed"

        event_id = submission.get("event_id", "")
        assert event_id in self.events, "Event not found"

        event = safe_json_loads(self.events[event_id], {})

        prompt = f"""
You are GenProof, an intelligent proof-of-attendance reviewer on GenLayer.

Your job is to decide whether an attendee deserves an event credential.

IMPORTANT RULES:
- Judge only from the event details and submitted proof.
- Do not approve generic, copied, irrelevant, or low-effort proof.
- Do not approve one-liners such as "Nice event. I attended. Give me badge."
- Do not invent facts.
- If the proof is partly relevant but uncertain, use needs_manual_review.
- Return only valid JSON. No markdown. No explanation outside JSON.

EVENT DETAILS:
Event title: {event.get("title", "")}
Event type: {event.get("event_type", "")}
Event description: {event.get("description", "")}
Proof question: {event.get("proof_question", "")}
Verification strictness: {event.get("verification_strictness", "standard")}
Badge name: {event.get("badge_name", "")}

SUBMITTED PROOF:
Reflection: {submission.get("reflection", "")}
Quiz answer 1: {submission.get("quiz_answers", ["", ""])[0]}
Quiz answer 2: {submission.get("quiz_answers", ["", ""])[1]}
Proof link: {submission.get("proof_link", "")}
Project link: {submission.get("project_link", "")}

SCORING CRITERIA:
- Attendance relevance: 30 points
- Specificity: 20 points
- Understanding: 25 points
- Originality: 15 points
- Supporting evidence: 10 points

VERDICT RULES:
- 0 to 39: rejected
- 40 to 59: needs_manual_review
- 60 to 79: approved, badge_level attendee
- 80 to 89: approved, badge_level participant
- 90 to 100: approved, badge_level contributor

For hackathon or technical build events:
- If a strong project link or contribution proof is present, badge_level may be builder.

Risk flags allowed:
generic_response, copied_response, event_mismatch, low_effort,
wrong_quiz_answer, irrelevant_proof, unsupported_claim,
possible_farming, weak_supporting_evidence, parse_error

Return JSON in this exact shape:
{{
  "verdict": "approved",
  "score": 84,
  "badge_level": "participant",
  "reasons": ["The proof is specific to the event.", "The attendee explained what they learnt clearly."],
  "risk_flags": [],
  "verification_summary": "The attendee submitted relevant and meaningful proof of participation."
}}
"""

        task = (
            "Review the submitted proof of attendance for an event and return a "
            "single JSON object describing the verdict, score, badge level, "
            "reasons, risk flags, and a short verification summary."
        )

        criteria = (
            "The output must be a valid JSON object with keys verdict, score, "
            "badge_level, reasons, risk_flags, verification_summary. "
            "verdict must be one of approved, rejected, needs_manual_review. "
            "score must be an integer between 0 and 100. "
            "badge_level must be one of none, attendee, participant, contributor, "
            "builder, speaker, winner. "
            "reasons and risk_flags must be lists of strings. "
            "verification_summary must be a short string. "
            "The verdict must be consistent with the score: 0-39 rejected, "
            "40-59 needs_manual_review, 60+ approved. "
            "Generic one-liner proofs like 'I attended, give me badge' must be rejected."
        )

        def nondet() -> str:
            # IMPORTANT:
            # For prompt_non_comparative, return the prompt directly.
            # Do not call gl.exec_prompt(prompt) here.
            return prompt

        result_raw = gl.eq_principle.prompt_non_comparative(
            nondet,
            task=task,
            criteria=criteria,
        )

        result = clean_ai_json(result_raw)

        score = clamp_score(result.get("score", 0))
        verdict = normalise_text(result.get("verdict", expected_verdict_from_score(score)))
        badge_level = normalise_text(result.get("badge_level", expected_badge_level_from_score(score)))

        if verdict not in ("approved", "rejected", "needs_manual_review"):
            verdict = expected_verdict_from_score(score)

        if badge_level not in VALID_BADGE_LEVELS:
            badge_level = expected_badge_level_from_score(score)

        expected_verdict = expected_verdict_from_score(score)

        if expected_verdict == "rejected":
            verdict = "rejected"
            badge_level = "none"
        elif expected_verdict == "needs_manual_review" and verdict == "approved":
            verdict = "needs_manual_review"
            badge_level = "none"

        if verdict != "approved":
            badge_level = "none"

        reasons = result.get("reasons", [])
        if not isinstance(reasons, list):
            reasons = [str(reasons)]

        risk_flags = result.get("risk_flags", [])
        if not isinstance(risk_flags, list):
            risk_flags = [str(risk_flags)]

        verification_summary = normalise_text(result.get("verification_summary", ""))
        if verification_summary == "":
            verification_summary = "The submission was reviewed by GenLayer consensus."

        if verdict == "approved":
            submission["status"] = "approved"
        elif verdict == "rejected":
            submission["status"] = "rejected"
        else:
            submission["status"] = "needs_manual_review"

        submission["score"] = score
        submission["badge_level"] = badge_level
        submission["verdict"] = verdict
        submission["reasons"] = reasons
        submission["risk_flags"] = risk_flags
        submission["verification_summary"] = verification_summary
        submission["reviewed_at"] = now_timestamp()

        self.submissions[submission_id] = to_json(submission)

        if verdict == "approved":
            event["total_approved"] = int(event.get("total_approved", 0)) + 1
        elif verdict == "rejected":
            event["total_rejected"] = int(event.get("total_rejected", 0)) + 1
        else:
            event["total_manual_review"] = int(event.get("total_manual_review", 0)) + 1

        self.events[event_id] = to_json(event)

        final_result = {
            "verdict": verdict,
            "score": score,
            "badge_level": badge_level,
            "reasons": reasons,
            "risk_flags": risk_flags,
            "verification_summary": verification_summary,
        }

        return to_json(final_result)

    # -----------------------------------------------------------------------
    # Badge issuing
    # -----------------------------------------------------------------------

    @gl.public.write
    def issue_badge(self, submission_id: str) -> str:
        assert submission_id in self.submissions, "Submission not found"

        submission = safe_json_loads(self.submissions[submission_id], {})
        assert submission.get("status") == "approved", "Submission not approved"

        event_id = submission.get("event_id", "")
        assert event_id in self.events, "Event not found"

        attendee = submission.get("attendee", "")
        assert attendee != "", "Invalid attendee"

        event = safe_json_loads(self.events[event_id], {})

        badge_key = "badge:" + attendee + ":" + event_id
        assert badge_key not in self.proof_hashes, "Badge already issued for this event"

        existing_badge_id = normalise_text(submission.get("badge_id", ""))
        assert existing_badge_id == "", "Badge already issued for this submission"

        self.badge_counter = u256(int(self.badge_counter) + 1)
        badge_id = "badge_" + str(int(self.badge_counter))

        badge = {
            "badge_id": badge_id,
            "event_id": event_id,
            "submission_id": submission_id,
            "owner": attendee,
            "organiser": event.get("organiser", ""),
            "badge_name": event.get("badge_name", ""),
            "badge_image": event.get("badge_image", ""),
            "badge_level": submission.get("badge_level", "attendee"),
            "verification_score": int(submission.get("score", 0)),
            "verification_summary": submission.get("verification_summary", ""),
            "proof_hash": submission.get("proof_hash", ""),
            "soulbound": bool(event.get("soulbound", True)),
            "issued_at": now_timestamp(),
        }

        self.badges[badge_id] = to_json(badge)
        self.proof_hashes[badge_key] = badge_id

        # User badge collation
        existing_user_badges = "[]"
        if attendee in self.user_badges:
            existing_user_badges = self.user_badges[attendee]

        self.user_badges[attendee] = append_to_json_list(
            existing_user_badges,
            badge_id,
        )

        # Event badge collation
        existing_event_badges = "[]"
        if event_id in self.event_badges:
            existing_event_badges = self.event_badges[event_id]

        self.event_badges[event_id] = append_to_json_list(
            existing_event_badges,
            badge_id,
        )

        # Platform-wide badge collation
        self.platform_badges["all"] = append_to_json_list(
            self.platform_badges["all"],
            badge_id,
        )

        # Platform-wide user collation
        self.platform_users["all"] = append_unique_to_json_list(
            self.platform_users["all"],
            attendee,
        )

        submission["badge_id"] = badge_id
        self.submissions[submission_id] = to_json(submission)

        self.update_user_profile_internal(
            attendee,
            normalise_text(submission.get("badge_level", "attendee")),
            int(submission.get("score", 0)),
        )

        return badge_id

    @gl.public.view
    def get_badge(self, badge_id: str) -> str:
        assert badge_id in self.badges, "Badge not found"
        return self.badges[badge_id]

    @gl.public.view
    def get_user_badges(self, wallet: str) -> str:
        wallet = normalise_text(wallet)

        if wallet not in self.user_badges:
            return "[]"

        return self.user_badges[wallet]

    # -----------------------------------------------------------------------
    # User reputation profile
    # -----------------------------------------------------------------------

    def update_user_profile_internal(self, wallet: str, badge_level: str, score: int) -> None:
        if wallet in self.user_profiles:
            profile = safe_json_loads(self.user_profiles[wallet], {})
        else:
            profile = {
                "wallet": wallet,
                "total_badges": 0,
                "events_attended": 0,
                "attendee_badges": 0,
                "participant_badges": 0,
                "contributor_badges": 0,
                "builder_badges": 0,
                "speaker_badges": 0,
                "winner_badges": 0,
                "total_score": 0,
                "average_score": 0,
                "reputation_points": 0,
                "reputation_level": "Newcomer",
                "last_updated": "",
            }

        profile["total_badges"] = int(profile.get("total_badges", 0)) + 1
        profile["events_attended"] = int(profile.get("events_attended", 0)) + 1
        profile["total_score"] = int(profile.get("total_score", 0)) + int(score)

        level_key = badge_level + "_badges"
        if level_key in profile:
            profile[level_key] = int(profile.get(level_key, 0)) + 1

        total_badges = int(profile.get("total_badges", 1))
        total_score = int(profile.get("total_score", 0))

        if total_badges > 0:
            profile["average_score"] = total_score // total_badges
        else:
            profile["average_score"] = 0

        current_points = int(profile.get("reputation_points", 0))
        profile["reputation_points"] = current_points + points_for_badge_level(badge_level)
        profile["reputation_level"] = reputation_level_from_points(
            int(profile.get("reputation_points", 0))
        )
        profile["last_updated"] = now_timestamp()

        self.user_profiles[wallet] = to_json(profile)

    @gl.public.view
    def get_user_profile(self, wallet: str) -> str:
        wallet = normalise_text(wallet)

        if wallet not in self.user_profiles:
            return to_json({
                "wallet": wallet,
                "total_badges": 0,
                "events_attended": 0,
                "attendee_badges": 0,
                "participant_badges": 0,
                "contributor_badges": 0,
                "builder_badges": 0,
                "speaker_badges": 0,
                "winner_badges": 0,
                "total_score": 0,
                "average_score": 0,
                "reputation_points": 0,
                "reputation_level": "Newcomer",
                "last_updated": "",
            })

        return self.user_profiles[wallet]

    # -----------------------------------------------------------------------
    # Manual review
    # -----------------------------------------------------------------------

    @gl.public.write
    def manual_review(
        self,
        submission_id: str,
        decision: str,
        badge_level: str,
        reason: str,
    ) -> None:
        assert submission_id in self.submissions, "Submission not found"

        decision = normalise_text(decision)
        badge_level = normalise_text(badge_level)
        reason = normalise_text(reason)

        assert decision in VALID_MANUAL_DECISIONS, "Decision must be approved or rejected"
        assert badge_level in VALID_BADGE_LEVELS, "Invalid badge level"
        assert reason != "", "Manual review reason required"
        assert_max_len(reason, MAX_REASON_LEN, "Manual review reason")

        submission = safe_json_loads(self.submissions[submission_id], {})
        assert submission.get("status") == "needs_manual_review", "Submission is not awaiting manual review"

        event_id = submission.get("event_id", "")
        assert event_id in self.events, "Event not found"

        event = safe_json_loads(self.events[event_id], {})
        assert event.get("organiser") == str(gl.message.sender_address), "Not organiser"

        if decision == "approved":
            assert badge_level != "none", "Approved submission needs badge level"
            submission["status"] = "approved"
            submission["verdict"] = "approved"
            submission["badge_level"] = badge_level

            if int(submission.get("score", 0)) < 60:
                submission["score"] = 60

            submission["verification_summary"] = (
                "The submission was approved after organiser manual review."
            )
        else:
            submission["status"] = "rejected"
            submission["verdict"] = "rejected"
            submission["badge_level"] = "none"
            submission["verification_summary"] = (
                "The submission was rejected after organiser manual review."
            )

        existing_reasons = submission.get("reasons", [])
        if not isinstance(existing_reasons, list):
            existing_reasons = [str(existing_reasons)]

        existing_reasons.append("Manual review: " + reason)

        submission["reasons"] = existing_reasons
        submission["reviewed_at"] = now_timestamp()

        self.submissions[submission_id] = to_json(submission)

        current_manual = int(event.get("total_manual_review", 0))
        if current_manual > 0:
            event["total_manual_review"] = current_manual - 1

        if decision == "approved":
            event["total_approved"] = int(event.get("total_approved", 0)) + 1
        else:
            event["total_rejected"] = int(event.get("total_rejected", 0)) + 1

        self.events[event_id] = to_json(event)