/**
 * Cloudflare Pages Function: POST /api/lead
 *
 * Thin adapter. All the logic lives in server/lead.ts against plain
 * Request/Response, so moving to a Next.js route handler or a Vercel/Netlify
 * edge function means rewriting this file only.
 */
import { handleLead, type LeadEnv } from "../../server/lead"

interface PagesContext {
  request: Request
  env: LeadEnv
  waitUntil(p: Promise<unknown>): void
}

/**
 * Per-isolate token bucket. This is a speed bump, not the control: isolates are
 * per-colo and short-lived, so a determined caller routed through several colos
 * gets a fresh bucket each time. The real limit is a Cloudflare WAF Rate
 * Limiting Rule on /api/lead — see README. This just blunts the cheapest abuse
 * before it reaches Airtable and burns quota.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    // Opportunistic sweep so an isolate that lives a long time cannot grow this
    // map without bound.
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key)
    }
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

export const onRequestPost = async (ctx: PagesContext): Promise<Response> => {
  const ip = ctx.request.headers.get("cf-connecting-ip") ?? "unknown"
  if (rateLimited(ip, Date.now())) {
    return new Response(JSON.stringify({ error: "rate limited" }), {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    })
  }
  return handleLead(ctx.request, ctx.env, ctx)
}

/** Anything other than POST on this path. */
export const onRequest = async (): Promise<Response> =>
  new Response(JSON.stringify({ error: "method not allowed" }), {
    status: 405,
    headers: { "content-type": "application/json", allow: "POST" },
  })
