/**
 * AURUM Bot - Non-custodial trading tool for AURUM
 * Executes trades across Apex, Kraken, Coinbase
 * Supports: Standard trading + Arbitrage (buy on one DEX, sell on another)
 */
export interface TradeRequest {
    userId: string;
    symbol: string;
    amount: number;
    strategy: 'sweep' | 'hunter' | 'accumulator' | 'sniper';
    reason: string;
}
export interface ArbitrageOpportunity {
    symbol: string;
    buyExchange: 'apex' | 'kraken' | 'coinbase';
    sellExchange: 'apex' | 'kraken' | 'coinbase';
    buyPrice: number;
    sellPrice: number;
    spread: number;
    volume: number;
    gasCost?: number;
    estimatedProfit: number;
}
export interface TradeResult {
    status: 'pending' | 'executed' | 'failed';
    tradeId?: string;
    entryPrice?: number;
    exitPrice?: number;
    pnl?: number;
    message: string;
}
export interface AURUMBotConfig {
    brokerUrl: string;
    signerUrl: string;
    supabaseUrl: string;
    supabaseKey: string;
}
declare class AURUMBot {
    private config;
    constructor();
    /**
     * Execute a standard trade via AURUM Bot
     * User must have connected their wallet first
     */
    executeTrade(request: TradeRequest): Promise<TradeResult>;
    /**
     * Execute an arbitrage trade (buy on one DEX, sell on another)
     * Automatically identifies best spread and executes both trades
     */
    executeArbitrageTrade(userId: string, symbol: string, amount: number, minProfitPercent?: number): Promise<TradeResult>;
    /**
     * Find arbitrage opportunities across exchanges
     * Compares prices on Apex, Kraken, Coinbase
     */
    findArbitrageOpportunities(symbol: string, minProfitPercent?: number): Promise<ArbitrageOpportunity[]>;
    /**
     * Find best arbitrage opportunity for execution
     */
    private findBestArbitrage;
    /**
     * Get current prices across Apex, Kraken, Coinbase
     */
    getPricesAcrossExchanges(symbol: string): Promise<{
        apex?: number;
        kraken?: number;
        coinbase?: number;
    } | null>;
    /**
     * Get AURUM Bot's portfolio/positions
     */
    getPortfolio(userId: string): Promise<any>;
    /**
     * Get trading history
     */
    getTradingHistory(userId: string, limit?: number): Promise<any[]>;
    /**
     * Check if user can afford to trade
     */
    canAffordTrade(userId: string, amount: number): Promise<boolean>;
    /**
     * Get recommended strategy for symbol
     */
    getRecommendedStrategy(symbol: string): Promise<'sweep' | 'hunter' | 'accumulator' | 'sniper'>;
}
export declare const aurumBot: AURUMBot;
export declare const turtleBotAdapter: AURUMBot;
export {};
//# sourceMappingURL=aurum-bot.d.ts.map