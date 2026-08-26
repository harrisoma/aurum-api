export type DirectiveType = "cancel_unfilled_rungs" | "close_position" | "promote_runner" | "cancel_fixed_tp" | "set_breakeven_stop" | "repair_stop";
export interface TranslateInput {
    directive_type: DirectiveType | string;
    symbol: string;
    side: "long" | "short";
    connection_id: string;
    /** Requested leverage (before pilot clamp). */
    requested_leverage: number;
    /** Caller equity in USD (after fees, unrealized PnL, etc.). */
    equity_usd: number;
    /** Optional entry / stop / limit price context. */
    price?: number;
    intended_stop?: number;
}
export interface TranslateOk {
    ok: true;
    dry_run: true;
    directive_type: DirectiveType;
    symbol: string;
    side: "long" | "short";
    effective_leverage: number;
    allocation_usd: number;
    notional_usd: number;
    reduce_only: boolean;
    intended_stop: number | null;
    emit: boolean;
    notes: string[];
}
export interface TranslateFail {
    ok: false;
    reason: "unknown_directive" | "no_pilot_allocation" | "invalid_side" | "invalid_leverage" | "invalid_equity";
    detail?: string;
}
export type TranslateResult = TranslateOk | TranslateFail;
export declare function pilotAllocation(equityUsd: number): number;
export declare function pilotLeverage(requested: number): number;
export declare function translateDirective(input: TranslateInput): TranslateResult;
//# sourceMappingURL=translator.d.ts.map