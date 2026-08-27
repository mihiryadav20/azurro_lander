/**
 * Lead capture for the demo quiz.
 *
 * Written against the Web platform (Request/Response/fetch) rather than any one
 * framework, so the runtime adapter is the only part that changes: Cloudflare
 * Pages Functions today (functions/api/lead.ts), a Next.js route handler or a
 * Vercel/Netlify edge function without touching this file.
 *
 * The quiz posts here after every step advance rather than once at the end, so
 * an abandoned quiz still leaves a row with whatever was answered.
 */

export interface LeadEnv {
  AIRTABLE_TOKEN?: string
  AIRTABLE_BASE?: string
  AIRTABLE_TABLE?: string
  /** Optional, independently. Either unset means no Telegram message is sent. */
  TELEGRAM_BOT_TOKEN?: string
  TELEGRAM_CHAT_ID?: string
}

/** Highest step the quiz can report: 7 questions + the contact step. */
const FINAL_STEP = 8

/**
 * Airtable silently invents new single-select options when typecast is on, so
 * every select value is checked against its column's real options here and
 * dropped if it does not match. `typecast: false` below is the second lock on
 * the same door.
 */
const SELECT_FIELDS = {
  centres: {
    field: "Centres",
    allowed: ["1", "2 to 5", "6 to 15", "More than 15"],
  },
  grounds: {
    field: "Grounds",
    allowed: ["Under 10", "10 to 25", "26 to 50", "More than 50"],
  },
  onsite: {
    field: "On site",
    allowed: [
      "Every day",
      "A few times a week",
      "Rarely",
      "Managers run them for me",
    ],
  },
  booking: {
    field: "Booking method",
    allowed: ["Notebook or register", "WhatsApp", "Excel", "Booking software"],
  },
  payment: {
    field: "Payment",
    allowed: ["Mostly cash", "Cash and UPI about equal", "Mostly UPI or online"],
  },
  cctv: {
    field: "CCTV",
    allowed: ["Yes, all of them", "Some grounds", "No cameras yet"],
  },
  location: {
    field: "Location",
    allowed: ["Navi Mumbai", "Mumbai", "Pune", "Bangalore", "Delhi NCR", "Other"],
  },
} as const satisfies Record<string, { field: string; allowed: readonly string[] }>

/** Free-text columns, with the cap applied before anything is sent upstream. */
const TEXT_FIELDS = {
  otherCity: { field: "Other city", max: 100 },
  name: { field: "Name", max: 200 },
  phone: { field: "Phone", max: 40 },
  business: { field: "Business", max: 200 },
  whyNow: { field: "Why now", max: 2000 },
} as const satisfies Record<string, { field: string; max: number }>

const RAW_MAX = 10_000
const BODY_MAX = 16_000

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Fields = Record<string, string | number>

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

/**
 * Builds the Airtable field payload from one request body.
 *
 * Only keys actually present in the body become fields. A partial save must
 * never blank out an answer an earlier save already stored, which is why this
 * omits missing keys rather than sending "" for them.
 */
export function buildFields(body: Record<string, unknown>, step: number): Fields {
  const fields: Fields = {
    "Session ID": body.sessionId as string,
    Submitted: new Date().toISOString(),
    "Last step": step,
  }

  for (const [key, spec] of Object.entries(SELECT_FIELDS)) {
    const value = body[key]
    if (typeof value !== "string") continue
    if (!(spec.allowed as readonly string[]).includes(value)) continue
    fields[spec.field] = value
  }

  for (const [key, spec] of Object.entries(TEXT_FIELDS)) {
    const value = body[key]
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed) continue
    fields[spec.field] = trimmed.slice(0, spec.max)
  }

  // Raw keeps the untouched payload so anything the mapping above drops — a
  // renamed option, a field added to the quiz but not yet to this file — is
  // still recoverable from the row by hand.
  fields.Raw = JSON.stringify(body).slice(0, RAW_MAX)

  // Status is owned by whoever works the lead once it is set. The route writes
  // it exactly once, on completion, and never again — a partial save that
  // reached step 8 earlier would otherwise stomp a human's "Contacted".
  if (step >= FINAL_STEP) fields.Status = "New"

  return fields
}

