"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const financial_1 = require("../services/financial");
const router = (0, express_1.Router)();
/**
 * GET /financial/snapshot
 * Get complete financial snapshot for user with advanced metrics
 */
router.get('/snapshot', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const snapshot = await (0, financial_1.getUserFinancialSnapshot)(req.user.id);
        res.json({
            ...snapshot,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting snapshot:', error);
        res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
});
/**
 * GET /financial/net-worth
 * Get user's net worth
 */
router.get('/net-worth', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const netWorth = await (0, financial_1.calculateNetWorth)(req.user.id);
        res.json({ netWorth });
    }
    catch (error) {
        console.error('Error calculating net worth:', error);
        res.status(500).json({ error: 'Failed to calculate net worth' });
    }
});
/**
 * GET /financial/gap
 * Get monthly gap (income - expenses)
 */
router.get('/gap', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const gap = await (0, financial_1.calculateMonthlyGap)(req.user.id);
        res.json({ monthlyGap: gap });
    }
    catch (error) {
        console.error('Error calculating gap:', error);
        res.status(500).json({ error: 'Failed to calculate gap' });
    }
});
/**
 * GET /financial/burn-rate
 * Get daily burn rate (average daily spending)
 */
router.get('/burn-rate', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const days = parseInt(req.query.days) || 30;
        const burnRate = await (0, financial_1.calculateDailyBurnRate)(req.user.id, days);
        res.json({ dailyBurnRate: burnRate, period: days });
    }
    catch (error) {
        console.error('Error calculating burn rate:', error);
        res.status(500).json({ error: 'Failed to calculate burn rate' });
    }
});
/**
 * GET /financial/accounts
 * Get all user accounts
 */
router.get('/accounts', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const accounts = await (0, financial_1.getUserAccounts)(req.user.id);
        res.json({ accounts });
    }
    catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});
/**
 * GET /financial/transactions
 * Get user's recent transactions
 */
router.get('/transactions', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const limit = parseInt(req.query.limit) || 50;
        const transactions = await (0, financial_1.getUserTransactions)(req.user.id, limit);
        res.json({ transactions });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});
/**
 * GET /financial/goals
 * Get user's goals with progress
 */
router.get('/goals', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const goals = await (0, financial_1.getUserGoals)(req.user.id);
        res.json({ goals });
    }
    catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch goals' });
    }
});
/**
 * GET /financial/trends
 * Get historical financial trends
 */
router.get('/trends', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { data, error } = await require('../services/supabase').supabaseAdmin
            .from('monthly_financial_summary')
            .select('*')
            .eq('user_id', req.user.id)
            .order('month', { ascending: false })
            .limit(12);
        if (error) {
            console.error('Error fetching trends:', error);
            return res.status(500).json({ error: 'Failed to fetch trends' });
        }
        res.json({
            trends: data || [],
            count: (data || []).length,
        });
    }
    catch (error) {
        console.error('Error in trends endpoint:', error);
        res.status(500).json({ error: 'Failed to fetch trends' });
    }
});
/**
 * GET /financial/category-breakdown
 * Get spending by category
 */
router.get('/category-breakdown', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { data, error } = await require('../services/supabase').supabaseAdmin
            .from('transactions')
            .select('category, amount')
            .eq('user_id', req.user.id)
            .lt('amount', 0);
        if (error) {
            console.error('Error fetching categories:', error);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
        const breakdown = (data || []).reduce((acc, txn) => {
            const cat = txn.category || 'Uncategorized';
            acc[cat] = (acc[cat] || 0) + Math.abs(txn.amount || 0);
            return acc;
        }, {});
        res.json({
            breakdown,
            totalSpent: Object.values(breakdown).reduce((a, b) => a + b, 0),
        });
    }
    catch (error) {
        console.error('Error in category breakdown:', error);
        res.status(500).json({ error: 'Failed to fetch category breakdown' });
    }
});
/**
 * GET /financial/runway-forecast
 * Get days of runway and forecast
 */
router.get('/runway-forecast', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const snapshot = await (0, financial_1.getUserFinancialSnapshot)(req.user.id);
        res.json({
            runway: snapshot.runway,
            runwayDays: Math.floor(snapshot.runway),
            runwayMonths: Math.round((snapshot.runway / 30) * 10) / 10,
            velocity: snapshot.velocity,
            status: snapshot.runway < 0 ? 'sustainable' : snapshot.runway < 30 ? 'critical' : 'healthy',
            alert: snapshot.runway > 0 && snapshot.runway < 30 ? true : false,
        });
    }
    catch (error) {
        console.error('Error in runway forecast:', error);
        res.status(500).json({ error: 'Failed to fetch runway forecast' });
    }
});
exports.default = router;
//# sourceMappingURL=financial.js.map