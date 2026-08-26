"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const aurum_bot_js_1 = require("../services/aurum-bot.js");
const supabase_js_1 = require("../services/supabase.js");
const router = (0, express_1.Router)();
// POST /trading/execute - Execute a standard trade
router.post('/execute', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbol, amount, strategy, reason } = req.body;
        if (!symbol || !amount || !strategy) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, amount, strategy',
            });
        }
        const canAfford = await aurum_bot_js_1.aurumBot.canAffordTrade(req.user.id, amount);
        if (!canAfford) {
            return res.status(400).json({
                error: 'Insufficient funds. Trade would exceed budget.',
            });
        }
        const result = await aurum_bot_js_1.aurumBot.executeTrade({
            userId: req.user.id,
            symbol,
            amount,
            strategy,
            reason: reason || `Trading to earn`,
        });
        res.json({
            success: result.status !== 'failed',
            result,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error executing trade:', error);
        res.status(500).json({ error: 'Failed to execute trade' });
    }
});
// POST /trading/arbitrage/find - Find arbitrage opportunities
router.post('/arbitrage/find', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbol, minProfitPercent = 1 } = req.body;
        if (!symbol) {
            return res.status(400).json({ error: 'Missing required field: symbol' });
        }
        const opportunities = await aurum_bot_js_1.aurumBot.findArbitrageOpportunities(symbol, minProfitPercent);
        res.json({
            symbol,
            opportunities,
            count: opportunities.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error finding arbitrage:', error);
        res.status(500).json({ error: 'Failed to find arbitrage opportunities' });
    }
});
// POST /trading/arbitrage/execute - Execute arbitrage trade
router.post('/arbitrage/execute', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbol, amount, minProfitPercent = 1 } = req.body;
        if (!symbol || !amount) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, amount',
            });
        }
        const result = await aurum_bot_js_1.aurumBot.executeArbitrageTrade(req.user.id, symbol, amount, minProfitPercent);
        res.json({
            success: result.status !== 'failed',
            result,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error executing arbitrage:', error);
        res.status(500).json({ error: 'Failed to execute arbitrage trade' });
    }
});
// POST /trading/prices - Get prices across exchanges
router.post('/prices', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbol } = req.body;
        if (!symbol) {
            return res.status(400).json({ error: 'Missing required field: symbol' });
        }
        const prices = await aurum_bot_js_1.aurumBot.getPricesAcrossExchanges(symbol);
        res.json({
            symbol,
            prices,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching prices:', error);
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});
// GET /trading/portfolio - Get user's trading portfolio
router.get('/portfolio', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const portfolio = await aurum_bot_js_1.aurumBot.getPortfolio(req.user.id);
        res.json({
            portfolio,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching portfolio:', error);
        res.status(500).json({ error: 'Failed to fetch portfolio' });
    }
});
// GET /trading/history - Get trading history
router.get('/history', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { limit = 50 } = req.query;
        const history = await aurum_bot_js_1.aurumBot.getTradingHistory(req.user.id, parseInt(limit));
        res.json({
            trades: history,
            count: history.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch trading history' });
    }
});
// POST /trading/connect-wallet - Connect user's wallet
router.post('/connect-wallet', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { walletAddress, walletType } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: 'Missing walletAddress' });
        }
        const { data, error } = await supabase_js_1.supabaseAdmin
            .from('user_wallets')
            .upsert([
            {
                user_id: req.user.id,
                address: walletAddress,
                type: walletType || 'metamask',
                connected_at: new Date().toISOString(),
            },
        ], { onConflict: 'user_id' });
        if (error)
            throw error;
        res.json({
            success: true,
            message: `Wallet ${walletAddress} connected successfully`,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error connecting wallet:', error);
        res.status(500).json({ error: 'Failed to connect wallet' });
    }
});
// GET /trading/strategies - List all available strategies
router.get('/strategies', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { strategyEngine } = await Promise.resolve().then(() => __importStar(require('../services/strategies.js')));
        const strategies = strategyEngine.listStrategies();
        res.json({
            strategies,
            count: strategies.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Failed to fetch strategies' });
    }
});
// POST /trading/scout/discover - Scout AI discovers best setups for the day
router.post('/scout/discover', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbols } = req.body;
        if (!symbols || !Array.isArray(symbols)) {
            return res.status(400).json({ error: 'symbols array required' });
        }
        const { strategyEngine } = await Promise.resolve().then(() => __importStar(require('../services/strategies.js')));
        const { getLLMAdapter } = await Promise.resolve().then(() => __importStar(require('../services/llm-adapter.js')));
        const llmAdapter = getLLMAdapter();
        const setups = await strategyEngine.scoutBestSetups(symbols, llmAdapter);
        res.json({
            count: setups.length,
            setups,
            message: `Scout found ${setups.length} high-confidence setups for ${symbols.join(', ')}`,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error scouting setups:', error);
        res.status(500).json({ error: 'Failed to scout setups' });
    }
});
// POST /trading/scout/recommend - Get strategy recommendation for a symbol
router.post('/scout/recommend', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { symbol, marketData } = req.body;
        if (!symbol || !marketData) {
            return res.status(400).json({ error: 'symbol and marketData required' });
        }
        const { strategyEngine } = await Promise.resolve().then(() => __importStar(require('../services/strategies.js')));
        const { getLLMAdapter } = await Promise.resolve().then(() => __importStar(require('../services/llm-adapter.js')));
        const llmAdapter = getLLMAdapter();
        const recommendation = await strategyEngine.recommendStrategy(symbol, marketData, llmAdapter);
        res.json({
            symbol,
            recommendation,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error recommending strategy:', error);
        res.status(500).json({ error: 'Failed to recommend strategy' });
    }
});
// GET /trading/status - Check AURUM Bot service status
router.get('/status', async (req, res) => {
    res.json({
        status: 'online',
        service: 'AURUM Bot',
        exchanges: ['apex', 'kraken', 'coinbase'],
        strategies: ['sweep', 'hunter', 'sniper', 'accumulator', 'arbiter', 'scout'],
        features: ['trading', 'arbitrage', 'ai-discovery', 'ai-recommendations'],
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
//# sourceMappingURL=aurum-bot.js.map