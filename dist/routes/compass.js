"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const compass_js_1 = require("../services/compass.js");
const llm_adapter_js_1 = require("../services/llm-adapter.js");
const router = (0, express_1.Router)();
// GET /compass/goals - Get user's career goals
router.get('/goals', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const goals = await (0, compass_js_1.getCareerGoals)(req.user.id);
        res.json({
            goals,
            count: goals.length,
            activeGoals: goals.filter(g => g.status === 'active').length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ error: 'Failed to fetch career goals' });
    }
});
// GET /compass/skills - Get user's skills
router.get('/skills', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const skills = await (0, compass_js_1.getUserSkills)(req.user.id);
        res.json({
            skills,
            totalSkills: skills.length,
            averageProficiency: skills.length > 0
                ? (skills.reduce((sum, s) => sum + s.proficiency_level, 0) / skills.length).toFixed(1)
                : 0,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({ error: 'Failed to fetch skills' });
    }
});
// POST /compass/goals - Create career goal
router.post('/goals', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, description, targetDate, priority } = req.body;
        if (!title || !targetDate) {
            return res.status(400).json({ error: 'Title and targetDate required' });
        }
        const goal = await (0, compass_js_1.createCareerGoal)(req.user.id, title, description, targetDate, priority);
        if (!goal) {
            return res.status(500).json({ error: 'Failed to create goal' });
        }
        res.status(201).json({
            goal,
            message: `Created goal: ${title}`,
        });
    }
    catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ error: 'Failed to create goal' });
    }
});
// GET /compass/insights - AI-powered career insights
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, compass_js_1.generateCareerInsights)(req.user.id);
        const llm = (0, llm_adapter_js_1.getLLMAdapter)();
        res.json({
            insights,
            provider: llm.getProvider(),
            model: llm.getModel(),
            timestamp: new Date().toISOString(),
            message: 'AI-powered career insights generated',
        });
    }
    catch (error) {
        console.error('Error generating insights:', error);
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
// GET /compass/recommendations - Career recommendations
router.get('/recommendations', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const recommendations = await (0, compass_js_1.getCareerRecommendations)(req.user.id);
        res.json({
            recommendations,
            count: recommendations.length,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
});
// GET /compass/dashboard - Compass dashboard
router.get('/dashboard', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const goals = await (0, compass_js_1.getCareerGoals)(req.user.id);
        const skills = await (0, compass_js_1.getUserSkills)(req.user.id);
        const insights = await (0, compass_js_1.generateCareerInsights)(req.user.id);
        const recommendations = await (0, compass_js_1.getCareerRecommendations)(req.user.id);
        res.json({
            summary: {
                totalGoals: goals.length,
                activeGoals: goals.filter(g => g.status === 'active').length,
                completedGoals: goals.filter(g => g.status === 'completed').length,
                totalSkills: skills.length,
                averageProficiency: skills.length > 0
                    ? (skills.reduce((sum, s) => sum + s.proficiency_level, 0) / skills.length).toFixed(1)
                    : 0,
            },
            recentGoals: goals.slice(0, 5),
            topSkills: skills.slice(0, 3),
            insights: insights.slice(0, 3),
            recommendations: recommendations.slice(0, 3),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error loading dashboard:', error);
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=compass.js.map