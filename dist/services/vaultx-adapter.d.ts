/**
 * Turtle Bot Adapter - Non-custodial trading tool for Vault
 * Bridges Vault's impact analysis with Turtle Bot's execution
 */
export interface TradeRequest {
    userId: string;
    symbol: string;
    amount: number;
    strategy: 'sweep' | 'hunter' | 'accumulator' | 'sniper';
    reason: string;
}
export interface TradeResult {
    status: 'pending' | 'executed' | 'failed';
    tradeId?: string;
    entryPrice?: number;
    exitPrice?: number;
    pnl?: number;
    message: string;
}
export interface TurtleBotConfig {
    brokerUrl: string;
    signerUrl: string;
    supabaseUrl: string;
    supabaseKey: string;
}
declare class TurtleBotAdapter {
    private config;
    constructor();
    /**
     * Execute a trade via Turtle Bot
     * User must have connected their wallet first
     */
    executeTrade(request: TradeRequest): Promise<TradeResult>;
    /**
     * Get Turtle Bot's portfolio/positions
     * Vault uses this to check current holdings
     */
    getPortfolio(userId: string): Promise<any>;
    /**
     * Get trading history from Turtle Bot
     */
    getTradingHistory(userId: string, limit?: number): Promise<any[]>;
    /**
     * Check if user can afford to trade (from impact analysis perspective)
     */
    canAffordTrade(userId: string, amount: number): Promise<boolean>;
    /**
     * Get Turtle Bot's recommended strategy for given symbol
     */
    getRecommendedStrategy(symbol: string): Promise<'sweep' | 'hunter' | 'accumulator' | 'sniper'>;
}
export declare const turtleBotAdapter: TurtleBotAdapter;
export {};
//# sourceMappingURL=vaultx-adapter.d.ts.map