"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const vitality_js_1 = require("../services/vitality.js");
const router = (0, express_1.Router)();
router.get('/metrics', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const metrics = await (0, vitality_js_1.getHealthMetrics)(req.user.id);
        res.json({ metrics, count: metrics.length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});
router.get('/workouts', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const workouts = await (0, vitality_js_1.getWorkouts)(req.user.id);
        res.json({ workouts, count: workouts.length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});
router.post('/metrics', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { metricType, value, unit } = req.body;
        const entry = await (0, vitality_js_1.createHealthEntry)(req.user.id, metricType, value, unit);
        res.status(201).json({ entry, message: 'Health entry created' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create entry' });
    }
});
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, vitality_js_1.generateHealthInsights)(req.user.id);
        res.json({ insights, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
router.get('/recommendations', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const recommendations = await (0, vitality_js_1.getHealthRecommendations)(req.user.id);
        res.json({ recommendations, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});
router.get('/dashboard', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const metrics = await (0, vitality_js_1.getHealthMetrics)(req.user.id);
        const workouts = await (0, vitality_js_1.getWorkouts)(req.user.id);
        res.json({
            summary: { totalMetrics: metrics.length, totalWorkouts: workouts.length },
            recentMetrics: metrics.slice(0, 7),
            recentWorkouts: workouts.slice(0, 5),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=vitality.js.map