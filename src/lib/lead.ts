/**
 * Posts quiz progress to /api/lead after every step advance, so a quiz that is
 * abandoned halfway still leaves a usable row.
 *
 * Every call sends the whole set of answers collected so far, not just the new
 * one: the route upserts on Session ID, so a request lost to a flaky connection
 * is repaired by the next step rather than leaving a permanent hole.
 */

/** Quiz answers keyed the way QuizModal holds them. */
export interface LeadAnswers {
  centres?: string
  grounds?: string
  presence?: string
  records?: string
  pay?: string
  cctv?: string
  /** The picked option label, including "Other (enter city)". */
  where?: string
  /** Free-text city, only meaningful when `where` is the Other option. */
  otherCity?: string
  name?: string
  phone?: string
  business?: string
  why?: string
}

export const OTHER_CITY_LABEL = "Other (enter city)"

/**
 * Maps QuizModal's internal keys onto the wire contract the route expects.
 * The two vocabularies differ on purpose — the quiz names steps after what it
 * asks, the table names columns after what they hold.
 */
function toPayload(sessionId: string, step: number, a: LeadAnswers) {
  const isOther = a.where === OTHER_CITY_LABEL
  return {
    sessionId,
    step,
    centres: a.centres,
    grounds: a.grounds,
    onsite: a.presence,
    booking: a.records,
    payment: a.pay,
    cctv: a.cctv,
    // The table stores a plain "Other" in the select and the typed city beside
    // it, rather than the quiz's longer button label.
    location: isOther ? "Other" : a.where,
    otherCity: isOther ? a.otherCity : undefined,
    name: a.name,
    phone: a.phone,
    business: a.business,
    whyNow: a.why,
  }
}

/**
 * Fire-and-forget. A failed save must never block the quiz or surface an error
 * to someone who is midway through answering — the lead is worth more than the
 * telemetry, and the next step's call will carry the same answers again.
 */
export function saveLead(
  sessionId: string,
  step: number,
  answers: LeadAnswers
): void {
  const payload = toPayload(sessionId, step, answers)
  const body = JSON.stringify(payload)

  void fetch("/api/lead", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    // Lets the final step's save survive the tab being closed right after.
    keepalive: true,
  }).catch(() => {
    // Intentionally silent in production; the quiz carries on regardless.
    if (import.meta.env.DEV) console.warn("lead save failed", payload)
  })
}
