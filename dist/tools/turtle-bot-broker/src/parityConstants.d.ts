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
export declare const PARITY: {
    readonly pilot: {
        readonly allocation_reserve_floor_usd: 100;
        readonly max_leverage: 100;
        readonly allocation_ceiling_usd: 500;
    };
    readonly enums: {
        readonly directive_types: readonly ["cancel_unfilled_rungs", "close_position", "promote_runner", "cancel_fixed_tp", "set_breakeven_stop", "repair_stop"];
    };
};
export default PARITY;
//# sourceMappingURL=parityConstants.d.ts.map