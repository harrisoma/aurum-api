/**
 * AURUM Bot Trading Strategies
 * Integrated from Turtle Bot + new Arbiter + Scout workflows
 *
 * Strategies:
 * - SWEEP: Liquidity sweep strategy (conservative, safe entries)
 * - HUNTER: Aggressive trend-following strategy
 * - SNIPER: High-precision entry strategy
 * - ACCUMULATOR: Dollar-cost averaging strategy
 * - ARBITER: Arbitrage across DEXs (buy low, sell high)
 * - SCOUT: Auto-discovery of best trading setups/symbols
 */
export type StrategyType = 'sweep' | 'hunter' | 'sniper' | 'accumulator' | 'arbiter' | 'scout';
export interface StrategyConfig {
    name: StrategyType;
    displayName: string;
    description: string;
    riskLevel: 'low' | 'medium' | 'high';
    minAccountSize: number;
    recommendedTP_RR: number;
    enableRetest: boolean;
    enableRejection: boolean;
    maxRungs: number;
    filters: {
        rsi_period: number;
        rsi_long_max: number;
        rsi_short_min: number;
        atr_period: number;
        atr_sma_period: number;
        min_atr_mult: number;
    };
    session_hours_utc: number[];
    enabled: boolean;
}
export declare const STRATEGIES: Record<StrategyType, StrategyConfig>;
export interface ScoutSetup {
    symbol: string;
    strategy: StrategyType;
    confidence: number;
    expectedReturn: number;
    riskLevel: string;
    timeframe: string;
    setup_description: string;
}
export interface StrategyRecommendation {
    symbol: string;
    recommendedStrategy: StrategyType;
    alternativeStrategies: StrategyType[];
    reason: string;
    confidence: number;
}
declare class StrategyEngine {
    /**
     * Get strategy by name
     */
    getStrategy(name: StrategyType): StrategyConfig;
    /**
     * List all available strategies
     */
    listStrategies(): StrategyConfig[];
    /**
     * Scout for best trading setups - AI-powered discovery
     * Scans multiple symbols and returns the best setup for today
     */
    scoutBestSetups(symbols: string[], llmProvider: any): Promise<ScoutSetup[]>;
    /**
     * Recommend best strategy for a symbol based on market conditions
     */
    recommendStrategy(symbol: string, marketData: any, llmProvider: any): Promise<StrategyRecommendation>;
    /**
     * Get arbitrage opportunities - ARBITER strategy
     */
    findArbitrageOpportunities(symbols: string[], priceData: Record<string, Record<string, number>>): Promise<any[]>;
}
export declare const strategyEngine: StrategyEngine;
export {};
//# sourceMappingURL=strategies.d.ts.map