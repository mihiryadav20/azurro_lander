/**
 * Worker entry point. Only /api/lead is routed here (see wrangler.jsonc's
 * assets.run_worker_first) — every other request is served directly from
 * the assets binding without invoking this script.
 *
 * The lead-handling logic itself lives in server/lead.ts, written against
 * plain Request/Response so it does not care which runtime adapter calls it.
 */
import { handleLead, type LeadEnv } from "../server/lead"

interface Fetcher {
  fetch(request: Request): Promise<Response>
}

interface Env extends LeadEnv {
  ASSETS: Fetcher
}

interface ExecutionContext {
  waitUntil(p: Promise<unknown>): void
}

/**
 * Per-isolate token bucket. This is a speed bump, not the control: isolates
 * are short-lived and per-colo, so a determined caller routed through
 * several colos gets a fresh bucket each time. The real limit belongs on a
 * Cloudflare WAF Rate Limiting Rule for /api/lead. This just blunts the
 * cheapest abuse before it reaches Airtable and burns quota.
 */
const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 30
const hits = new Map<string, { count: number; resetAt: number }>()

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip)
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key)
    }
    return false
  }
  entry.count += 1
  return entry.count > MAX_PER_WINDOW
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method not allowed" }), {
          status: 405,
          headers: { "content-type": "application/json", allow: "POST" },
        })
      }

      const ip = request.headers.get("cf-connecting-ip") ?? "unknown"
      if (rateLimited(ip, Date.now())) {
        return new Response(JSON.stringify({ error: "rate limited" }), {
          status: 429,
          headers: { "content-type": "application/json", "retry-after": "60" },
        })
      }

      return handleLead(request, env, ctx)
    }

    // Anything that reaches the Worker outside of run_worker_first's match
    // (there shouldn't be any) still falls through to static assets rather
    // than 404ing from here.
    return env.ASSETS.fetch(request)
  },
}
