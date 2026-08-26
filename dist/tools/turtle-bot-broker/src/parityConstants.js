"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PARITY = void 0;
/**
 * BROKER-VENDORED PARITY CONSTANTS.
 *
 * Source of truth: shared/mainnet_parity_constants.json (repo root).
 * Vendored here because the broker's Docker build context is broker/
 * only — shared/ is not COPY'd into the image. Values MUST be kept in
 * sync manually; docs/MAINNET_PARITY.md notes this vendor relationship.
 *
 * Only the subset the broker's translator needs is mirrored: pilot
 * sizing/leverage caps and the directive-type enum whitelist.
 */
exports.PARITY = {
    pilot: {
        allocation_reserve_floor_usd: 100,
        // Owner-ratified ceiling (ruling #1). Kept identical to
        // shared/mainnet_parity_constants.json.pilot.max_leverage — this copy
        // had drifted at 10, which would have silently sized every brokered
        // live directive at a tenth of the ratified leverage.
        // parityConstants.drift.test.ts fails if the two ever diverge again.
        max_leverage: 100,
        allocation_ceiling_usd: 500,
    },
    enums: {
        directive_types: [
            "cancel_unfilled_rungs",
            "close_position",
            "promote_runner",
            "cancel_fixed_tp",
            "set_breakeven_stop",
            "repair_stop",
        ],
    },
};
exports.default = exports.PARITY;
//# sourceMappingURL=parityConstants.js.map