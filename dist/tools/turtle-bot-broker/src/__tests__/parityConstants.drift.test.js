"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * The broker vendors a hand-copied subset of
 * shared/mainnet_parity_constants.json because its Docker build context is
 * broker/ only. Hand-copied means it rots: the vendored `max_leverage` sat
 * at 10 while the owner-ratified value was 100, so every brokered live
 * directive would have been clamped to a tenth of the intended leverage
 * with nothing failing to say so.
 *
 * This test is the sync mechanism the comment in parityConstants.ts claims
 * exists. It compares the vendored subset field-by-field against the real
 * source of truth, so the drift becomes a red test instead of a silent
 * sizing bug.
 */
const vitest_1 = require("vitest");
const parityConstants_1 = __importDefault(require("../parityConstants"));
const mainnet_parity_constants_json_1 = __importDefault(require("../../../shared/mainnet_parity_constants.json"));
(0, vitest_1.describe)("broker vendored parity constants match the shared source of truth", () => {
    (0, vitest_1.it)("mirrors every pilot sizing bound exactly", () => {
        const shared = mainnet_parity_constants_json_1.default.pilot;
        for (const key of Object.keys(parityConstants_1.default.pilot)) {
            (0, vitest_1.expect)(parityConstants_1.default.pilot[key], `pilot.${key} drifted from shared JSON`).toBe(shared[key]);
        }
    });
    (0, vitest_1.it)("clamps at the owner-ratified 100x ceiling, not a stale lower one", () => {
        (0, vitest_1.expect)(parityConstants_1.default.pilot.max_leverage).toBe(100);
    });
    (0, vitest_1.it)("mirrors the directive-type whitelist", () => {
        (0, vitest_1.expect)([...parityConstants_1.default.enums.directive_types].sort())
            .toEqual([...mainnet_parity_constants_json_1.default.enums.directive_types].sort());
    });
});
//# sourceMappingURL=parityConstants.drift.test.js.map