"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const summit_js_1 = require("../services/summit.js");
const router = (0, express_1.Router)();
router.get('/milestones', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const milestones = await (0, summit_js_1.getMilestones)(req.user.id);
        const completed = milestones.filter(m => m.status === 'completed').length;
        res.json({ milestones, completed, pending: milestones.length - completed, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch milestones' });
    }
});
router.post('/milestones', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, targetDate, category } = req.body;
        const milestone = await (0, summit_js_1.createMilestone)(req.user.id, title, targetDate, category);
        res.status(201).json({ milestone, message: 'Milestone created' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});
router.post('/milestones/:id/complete', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const milestoneId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const milestone = await (0, summit_js_1.completeMilestone)(req.user.id, milestoneId);
        res.json({ milestone, message: 'Milestone completed! 🎉' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to complete milestone' });
    }
});
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, summit_js_1.getMilestoneInsights)(req.user.id);
        res.json({ insights, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
router.get('/dashboard', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const milestones = await (0, summit_js_1.getMilestones)(req.user.id);
        res.json({
            summary: { total: milestones.length, completed: milestones.filter(m => m.status === 'completed').length },
            upcoming: milestones.filter(m => m.status === 'active').slice(0, 5),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=summit.js.map