"use strict";
/**
 * AURUM Bot - Non-custodial trading tool for AURUM
 * Executes trades across Apex, Kraken, Coinbase
 * Supports: Standard trading + Arbitrage (buy on one DEX, sell on another)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.turtleBotAdapter = exports.aurumBot = void 0;
const supabase_js_1 = require("./supabase.js");
class AURUMBot {
    constructor() {
        this.config = {
            brokerUrl: process.env.AURUM_BOT_BROKER_URL || process.env.TURTLE_BOT_BROKER_URL || 'http://localhost:3000',
            signerUrl: process.env.AURUM_BOT_SIGNER_URL || process.env.TURTLE_BOT_SIGNER_URL || 'http://localhost:3001',
            supabaseUrl: process.env.SUPABASE_URL || '',
            supabaseKey: process.env.SUPABASE_PUBLISHABLE_KEY || '',
        };
    }
    /**
     * Execute a standard trade via AURUM Bot
     * User must have connected their wallet first
     */
    async executeTrade(request) {
        try {
            const { data: wallet } = await supabase_js_1.supabaseAdmin
                .from('user_wallets')
                .select('address')
                .eq('user_id', request.userId)
                .single();
            if (!wallet) {
                return {
                    status: 'failed',
                    message: 'User wallet not connected. Please connect MetaMask first.',
                };
            }
            const preflightResponse = await fetch(`${this.config.brokerUrl}/v1/intents/preflight`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${request.userId}`,
                },
                body: JSON.stringify({
                    symbol: request.symbol,
                    amount: request.amount,
                    strategy: request.strategy,
                    reason: request.reason,
                }),
            });
            if (!preflightResponse.ok) {
                return {
                    status: 'failed',
                    message: `Trade validation failed: ${preflightResponse.statusText}`,
                };
            }
            const { data: trade } = await supabase_js_1.supabaseAdmin
                .from('turtle_bot_trades')
                .insert([
                {
                    user_id: request.userId,
                    wallet_address: wallet.address,
                    symbol: request.symbol,
                    amount: request.amount,
                    strategy: request.strategy,
                    reason: request.reason,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                },
            ])
                .select('id')
                .single();
            return {
                status: 'pending',
                tradeId: trade?.id,
                message: `Trade submitted to AURUM Bot. Executing on ${request.symbol}.`,
            };
        }
        catch (error) {
            console.error('Error executing trade via AURUM Bot:', error);
            return {
                status: 'failed',
                message: `Trade execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Execute an arbitrage trade (buy on one DEX, sell on another)
     * Automatically identifies best spread and executes both trades
     */
    async executeArbitrageTrade(userId, symbol, amount, minProfitPercent = 1) {
        try {
            const wallet = await supabase_js_1.supabaseAdmin
                .from('user_wallets')
                .select('address')
                .eq('user_id', userId)
                .single();
            if (!wallet.data) {
                return {
                    status: 'failed',
                    message: 'User wallet not connected.',
                };
            }
            const opportunity = await this.findBestArbitrage(symbol, amount, minProfitPercent);
            if (!opportunity) {
                return {
                    status: 'failed',
                    message: `No profitable arbitrage found for ${symbol} with min ${minProfitPercent}% spread.`,
                };
            }
            const response = await fetch(`${this.config.brokerUrl}/v1/arbitrage/execute`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userId}`,
                },
                body: JSON.stringify({
                    symbol,
                    amount,
                    buyExchange: opportunity.buyExchange,
                    sellExchange: opportunity.sellExchange,
                    buyPrice: opportunity.buyPrice,
                    sellPrice: opportunity.sellPrice,
                    estimatedProfit: opportunity.estimatedProfit,
                }),
            });
            if (!response.ok) {
                return {
                    status: 'failed',
                    message: 'Arbitrage execution failed.',
                };
            }
            const { data: trade } = await supabase_js_1.supabaseAdmin
                .from('turtle_bot_trades')
                .insert([
                {
                    user_id: userId,
                    wallet_address: wallet.data.address,
                    symbol: symbol,
                    amount: amount,
                    strategy: 'arbitrage',
                    reason: `Arbitrage: Buy ${symbol} on ${opportunity.buyExchange}, sell on ${opportunity.sellExchange}`,
                    status: 'pending',
                    entry_price: opportunity.buyPrice,
                    exit_price: opportunity.sellPrice,
                    created_at: new Date().toISOString(),
                },
            ])
                .select('id')
                .single();
            return {
                status: 'pending',
                tradeId: trade?.id,
                entryPrice: opportunity.buyPrice,
                exitPrice: opportunity.sellPrice,
                pnl: opportunity.estimatedProfit,
                message: `Arbitrage trade submitted: Buy ${opportunity.buyExchange.toUpperCase()} @ ${opportunity.buyPrice}, Sell ${opportunity.sellExchange.toUpperCase()} @ ${opportunity.sellPrice}. Est. profit: $${opportunity.estimatedProfit.toFixed(2)}`,
            };
        }
        catch (error) {
            console.error('Error executing arbitrage trade:', error);
            return {
                status: 'failed',
                message: `Arbitrage execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }
    /**
     * Find arbitrage opportunities across exchanges
     * Compares prices on Apex, Kraken, Coinbase
     */
    async findArbitrageOpportunities(symbol, minProfitPercent = 1) {
        try {
            const prices = await this.getPricesAcrossExchanges(symbol);
            if (!prices)
                return [];
            const opportunities = [];
            const exchanges = ['apex', 'kraken', 'coinbase'];
            for (let i = 0; i < exchanges.length; i++) {
                for (let j = 0; j < exchanges.length; j++) {
                    if (i === j)
                        continue;
                    const buyExchange = exchanges[i];
                    const sellExchange = exchanges[j];
                    const buyPrice = prices[buyExchange];
                    const sellPrice = prices[sellExchange];
                    if (!buyPrice || !sellPrice)
                        continue;
                    const spread = ((sellPrice - buyPrice) / buyPrice) * 100;
                    if (spread > minProfitPercent) {
                        opportunities.push({
                            symbol,
                            buyExchange,
                            sellExchange,
                            buyPrice,
                            sellPrice,
                            spread,
                            volume: 100, // Placeholder
                            estimatedProfit: spread * (100 / 100), // Simplified calculation
                        });
                    }
                }
            }
            return opportunities.sort((a, b) => b.spread - a.spread);
        }
        catch (error) {
            console.error('Error finding arbitrage opportunities:', error);
            return [];
        }
    }
    /**
     * Find best arbitrage opportunity for execution
     */
    async findBestArbitrage(symbol, amount, minProfitPercent) {
        const opportunities = await this.findArbitrageOpportunities(symbol, minProfitPercent);
        return opportunities.length > 0 ? opportunities[0] : null;
    }
    /**
     * Get current prices across Apex, Kraken, Coinbase
     */
    async getPricesAcrossExchanges(symbol) {
        try {
            const response = await fetch(`${this.config.brokerUrl}/v1/prices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, exchanges: ['apex', 'kraken', 'coinbase'] }),
            });
            return response.ok ? await response.json() : null;
        }
        catch (error) {
            console.error('Error fetching prices:', error);
            return null;
        }
    }
    /**
     * Get AURUM Bot's portfolio/positions
     */
    async getPortfolio(userId) {
        try {
            const { data: wallet } = await supabase_js_1.supabaseAdmin
                .from('user_wallets')
                .select('address')
                .eq('user_id', userId)
                .single();
            if (!wallet) {
                return null;
            }
            const response = await fetch(`${this.config.brokerUrl}/v1/portfolio`, {
                headers: {
                    Authorization: `Bearer ${userId}`,
                },
            });
            return response.ok ? response.json() : null;
        }
        catch (error) {
            console.error('Error fetching AURUM Bot portfolio:', error);
            return null;
        }
    }
    /**
     * Get trading history
     */
    async getTradingHistory(userId, limit = 50) {
        try {
            const { data: trades } = await supabase_js_1.supabaseAdmin
                .from('turtle_bot_trades')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);
            return trades || [];
        }
        catch (error) {
            console.error('Error fetching trading history:', error);
            return [];
        }
    }
    /**
     * Check if user can afford to trade
     */
    async canAffordTrade(userId, amount) {
        try {
            const response = await fetch(`http://localhost:4000/api/impact/metrics`, {
                headers: {
                    Authorization: `Bearer test-token`,
                },
            });
            if (!response.ok)
                return false;
            const data = await response.json();
            const { metrics } = data;
            return metrics.monthlyGap > amount;
        }
        catch (error) {
            console.error('Error checking trade affordability:', error);
            return false;
        }
    }
    /**
     * Get recommended strategy for symbol
     */
    async getRecommendedStrategy(symbol) {
        return 'sweep';
    }
}
exports.aurumBot = new AURUMBot();
exports.turtleBotAdapter = exports.aurumBot; // Backward compatibility
//# sourceMappingURL=aurum-bot.js.map