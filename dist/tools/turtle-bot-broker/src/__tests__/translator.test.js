"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const translator_1 = require("../translator");
const mainnet_parity_constants_json_1 = __importDefault(require("../../../shared/mainnet_parity_constants.json"));
const PILOT = mainnet_parity_constants_json_1.default.pilot;
(0, vitest_1.describe)("broker/translator: pilot sizing", () => {
    (0, vitest_1.it)("returns zero allocation at or below the reserve floor", () => {
        (0, vitest_1.expect)((0, translator_1.pilotAllocation)(0)).toBe(0);
        (0, vitest_1.expect)((0, translator_1.pilotAllocation)(PILOT.allocation_reserve_floor_usd)).toBe(0);
        (0, vitest_1.expect)((0, translator_1.pilotAllocation)(PILOT.allocation_reserve_floor_usd + 50)).toBe(50);
    });
    (0, vitest_1.it)("caps at the ceiling", () => {
        const big = PILOT.allocation_reserve_floor_usd + PILOT.allocation_ceiling_usd + 9999;
        (0, vitest_1.expect)((0, translator_1.pilotAllocation)(big)).toBe(PILOT.allocation_ceiling_usd);
    });
    (0, vitest_1.it)("clamps requested leverage", () => {
        (0, vitest_1.expect)((0, translator_1.pilotLeverage)(1)).toBe(1);
        (0, vitest_1.expect)((0, translator_1.pilotLeverage)(PILOT.max_leverage + 50)).toBe(PILOT.max_leverage);
        (0, vitest_1.expect)((0, translator_1.pilotLeverage)(-3)).toBe(1);
    });
});
(0, vitest_1.describe)("broker/translator: translateDirective", () => {
    const base = {
        directive_type: "close_position",
        symbol: "BTC-USDT",
        side: "long",
        connection_id: "00000000-0000-0000-0000-000000000000",
        requested_leverage: 100,
        equity_usd: 1000,
    };
    (0, vitest_1.it)("rejects unknown directive types", () => {
        const r = (0, translator_1.translateDirective)({ ...base, directive_type: "yolo_moon" });
        (0, vitest_1.expect)(r.ok).toBe(false);
        if (!r.ok)
            (0, vitest_1.expect)(r.reason).toBe("unknown_directive");
    });
    (0, vitest_1.it)("rejects invalid side", () => {
        const r = (0, translator_1.translateDirective)({ ...base, side: "sideways" });
        (0, vitest_1.expect)(r.ok).toBe(false);
        if (!r.ok)
            (0, vitest_1.expect)(r.reason).toBe("invalid_side");
    });
    (0, vitest_1.it)("rejects equity at the reserve floor", () => {
        const r = (0, translator_1.translateDirective)({ ...base, equity_usd: PILOT.allocation_reserve_floor_usd });
        (0, vitest_1.expect)(r.ok).toBe(false);
        if (!r.ok)
            (0, vitest_1.expect)(r.reason).toBe("no_pilot_allocation");
    });
    (0, vitest_1.it)("clamps leverage to pilot ceiling and notes the clamp", () => {
        // Must request ABOVE the ceiling to exercise the clamp. `base` requests
        // exactly the ratified 100x, which is now legal and correctly produces
        // no clamp note — asserting a note there would only re-encode the old
        // stale 10x ceiling.
        const r = (0, translator_1.translateDirective)({ ...base, requested_leverage: PILOT.max_leverage + 50 });
        (0, vitest_1.expect)(r.ok).toBe(true);
        if (r.ok) {
            (0, vitest_1.expect)(r.effective_leverage).toBe(PILOT.max_leverage);
            (0, vitest_1.expect)(r.notes.join(" ")).toMatch(/leverage clamped/);
        }
    });
    (0, vitest_1.it)("passes a request AT the ceiling through unclamped and unnoted", () => {
        const r = (0, translator_1.translateDirective)(base);
        (0, vitest_1.expect)(r.ok).toBe(true);
        if (r.ok) {
            (0, vitest_1.expect)(r.effective_leverage).toBe(PILOT.max_leverage);
            (0, vitest_1.expect)(r.notes.join(" ")).not.toMatch(/leverage clamped/);
        }
    });
    (0, vitest_1.it)("computes notional = allocation × leverage", () => {
        const r = (0, translator_1.translateDirective)({
            ...base,
            requested_leverage: PILOT.max_leverage,
            equity_usd: PILOT.allocation_reserve_floor_usd + 200,
        });
        (0, vitest_1.expect)(r.ok).toBe(true);
        if (r.ok) {
            (0, vitest_1.expect)(r.allocation_usd).toBe(200);
            (0, vitest_1.expect)(r.notional_usd).toBe(200 * PILOT.max_leverage);
            (0, vitest_1.expect)(r.reduce_only).toBe(true);
            (0, vitest_1.expect)(r.emit).toBe(true);
            (0, vitest_1.expect)(r.dry_run).toBe(true);
        }
    });
    (0, vitest_1.it)("flags reduce-only for cancel_unfilled_rungs without emitting a new order", () => {
        const r = (0, translator_1.translateDirective)({ ...base, directive_type: "cancel_unfilled_rungs" });
        (0, vitest_1.expect)(r.ok).toBe(true);
        if (r.ok) {
            (0, vitest_1.expect)(r.reduce_only).toBe(true);
            (0, vitest_1.expect)(r.emit).toBe(false);
        }
    });
});
//# sourceMappingURL=translator.test.js.map