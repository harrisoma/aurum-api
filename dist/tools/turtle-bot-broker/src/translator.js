"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pilotAllocation = pilotAllocation;
exports.pilotLeverage = pilotLeverage;
exports.translateDirective = translateDirective;
/**
 * BROKER DIRECTIVE TRANSLATOR — dry-run + pilot-sized.
 *
 * Pure, deterministic. Given a strategy directive (from the paper engine or
 * live worker) and the caller's current equity + venue caps, translate it
 * into the exchange-shaped intent the broker WOULD submit — WITHOUT any
 * signing or network call. In dry-run mode this is what `POST
 * /v1/directives/translate` returns; the same function is called
 * server-side in live mode and its output is then submitted.
 *
 * SAFETY:
 *   - This module NEVER calls the signer, exchange, or DB.
 *   - Leverage is clamped to `pilot.max_leverage` regardless of what the
 *     caller requested or what the venue allows.
 *   - Sizing is clamped by `pilot_allocation(equity)` — a value at or below
 *     the reserve floor produces size=0 (the broker refuses to translate).
 *   - Only the whitelist of directive types from `enums.directive_types`
 *     is honored. Unknown types return { ok:false, reason:'unknown_directive' }.
 */
const parityConstants_1 = __importDefault(require("./parityConstants"));
const PILOT = parityConstants_1.default.pilot;
const DIRECTIVE_TYPES = parityConstants_1.default.enums.directive_types;
function pilotAllocation(equityUsd) {
    if (!Number.isFinite(equityUsd))
        return 0;
    if (equityUsd <= PILOT.allocation_reserve_floor_usd)
        return 0;
    return Math.min(equityUsd - PILOT.allocation_reserve_floor_usd, PILOT.allocation_ceiling_usd);
}
function pilotLeverage(requested) {
    const r = Number.isFinite(requested) ? Math.floor(requested) : PILOT.max_leverage;
    return Math.max(1, Math.min(r, PILOT.max_leverage));
}
const REDUCE_ONLY_TYPES = new Set([
    "cancel_unfilled_rungs",
    "close_position",
    "cancel_fixed_tp",
    "set_breakeven_stop",
    "repair_stop",
]);
const EMIT_ORDER_TYPES = new Set([
    "close_position",
    "set_breakeven_stop",
    "repair_stop",
]);
function translateDirective(input) {
    if (!DIRECTIVE_TYPES.includes(input.directive_type)) {
        return { ok: false, reason: "unknown_directive", detail: String(input.directive_type) };
    }
    if (input.side !== "long" && input.side !== "short") {
        return { ok: false, reason: "invalid_side", detail: String(input.side) };
    }
    if (!Number.isFinite(input.equity_usd)) {
        return { ok: false, reason: "invalid_equity" };
    }
    const alloc = pilotAllocation(input.equity_usd);
    if (alloc <= 0) {
        return { ok: false, reason: "no_pilot_allocation" };
    }
    const lev = pilotLeverage(input.requested_leverage);
    if (lev < 1)
        return { ok: false, reason: "invalid_leverage" };
    const notes = [];
    if (input.requested_leverage > PILOT.max_leverage) {
        notes.push(`leverage clamped from ${input.requested_leverage} to ${lev} (pilot ceiling)`);
    }
    const notional = alloc * lev;
    const reduceOnly = REDUCE_ONLY_TYPES.has(input.directive_type);
    const emit = EMIT_ORDER_TYPES.has(input.directive_type);
    return {
        ok: true,
        dry_run: true,
        directive_type: input.directive_type,
        symbol: input.symbol,
        side: input.side,
        effective_leverage: lev,
        allocation_usd: alloc,
        notional_usd: notional,
        reduce_only: reduceOnly,
        intended_stop: input.intended_stop ?? null,
        emit,
        notes,
    };
}
//# sourceMappingURL=translator.js.map