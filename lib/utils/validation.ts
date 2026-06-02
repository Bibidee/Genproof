import { LIMITS } from "./constants";

export function validateEventForm(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const title = String(data.title ?? "").trim();
  const description = String(data.description ?? "").trim();
  const badgeName = String(data.badge_name ?? "").trim();
  const badgeImage = String(data.badge_image ?? "").trim();
  const proofQuestion = String(data.proof_question ?? "").trim();

  if (title.length < 3) errors.push("Event title must be at least 3 characters");
  if (title.length > LIMITS.TITLE)
    errors.push(`Event title must be ${LIMITS.TITLE} characters or fewer`);

  if (description.length < 10) errors.push("Description must be at least 10 characters");
  if (description.length > LIMITS.DESCRIPTION)
    errors.push(`Description must be ${LIMITS.DESCRIPTION} characters or fewer`);

  if (badgeName.length < 2) errors.push("Badge name is required");
  if (badgeName.length > LIMITS.BADGE_NAME)
    errors.push(`Badge name must be ${LIMITS.BADGE_NAME} characters or fewer`);

  if (badgeImage.length > LIMITS.BADGE_IMAGE)
    errors.push(`Badge image URL must be ${LIMITS.BADGE_IMAGE} characters or fewer`);

  if (proofQuestion.length < 10) errors.push("Proof question must be at least 10 characters");
  if (proofQuestion.length > LIMITS.PROOF_QUESTION)
    errors.push(`Proof question must be ${LIMITS.PROOF_QUESTION} characters or fewer`);

  if (!data.start_date) errors.push("Start date is required");
  if (!data.end_date) errors.push("End date is required");
  if (!data.claim_deadline) errors.push("Claim deadline is required");

  // Date ordering — contract enforces end >= start
  if (data.start_date && data.end_date) {
    const s = new Date(String(data.start_date)).getTime();
    const e = new Date(String(data.end_date)).getTime();
    if (Number.isFinite(s) && Number.isFinite(e) && e < s) {
      errors.push("End date must be on or after start date");
    }
  }

  return errors;
}

export function validateProofForm(data: Record<string, unknown>): string[] {
  const errors: string[] = [];

  const reflection = String(data.reflection ?? "").trim();
  const quiz1 = String(data.quiz_answer_1 ?? "");
  const quiz2 = String(data.quiz_answer_2 ?? "");
  const eventCode = String(data.event_code ?? "");
  const proofLink = String(data.proof_link ?? "");
  const projectLink = String(data.project_link ?? "");

  if (reflection.length < LIMITS.REFLECTION_MIN)
    errors.push(`Your reflection must be at least ${LIMITS.REFLECTION_MIN} characters`);
  if (reflection.length > LIMITS.REFLECTION_MAX)
    errors.push(`Your reflection must be ${LIMITS.REFLECTION_MAX} characters or fewer`);

  if (quiz1.length > LIMITS.QUIZ_ANSWER)
    errors.push(`Quiz answer 1 must be ${LIMITS.QUIZ_ANSWER} characters or fewer`);
  if (quiz2.length > LIMITS.QUIZ_ANSWER)
    errors.push(`Quiz answer 2 must be ${LIMITS.QUIZ_ANSWER} characters or fewer`);

  if (eventCode.length > LIMITS.EVENT_CODE)
    errors.push(`Event code must be ${LIMITS.EVENT_CODE} characters or fewer`);

  if (proofLink.length > LIMITS.LINK)
    errors.push(`Proof link must be ${LIMITS.LINK} characters or fewer`);
  if (projectLink.length > LIMITS.LINK)
    errors.push(`Project link must be ${LIMITS.LINK} characters or fewer`);

  return errors;
}
