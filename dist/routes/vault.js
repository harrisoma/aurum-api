"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const vault_js_1 = require("../services/vault.js");
const llm_adapter_js_1 = require("../services/llm-adapter.js");
const router = (0, express_1.Router)();
/**
 * POST /vault/recommendations
 * Generate smart budget recommendations based on spending history
 */
router.post('/recommendations', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const recommendations = await (0, vault_js_1.generateBudgetRecommendations)(req.user.id);
        res.json({
            recommendations,
            timestamp: new Date().toISOString(),
            message: `Generated ${recommendations.length} smart budget recommendations`,
        });
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});
/**
 * GET /vault/status
 * Get current status of all user budgets
 */
router.get('/status', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const status = await (0, vault_js_1.getBudgetStatus)(req.user.id);
        // Calculate summary
        const summary = {
            totalBudgeted: status.reduce((sum, b) => sum + b.budgeted, 0),
            totalSpent: status.reduce((sum, b) => sum + b.spentThisMonth, 0),
            totalRemaining: status.reduce((sum, b) => sum + b.remaining, 0),
            healthyCounts: status.filter(b => b.status === 'healthy').length,
            warningCounts: status.filter(b => b.status === 'warning').length,
            criticalCounts: status.filter(b => b.status === 'critical').length,
            overallStatus: status.some(b => b.status === 'critical') ? 'critical' :
                status.some(b => b.status === 'warning') ? 'warning' :
                    'healthy',
        };
        res.json({
            status,
            summary,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting budget status:', error);
        res.status(500).json({ error: 'Failed to get budget status' });
    }
});
/**
 * GET /vault/forecast
 * Forecast spending through month-end
 */
router.get('/forecast', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const forecast = await (0, vault_js_1.forecastBudgets)(req.user.id);
        // Identify risks
        const risks = forecast.filter(f => f.variance > 0);
        const overBudget = forecast.filter(f => f.percentageOverUnder > 0);
        res.json({
            forecast,
            analysis: {
                categoriesAtRisk: risks.length,
                totalProjectedOverage: Math.round(risks.reduce((sum, f) => sum + Math.max(0, f.variance), 0) * 100) / 100,
                overBudgetCount: overBudget.length,
            },
            recommendation: overBudget.length > 0
                ? `⚠️  ${overBudget.length} categories projected to exceed budget by month-end`
                : '✓ All categories on track',
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error forecasting budgets:', error);
        res.status(500).json({ error: 'Failed to forecast budgets' });
    }
});
/**
 * GET /vault/alerts
 * Get active budget alerts
 */
router.get('/alerts', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const alerts = await (0, vault_js_1.checkBudgetAlerts)(req.user.id);
        res.json({
            alerts,
            count: alerts.length,
            hasCritical: alerts.some(a => a.severity === 'critical'),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error checking alerts:', error);
        res.status(500).json({ error: 'Failed to check alerts' });
    }
});
/**
 * POST /vault/budget
 * Create a new budget with optional rules
 */
router.post('/budget', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { category, monthlyAmount, rules } = req.body;
        if (!category || !monthlyAmount) {
            return res.status(400).json({ error: 'Category and monthlyAmount required' });
        }
        const budget = await (0, vault_js_1.createBudget)(req.user.id, category, monthlyAmount, rules);
        res.status(201).json({
            budget,
            message: `Created budget for ${category}: $${monthlyAmount.toFixed(2)}/month`,
        });
    }
    catch (error) {
        console.error('Error creating budget:', error);
        res.status(500).json({ error: 'Failed to create budget' });
    }
});
/**
 * GET /vault/insights
 * AI-powered financial insights
 */
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const [status, forecast, snapshot] = await Promise.all([
            (0, vault_js_1.getBudgetStatus)(userId),
            (0, vault_js_1.forecastBudgets)(userId),
            (async () => {
                // Get snapshot data
                const { data } = await require('../services/supabase').supabaseAdmin
                    .from('user_financial_trends')
                    .select('assets_eod, liabilities_eod, daily_income, daily_expenses')
                    .eq('user_id', userId)
                    .order('day', { ascending: false })
                    .limit(1)
                    .single();
                return {
                    netWorth: (data?.assets_eod || 0) - (data?.liabilities_eod || 0),
                    monthlyExpenses: (data?.daily_expenses || 0) * 30,
                };
            })(),
        ]);
        // Generate LLM insights using configured provider
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        const insights = await llm.generateInsights(snapshot, status, forecast);
        res.json({
            insights,
            provider: llm.getProvider(),
            model: llm.getModel(),
            timestamp: new Date().toISOString(),
            message: 'AI-powered financial insights generated',
        });
    }
    catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
/**
 * GET /vault/recommendations-monthly
 * Monthly action recommendations from AI
 */
router.get('/recommendations-monthly', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = req.user.id;
        const [status, snapshot] = await Promise.all([
            (0, vault_js_1.getBudgetStatus)(userId),
            (async () => {
                const { data } = await require('../services/supabase').supabaseAdmin
                    .from('user_financial_trends')
                    .select('assets_eod, liabilities_eod, daily_income, daily_expenses')
                    .eq('user_id', userId)
                    .order('day', { ascending: false })
                    .limit(1)
                    .single();
                return {
                    netWorth: (data?.assets_eod || 0) - (data?.liabilities_eod || 0),
                    monthlyIncome: (data?.daily_income || 0) * 30,
                    monthlyExpenses: (data?.daily_expenses || 0) * 30,
                    monthlyGap: ((data?.daily_income || 0) - (data?.daily_expenses || 0)) * 30,
                };
            })(),
        ]);
        const topCategories = status.slice(0, 3).map(s => s.category);
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        const recommendations = await llm.generateRecommendations(snapshot, topCategories);
        res.json({
            recommendations,
            focusCategories: topCategories,
            provider: llm.getProvider(),
            model: llm.getModel(),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error generating monthly recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});
/**
 * GET /vault/dashboard
 * Comprehensive Vault dashboard data
 */
router.get('/dashboard', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const [recommendations, status, forecast, alerts] = await Promise.all([
            (0, vault_js_1.generateBudgetRecommendations)(req.user.id),
            (0, vault_js_1.getBudgetStatus)(req.user.id),
            (0, vault_js_1.forecastBudgets)(req.user.id),
            (0, vault_js_1.checkBudgetAlerts)(req.user.id),
        ]);
        res.json({
            recommendations: recommendations.slice(0, 5), // Top 5
            status,
            forecast,
            alerts,
            summary: {
                budgetsCreated: status.length,
                categoriesTracking: status.length,
                alertsActive: alerts.length,
                overallHealth: status.length === 0 ? 'setup_needed' :
                    status.some(s => s.status === 'critical') ? 'critical' :
                        status.some(s => s.status === 'warning') ? 'warning' :
                            'healthy',
            },
            nextActions: status.length === 0
                ? ['Set up budgets for top spending categories', 'Review recommendations']
                : alerts.length > 0
                    ? ['Address budget alerts', 'Review spending']
                    : ['Monitor spending', 'Check monthly forecast'],
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error getting dashboard:', error);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=vault.js.map