/** Telegram parse_mode is HTML, so free-typed values must be escaped before
 * going anywhere near a tag — the "Why now" box especially is unrestricted
 * user text. */
function escapeHtml(value: string | number): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

/** Multi-line HTML-formatted message for the Telegram notification. */
function summarise(fields: Fields): string {
  const esc = (v: unknown) => escapeHtml(v as string | number)
  // Pairs a value with its own label only where the value alone would be
  // ambiguous — an emoji already tells you a phone number is a phone number.
  const pair = (label: string, value: unknown) =>
    value ? `${label}: ${esc(value)}` : undefined
  const join = (...parts: unknown[]) => parts.filter(Boolean).join(" · ")

  const location =
    fields.Location === "Other" && fields["Other city"]
      ? `${esc(fields.Location)} (${esc(fields["Other city"])})`
      : fields.Location
        ? esc(fields.Location)
        : undefined

  const nameLine = join(
    fields.Name ? `<b>${esc(fields.Name)}</b>` : undefined,
    fields.Business ? esc(fields.Business) : undefined
  )
  const groundsLine = join(pair("Centres", fields.Centres), pair("Grounds", fields.Grounds))
  const opsLine = join(
    pair("Booking", fields["Booking method"]),
    pair("Payment", fields.Payment),
    pair("CCTV", fields.CCTV)
  )

  const lines = [
    "🎯 New Azurro lead",
    "",
    nameLine || undefined,
    fields.Phone ? `📞 ${esc(fields.Phone)}` : undefined,
    location ? `📍 ${location}` : undefined,
    "",
    groundsLine || undefined,
    fields["On site"] ? pair("On site", fields["On site"]) : undefined,
    opsLine || undefined,
    fields["Why now"] ? `\n“${esc(fields["Why now"])}”` : undefined,
  ].filter((l) => l !== undefined)

  return lines.join("\n")
}

export async function handleLead(
  request: Request,
  env: LeadEnv,
  ctx?: { waitUntil(p: Promise<unknown>): void }
): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { error: "method not allowed" })
  }

  const token = env.AIRTABLE_TOKEN
  const base = env.AIRTABLE_BASE
  const table = env.AIRTABLE_TABLE
  if (!token || !base || !table) {
    // Config problem, not a caller problem — say so in the log, not the body.
    console.error("lead: missing AIRTABLE_TOKEN / AIRTABLE_BASE / AIRTABLE_TABLE")
    return json(500, { error: "not configured" })
  }

  const raw = await request.text()
  if (raw.length > BODY_MAX) return json(413, { error: "body too large" })

  let body: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object")
    }
    body = parsed as Record<string, unknown>
  } catch {
    return json(400, { error: "invalid json" })
  }

  const sessionId = body.sessionId
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    return json(400, { error: "invalid sessionId" })
  }

  const stepValue = body.step
  const step =
    typeof stepValue === "number" && Number.isInteger(stepValue) ? stepValue : 0
  if (step < 1 || step > FINAL_STEP) {
    return json(400, { error: "invalid step" })
  }

  const fields = buildFields(body, step)

  // fieldsToMergeOn makes this an upsert on Session ID: the first call for a
  // session creates the row, every later call updates that same row instead of
  // piling up one row per step.
  const res = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ["Session ID"] },
        typecast: false,
        records: [{ fields }],
      }),
    }
  )

  if (!res.ok) {
    console.error("lead: airtable", res.status, await res.text())
    return json(502, { error: "upstream error" })
  }

  if (step >= FINAL_STEP && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    // Fire-and-forget: a dead Telegram call must never cost the visitor their
    // submission, so the result is neither awaited nor allowed to reject.
    const ping = fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: summarise(fields),
          parse_mode: "HTML",
        }),
      }
    ).catch((e: unknown) => {
      console.error("lead: telegram notify failed", e)
    })
    if (ctx) ctx.waitUntil(ping)
  }

  return json(200, { ok: true })
}
