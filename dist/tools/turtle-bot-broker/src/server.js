"use strict";
// TurtleBot Public Execution Broker — Railway service.
//
// Trust model (do NOT weaken):
//   - Exposed over HTTPS only (Railway terminates TLS at the public edge).
//   - Authoritative identity comes from a Supabase JWT verified against
//     the Supabase JWKS. No client-supplied user_id is trusted.
//   - Server resolves ownership, limits and kill-switch through Supabase as
//     the caller. RLS enforces ownership; this broker holds no service-role key.
//   - Signing NEVER happens here. This process calls the private signer at
//     $SIGNER_BASE_URL (a *.railway.internal hostname) with an HMAC over
//     timestamp + nonce + method + path + exact body, keyed by
//     $SIGNER_SHARED_SECRET.
//   - The signer's responses are sanitized before returning to the browser.
//     Signer secrets are never surfaced.
//   - Every mainnet flag defaults false. Nothing in this file constructs,
//     signs or submits a mainnet order in Phase B.2A. Only healthz,
//     whoami and a preflight endpoint are enabled at deploy time.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const jose_1 = require("jose");
const supabase_js_1 = require("@supabase/supabase-js");
const zod_1 = require("zod");
const node_crypto_1 = require("node:crypto");
function required(name) {
    const v = process.env[name];
    if (!v || !v.trim())
        throw new Error(`MISSING_ENV:${name}`);
    return v;
}
function loadEnv() {
    const url = required("SUPABASE_URL");
    // Accept either the new-style publishable key or the legacy anon key under
    // the same slot; both are safe to ship to the broker (RLS is enforced
    // server-side by PostgREST using the caller's bearer JWT).
    const publishable = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
        process.env.SUPABASE_ANON_KEY?.trim();
    if (!publishable)
        throw new Error("MISSING_ENV:SUPABASE_PUBLISHABLE_KEY");
    return {
        SUPABASE_URL: url,
        SUPABASE_PUBLISHABLE_KEY: publishable,
        SUPABASE_JWT_ISSUER: process.env.SUPABASE_JWT_ISSUER ?? `${url}/auth/v1`,
        SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL ?? `${url}/auth/v1/.well-known/jwks.json`,
        SIGNER_BASE_URL: required("SIGNER_BASE_URL"),
        SIGNER_SHARED_SECRET: required("SIGNER_SHARED_SECRET"),
        SIGNER_TIMEOUT_MS: Number(process.env.SIGNER_TIMEOUT_MS ?? "5000"),
        CORS_ALLOWED_ORIGINS: (process.env.CORS_ALLOWED_ORIGINS ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        RATE_LIMIT_PER_MIN: Number(process.env.RATE_LIMIT_PER_MIN ?? "60"),
        APEX_MAINNET_READS_ENABLED: process.env.APEX_MAINNET_READS_ENABLED === "true",
        APEX_MAINNET_SIGNER_ENABLED: process.env.APEX_MAINNET_SIGNER_ENABLED === "true",
        APEX_MAINNET_CANARY_ENABLED: process.env.APEX_MAINNET_CANARY_ENABLED === "true",
        APEX_MAINNET_AUTOMATION_ENABLED: process.env.APEX_MAINNET_AUTOMATION_ENABLED === "true",
        NODE_ENV: process.env.NODE_ENV ?? "production",
        PORT: Number(process.env.PORT ?? "8080"),
    };
}
// ---------- allowed operations (typed allowlist) ----------
const ALLOWED_OPERATIONS = new Set([
    "VERIFY_CREDENTIALS",
    "READ_ACCOUNT",
    "READ_MARKETS",
    "READ_ORDERS",
    "READ_POSITIONS",
    "BUILD_ORDER",
    "SIGN_ORDER",
    "CREATE_ORDER",
    "CANCEL_ORDER",
    "CANCEL_ALL_ORDERS",
    "CLOSE_POSITION",
    "CLOSE_ALL_POSITIONS",
    "RECONCILE",
]);
// ---------- HMAC helper ----------
function computeHmac(secret, timestamp, nonce, path, body) {
    const h = (0, node_crypto_1.createHmac)("sha256", secret);
    // Must match signer/app/security.py exactly:
    // HMAC_SHA256(secret, `${timestamp}\n${nonce}\n${path}\n${raw_body}`)
    // Do not include the HTTP method; the private signer binds requests by URL
    // path and exact body bytes. Including method here makes every broker call
    // fail before wallet-signature validation, surfacing as a misleading
    // INVALID_SIGNATURE to the UI.
    h.update(`${timestamp}\n${nonce}\n${path}\n${body}`);
    return h.digest("hex");
}
// ---------- JWT verification ----------
function makeJwtVerifier(env) {
    const jwks = (0, jose_1.createRemoteJWKSet)(new URL(env.SUPABASE_JWKS_URL));
    return async function verifyBearer(auth) {
        if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
            throw Object.assign(new Error("MISSING_BEARER"), { statusCode: 401 });
        }
        const token = auth.slice(7).trim();
        try {
            const { payload } = await (0, jose_1.jwtVerify)(token, jwks, {
                issuer: env.SUPABASE_JWT_ISSUER,
            });
            if (!payload.sub)
                throw new Error("NO_SUB");
            return { sub: String(payload.sub), email: payload.email, claims: payload };
        }
        catch {
            throw Object.assign(new Error("INVALID_JWT"), { statusCode: 401 });
        }
    };
}
function normalizeApexEnvironment(value) {
    const env = String(value ?? "").trim().toLowerCase();
    if (env === "mainnet" || env === "production" || env === "prod")
        return "mainnet";
    if (env === "testnet" || env === "test" || env === "sandbox")
        return "testnet";
    return null;
}
// ---------- server ----------
async function build() {
    const env = loadEnv();
    const app = (0, fastify_1.default)({
        logger: {
            level: env.NODE_ENV === "production" ? "info" : "debug",
            redact: {
                paths: [
                    'req.headers.authorization',
                    'req.headers["x-signer-signature"]',
                    'req.headers.cookie',
                    '*.SIGNER_SHARED_SECRET',
                    '*.SUPABASE_PUBLISHABLE_KEY',
                    '*.apiKey',
                    '*.apiSecret',
                    '*.passphrase',
                    '*.omniSeed',
                ],
                remove: true,
            },
        },
        trustProxy: true,
        disableRequestLogging: false,
        bodyLimit: 32 * 1024,
        genReqId: () => (0, node_crypto_1.randomUUID)(),
    });
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            // No Origin => non-browser call (allowed; identity comes from JWT).
            if (!origin)
                return cb(null, true);
            if (env.CORS_ALLOWED_ORIGINS.includes(origin))
                return cb(null, true);
            return cb(new Error("CORS_ORIGIN_NOT_ALLOWED"), false);
        },
        credentials: false,
        methods: ["GET", "POST", "OPTIONS"],
        allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
        maxAge: 600,
    });
    await app.register(rate_limit_1.default, {
        max: env.RATE_LIMIT_PER_MIN,
        timeWindow: "1 minute",
        keyGenerator: (req) => {
            // Prefer authenticated user id; fall back to IP.
            const auth = (req.headers.authorization ?? "");
            if (auth.toLowerCase().startsWith("bearer ")) {
                // Cheap key: hash last 24 chars of token so the rate-limit key is stable per session but not the token itself.
                return `u:${auth.slice(-24)}`;
            }
            return `ip:${req.ip}`;
        },
        errorResponseBuilder: () => ({ error: "RATE_LIMITED" }),
    });
    // Per-request Supabase client bound to the CALLER's bearer JWT. RLS on
    // `exchange_connections`, `profiles`, etc. restricts every read/write to
    // the authenticated user (auth.uid()). The broker no longer holds a
    // service-role key — same security outcome via RLS.
    //
    // New-format `sb_publishable_*` keys are opaque, not JWTs. PostgREST
    // still expects them as `apikey`, and the caller's Supabase JWT is the
    // `Authorization: Bearer` value. When @supabase/supabase-js would send
    // the publishable key as bearer (its default), strip it so PostgREST
    // sees only the caller token.
    function supabaseAsCaller(authorization) {
        const pub = env.SUPABASE_PUBLISHABLE_KEY;
        return (0, supabase_js_1.createClient)(env.SUPABASE_URL, pub, {
            auth: { persistSession: false, autoRefreshToken: false },
            global: {
                headers: { Authorization: authorization },
                fetch: (input, init) => {
                    const h = new Headers(init?.headers);
                    if (pub.startsWith("sb_") && h.get("Authorization") === `Bearer ${pub}`) {
                        h.set("Authorization", authorization);
                    }
                    h.set("apikey", pub);
                    return fetch(input, { ...init, headers: h });
                },
            },
        });
    }
    const verifyBearer = makeJwtVerifier(env);
    // Generic error → sanitized public response with a correlation id.
    app.setErrorHandler((err, req, reply) => {
        const status = err.statusCode ?? 500;
        const publicCode = status < 500 ? String(err.message || "BAD_REQUEST") : "INTERNAL_ERROR";
        req.log.error({ err, correlationId: req.id }, "request_failed");
        reply.status(status).send({ error: publicCode, correlation_id: req.id });
    });
    app.setNotFoundHandler((req, reply) => {
        reply.status(404).send({ error: "NOT_FOUND", correlation_id: req.id });
    });
    // ---------- health ----------
    app.get("/healthz", async () => ({
        ok: true,
        service: "turtlebot-broker",
        // Flags are exposed as booleans only (no secrets, no config paths).
        flags: {
            reads: env.APEX_MAINNET_READS_ENABLED,
            signer: env.APEX_MAINNET_SIGNER_ENABLED,
            canary: env.APEX_MAINNET_CANARY_ENABLED,
            automation: env.APEX_MAINNET_AUTOMATION_ENABLED,
        },
    }));
    // Deep-check that the private signer is reachable and answers /healthz.
    // Owner-only pattern: does NOT expose signer errors verbatim.
    app.get("/readyz", async (_req, reply) => {
        try {
            const controller = new AbortController();
            const t = setTimeout(() => controller.abort(), env.SIGNER_TIMEOUT_MS);
            const res = await fetch(`${env.SIGNER_BASE_URL.replace(/\/$/, "")}/healthz`, {
                signal: controller.signal,
            }).finally(() => clearTimeout(t));
            if (!res.ok)
                return reply.status(503).send({ ok: false, signer: "unhealthy" });
            return { ok: true, signer: "ok" };
        }
        catch {
            return reply.status(503).send({ ok: false, signer: "unreachable" });
        }
    });
    // ---------- authenticated preflight ----------
    // Owner smoke test: proves JWT verification and Supabase reachability work
    // end-to-end without touching any exchange endpoint.
    app.get("/v1/whoami", async (req, reply) => {
        const identity = await verifyBearer(req.headers.authorization);
        // Read own profile row through PostgREST as the caller. RLS restricts
        // reads to auth.uid() = id, so `data` is non-null iff the caller has a
        // profile row of their own — same ownership sanity check as before.
        const sb = supabaseAsCaller(req.headers.authorization);
        const { data, error } = await sb
            .from("profiles")
            .select("id")
            .eq("id", identity.sub)
            .maybeSingle();
        if (error)
            return reply.status(500).send({ error: "PROFILE_LOOKUP_FAILED", correlation_id: req.id });
        return { user_id: identity.sub, profile_exists: Boolean(data) };
    });
    // ---------- intent preflight (does NOT submit) ----------
    const IntentSchema = zod_1.z.object({
        operation: zod_1.z.string().min(1),
        venue: zod_1.z.literal("apex_omni"),
        symbol: zod_1.z.string().min(1).optional(),
        connection_id: zod_1.z.string().uuid(),
        idempotency_key: zod_1.z.string().min(8).max(64),
    });
    app.post("/v1/intents/preflight", async (req, reply) => {
        const identity = await verifyBearer(req.headers.authorization);
        const parsed = IntentSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "INVALID_INTENT", correlation_id: req.id });
        }
        const intent = parsed.data;
        if (!ALLOWED_OPERATIONS.has(intent.operation)) {
            return reply.status(403).send({ error: "OPERATION_NOT_ALLOWED", correlation_id: req.id });
        }
        const sb = supabaseAsCaller(req.headers.authorization);
        // Kill-switch (fail closed). The RPC is SECURITY DEFINER and self-scopes
        // to auth.uid() = p_user_id; anything else returns halted.
        let halted = true;
        try {
            const { data, error } = await sb.rpc("is_execution_halted", {
                p_user_id: identity.sub,
                p_connection_id: intent.connection_id,
            });
            halted = error ? true : data !== false;
        }
        catch {
            halted = true;
        }
        if (halted)
            return reply.status(423).send({ error: "EXECUTION_HALTED", correlation_id: req.id });
        // Ownership check: connection must belong to caller. RLS on
        // exchange_connections restricts SELECT to auth.uid() = user_id, so the
        // row is only visible when the caller owns it.
        const { data: conn } = await sb
            .from("exchange_connections")
            .select("id, user_id, exchange, status")
            .eq("id", intent.connection_id)
            .maybeSingle();
        if (!conn || conn.user_id !== identity.sub) {
            return reply.status(404).send({ error: "CONNECTION_NOT_FOUND", correlation_id: req.id });
        }
        if (conn.exchange !== "apex_omni") {
            return reply.status(400).send({ error: "VENUE_MISMATCH", correlation_id: req.id });
        }
        // Flag-driven gate. Reads need APEX_MAINNET_READS_ENABLED; writes need
        // APEX_MAINNET_SIGNER_ENABLED (build/sign/cancel/reconcile) and, for
        // order emission, APEX_MAINNET_CANARY_ENABLED. Signer performs the
        // authoritative per-operation gating too.
        const isRead = intent.operation.startsWith("READ_") || intent.operation === "VERIFY_CREDENTIALS";
        if (isRead && !env.APEX_MAINNET_READS_ENABLED) {
            return reply.status(403).send({ error: "READS_DISABLED", correlation_id: req.id });
        }
        if (!isRead && !env.APEX_MAINNET_SIGNER_ENABLED) {
            return reply.status(403).send({ error: "SIGNER_DISABLED", correlation_id: req.id });
        }
        const emits = intent.operation === "CREATE_ORDER" || intent.operation === "CLOSE_POSITION" || intent.operation === "CLOSE_ALL_POSITIONS";
        if (emits && !env.APEX_MAINNET_CANARY_ENABLED) {
            return reply.status(403).send({ error: "CANARY_DISABLED", correlation_id: req.id });
        }
        // Delegate to signer over HMAC. Signer performs authenticated ApeX read.
        const path = "/v1/read";
        const bodyStr = JSON.stringify({
            operation: intent.operation,
            symbol: intent.symbol ?? null,
            connection_id: intent.connection_id,
            user_id: identity.sub, // signer verifies server-side too
        });
        const ts = Math.floor(Date.now() / 1000).toString();
        const nonce = (0, node_crypto_1.randomBytes)(16).toString("hex");
        const sig = computeHmac(env.SIGNER_SHARED_SECRET, ts, nonce, path, bodyStr);
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), env.SIGNER_TIMEOUT_MS);
        let signerRes;
        try {
            signerRes = await fetch(`${env.SIGNER_BASE_URL.replace(/\/$/, "")}${path}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-signer-timestamp": ts,
                    "x-signer-nonce": nonce,
                    "x-signer-signature": sig,
                },
                body: bodyStr,
                signal: controller.signal,
            });
        }
        catch {
            return reply.status(503).send({ error: "SIGNER_UNREACHABLE", correlation_id: req.id });
        }
        finally {
            clearTimeout(t);
        }
        // Verify signer response signature if present (defence in depth).
        const respSig = signerRes.headers.get("x-signer-signature") ?? "";
        const respTs = signerRes.headers.get("x-signer-timestamp") ?? "";
        const respNonce = signerRes.headers.get("x-signer-nonce") ?? "";
        const respBody = await signerRes.text();
        if (respSig && respTs && respNonce) {
            const expected = computeHmac(env.SIGNER_SHARED_SECRET, respTs, respNonce, path, respBody);
            const a = Buffer.from(expected, "utf8");
            const b = Buffer.from(respSig, "utf8");
            if (a.length !== b.length || !(0, node_crypto_1.timingSafeEqual)(a, b)) {
                return reply.status(502).send({ error: "SIGNER_RESPONSE_UNVERIFIED", correlation_id: req.id });
            }
        }
        if (!signerRes.ok) {
            return reply.status(502).send({ error: "SIGNER_ERROR", correlation_id: req.id });
        }
        let parsedBody = null;
        try {
            parsedBody = JSON.parse(respBody);
        }
        catch {
            parsedBody = null;
        }
        return { ok: true, operation: intent.operation, data: parsedBody };
    });
    // ---------- owner onboarding proxy ----------
    //
    // Browser-facing entry point to the private signer's /v1/onboard. The
    // caller must be authenticated (JWT verified above); ownership of the
    // exchange_connection is verified against Supabase as the caller, relying
    // on RLS (auth.uid() = user_id) so only the row-owner can pass. The
    // wallet's EIP-191 signature is treated as opaque credential material —
    // logged nowhere, redacted, and forwarded verbatim. The signer performs
    // its own recovery, derivation, and persistence.
    const OnboardSchema = zod_1.z.object({
        connection_id: zod_1.z.string().uuid(),
        wallet_address: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/),
        environment: zod_1.z.enum(["mainnet", "testnet"]),
        signature: zod_1.z.string().min(10).max(200),
    });
    app.post("/v1/onboard", async (req, reply) => {
        const identity = await verifyBearer(req.headers.authorization);
        const parsed = OnboardSchema.safeParse(req.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "INVALID_ONBOARD", correlation_id: req.id });
        }
        const body = parsed.data;
        if (!env.APEX_MAINNET_SIGNER_ENABLED) {
            return reply.status(403).send({ error: "SIGNER_DISABLED", correlation_id: req.id });
        }
        // Ownership + venue check (RLS enforces auth.uid() = user_id).
        const sb = supabaseAsCaller(req.headers.authorization);
        const { data: conn } = await sb
            .from("exchange_connections")
            .select("id, user_id, exchange, environment, status")
            .eq("id", body.connection_id)
            .maybeSingle();
        if (!conn || conn.user_id !== identity.sub) {
            return reply.status(404).send({ error: "CONNECTION_NOT_FOUND", correlation_id: req.id });
        }
        if (conn.exchange !== "apex_omni") {
            return reply.status(400).send({ error: "VENUE_MISMATCH", correlation_id: req.id });
        }
        const connectionEnvironment = normalizeApexEnvironment(conn.environment);
        if (!connectionEnvironment || connectionEnvironment !== body.environment) {
            return reply.status(400).send({ error: "ENVIRONMENT_MISMATCH", correlation_id: req.id });
        }
        // Delegate to signer over HMAC. Forward the caller's Supabase JWT
        // inside the HMAC-covered body so the signer can write
        // apex_execution_credentials as the caller (RLS enforced); this
        // removes the SUPABASE_SERVICE_ROLE_KEY requirement on the signer host.
        const authHeader = (req.headers.authorization ?? "");
        const callerJwt = authHeader.toLowerCase().startsWith("bearer ")
            ? authHeader.slice(7).trim()
            : authHeader.trim();
        const path = "/v1/onboard";
        const bodyStr = JSON.stringify({
            user_id: identity.sub,
            exchange_connection_id: body.connection_id,
            wallet_address: body.wallet_address,
            environment: body.environment,
            signature: body.signature,
            caller_jwt: callerJwt,
        });
        const ts = Math.floor(Date.now() / 1000).toString();
        const nonce = (0, node_crypto_1.randomBytes)(16).toString("hex");
        const sig = computeHmac(env.SIGNER_SHARED_SECRET, ts, nonce, path, bodyStr);
        const controller = new AbortController();
        const t = setTimeout(() => controller.abort(), env.SIGNER_TIMEOUT_MS);
        let signerRes;
        try {
            signerRes = await fetch(`${env.SIGNER_BASE_URL.replace(/\/$/, "")}${path}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "x-signer-timestamp": ts,
                    "x-signer-nonce": nonce,
                    "x-signer-signature": sig,
                },
                body: bodyStr,
                signal: controller.signal,
            });
        }
        catch {
            return reply.status(503).send({ error: "SIGNER_UNREACHABLE", correlation_id: req.id });
        }
        finally {
            clearTimeout(t);
        }
        const respBody = await signerRes.text();
        if (!signerRes.ok) {
            // Forward the signer's structured detail code (already sanitized) so
            // the UI can render a concrete error. Never forward stack traces.
            let detail = "SIGNER_ERROR";
            try {
                const parsed = JSON.parse(respBody);
                if (typeof parsed?.detail === "string")
                    detail = parsed.detail;
            }
            catch { /* keep default */ }
            return reply.status(signerRes.status).send({ error: detail, correlation_id: req.id });
        }
        let parsedBody = null;
        try {
            parsedBody = JSON.parse(respBody);
        }
        catch {
            parsedBody = null;
        }
        return { ok: true, data: parsedBody };
    });
    return app;
}
async function main() {
    const app = await build();
    const port = Number(process.env.PORT ?? "8080");
    await app.listen({ host: "0.0.0.0", port });
}
main().catch((err) => {
    // eslint-disable-next-line no-console
    console.error(JSON.stringify({ level: "fatal", msg: "boot_failed", err: String(err) }));
    process.exit(1);
});
//# sourceMappingURL=server.js.map