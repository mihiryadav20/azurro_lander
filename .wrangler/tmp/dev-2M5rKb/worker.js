var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// server/lead.ts
var FINAL_STEP = 8;
var SELECT_FIELDS = {
  centres: {
    field: "Centres",
    allowed: ["1", "2 to 5", "6 to 15", "More than 15"]
  },
  grounds: {
    field: "Grounds",
    allowed: ["Under 10", "10 to 25", "26 to 50", "More than 50"]
  },
  onsite: {
    field: "On site",
    allowed: [
      "Every day",
      "A few times a week",
      "Rarely",
      "Managers run them for me"
    ]
  },
  booking: {
    field: "Booking method",
    allowed: ["Notebook or register", "WhatsApp", "Excel", "Booking software"]
  },
  payment: {
    field: "Payment",
    allowed: ["Mostly cash", "Cash and UPI about equal", "Mostly UPI or online"]
  },
  cctv: {
    field: "CCTV",
    allowed: ["Yes, all of them", "Some grounds", "No cameras yet"]
  },
  location: {
    field: "Location",
    allowed: ["Navi Mumbai", "Mumbai", "Pune", "Bangalore", "Delhi NCR", "Other"]
  }
};
var TEXT_FIELDS = {
  otherCity: { field: "Other city", max: 100 },
  name: { field: "Name", max: 200 },
  phone: { field: "Phone", max: 40 },
  business: { field: "Business", max: 200 },
  whyNow: { field: "Why now", max: 2e3 }
};
var RAW_MAX = 1e4;
var BODY_MAX = 16e3;
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" }
  });
}
__name(json, "json");
function buildFields(body, step) {
  const fields = {
    "Session ID": body.sessionId,
    Submitted: (/* @__PURE__ */ new Date()).toISOString(),
    "Last step": step
  };
  for (const [key, spec] of Object.entries(SELECT_FIELDS)) {
    const value = body[key];
    if (typeof value !== "string") continue;
    if (!spec.allowed.includes(value)) continue;
    fields[spec.field] = value;
  }
  for (const [key, spec] of Object.entries(TEXT_FIELDS)) {
    const value = body[key];
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    fields[spec.field] = trimmed.slice(0, spec.max);
  }
  fields.Raw = JSON.stringify(body).slice(0, RAW_MAX);
  if (step >= FINAL_STEP) fields.Status = "New";
  return fields;
}
__name(buildFields, "buildFields");
function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(escapeHtml, "escapeHtml");
function summarise(fields) {
  const esc = /* @__PURE__ */ __name((v) => escapeHtml(v), "esc");
  const pair = /* @__PURE__ */ __name((label, value) => value ? `${label}: ${esc(value)}` : void 0, "pair");
  const join = /* @__PURE__ */ __name((...parts) => parts.filter(Boolean).join(" \xB7 "), "join");
  const location = fields.Location === "Other" && fields["Other city"] ? `${esc(fields.Location)} (${esc(fields["Other city"])})` : fields.Location ? esc(fields.Location) : void 0;
  const nameLine = join(
    fields.Name ? `<b>${esc(fields.Name)}</b>` : void 0,
    fields.Business ? esc(fields.Business) : void 0
  );
  const groundsLine = join(pair("Centres", fields.Centres), pair("Grounds", fields.Grounds));
  const opsLine = join(
    pair("Booking", fields["Booking method"]),
    pair("Payment", fields.Payment),
    pair("CCTV", fields.CCTV)
  );
  const lines = [
    "\u{1F3AF} New Azurro lead",
    "",
    nameLine || void 0,
    fields.Phone ? `\u{1F4DE} ${esc(fields.Phone)}` : void 0,
    location ? `\u{1F4CD} ${location}` : void 0,
    "",
    groundsLine || void 0,
    fields["On site"] ? pair("On site", fields["On site"]) : void 0,
    opsLine || void 0,
    fields["Why now"] ? `
\u201C${esc(fields["Why now"])}\u201D` : void 0
  ].filter((l) => l !== void 0);
  return lines.join("\n");
}
__name(summarise, "summarise");
async function handleLead(request, env, ctx) {
  if (request.method !== "POST") {
    return json(405, { error: "method not allowed" });
  }
  const token = env.AIRTABLE_TOKEN;
  const base = env.AIRTABLE_BASE;
  const table = env.AIRTABLE_TABLE;
  if (!token || !base || !table) {
    console.error("lead: missing AIRTABLE_TOKEN / AIRTABLE_BASE / AIRTABLE_TABLE");
    return json(500, { error: "not configured" });
  }
  const raw = await request.text();
  if (raw.length > BODY_MAX) return json(413, { error: "body too large" });
  let body;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    body = parsed;
  } catch {
    return json(400, { error: "invalid json" });
  }
  const sessionId = body.sessionId;
  if (typeof sessionId !== "string" || !UUID_RE.test(sessionId)) {
    return json(400, { error: "invalid sessionId" });
  }
  const stepValue = body.step;
  const step = typeof stepValue === "number" && Number.isInteger(stepValue) ? stepValue : 0;
  if (step < 1 || step > FINAL_STEP) {
    return json(400, { error: "invalid step" });
  }
  const fields = buildFields(body, step);
  const res = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(base)}/${encodeURIComponent(table)}`,
    {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        performUpsert: { fieldsToMergeOn: ["Session ID"] },
        typecast: false,
        records: [{ fields }]
      })
    }
  );
  if (!res.ok) {
    console.error("lead: airtable", res.status, await res.text());
    return json(502, { error: "upstream error" });
  }
  if (step >= FINAL_STEP && env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    const ping = fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: summarise(fields),
          parse_mode: "HTML"
        })
      }
    ).catch((e) => {
      console.error("lead: telegram notify failed", e);
    });
    if (ctx) ctx.waitUntil(ping);
  }
  return json(200, { ok: true });
}
__name(handleLead, "handleLead");

// src/worker.ts
var WINDOW_MS = 6e4;
var MAX_PER_WINDOW = 30;
var hits = /* @__PURE__ */ new Map();
function rateLimited(ip, now) {
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5e3) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_PER_WINDOW;
}
__name(rateLimited, "rateLimited");
var worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/lead") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "method not allowed" }), {
          status: 405,
          headers: { "content-type": "application/json", allow: "POST" }
        });
      }
      const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
      if (rateLimited(ip, Date.now())) {
        return new Response(JSON.stringify({ error: "rate limited" }), {
          status: 429,
          headers: { "content-type": "application/json", "retry-after": "60" }
        });
      }
      return handleLead(request, env, ctx);
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../../../opt/homebrew/Cellar/cloudflare-wrangler/4.107.0/libexec/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../opt/homebrew/Cellar/cloudflare-wrangler/4.107.0/libexec/lib/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-68jrbk/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../opt/homebrew/Cellar/cloudflare-wrangler/4.107.0/libexec/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-68jrbk/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
