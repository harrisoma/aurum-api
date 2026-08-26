"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const turtle_bot_adapter_js_1 = require("../services/turtle-bot-adapter.js");
const router = (0, express_1.Router)();
// POST /turtle-bot/execute - Execute a trade
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
        // Check if user can afford this trade
        const canAfford = await turtle_bot_adapter_js_1.turtleBotAdapter.canAffordTrade(req.user.id, amount);
        if (!canAfford) {
            return res.status(400).json({
                error: 'Insufficient funds. Trade would exceed budget.',
            });
        }
        // Execute the trade
        const result = await turtle_bot_adapter_js_1.turtleBotAdapter.executeTrade({
            userId: req.user.id,
            symbol,
            amount,
            strategy,
            reason: reason || `Trade to generate income (via Vault)`,
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
// GET /turtle-bot/portfolio - Get user's trading portfolio
router.get('/portfolio', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const portfolio = await turtle_bot_adapter_js_1.turtleBotAdapter.getPortfolio(req.user.id);
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
// GET /turtle-bot/history - Get trading history
router.get('/history', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { limit = 50 } = req.query;
        const history = await turtle_bot_adapter_js_1.turtleBotAdapter.getTradingHistory(req.user.id, parseInt(limit));
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
// POST /turtle-bot/connect-wallet - Connect user's wallet for trading
router.post('/connect-wallet', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { walletAddress, walletType } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: 'Missing walletAddress' });
        }
        // TODO: Verify wallet signature before storing
        // For now, just store it (user must have signed in their wallet)
        const { data, error } = await require('../services/supabase.js')
            .supabaseAdmin.from('user_wallets')
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
// GET /turtle-bot/status - Check Turtle Bot service status
router.get('/status', async (req, res) => {
    try {
        // Check if Turtle Bot broker is reachable
        res.json({
            status: 'online',
            broker: process.env.TURTLE_BOT_BROKER_URL || 'http://localhost:3000',
            signer: process.env.TURTLE_BOT_SIGNER_URL || 'http://localhost:3001',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Turtle Bot unavailable' });
    }
});
exports.default = router;
//# sourceMappingURL=turtle-bot.js.map