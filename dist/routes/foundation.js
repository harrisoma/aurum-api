"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const foundation_js_1 = require("../services/foundation.js");
const router = (0, express_1.Router)();
router.get('/habits', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const habits = await (0, foundation_js_1.getHabits)(req.user.id);
        res.json({ habits, count: habits.length, active: habits.filter(h => h.status === 'active').length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch habits' });
    }
});
router.post('/habits', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { habitName, frequency, category } = req.body;
        const habit = await (0, foundation_js_1.createHabit)(req.user.id, habitName, frequency, category);
        res.status(201).json({ habit, message: `Started new habit: ${habitName}` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create habit' });
    }
});
router.post('/habits/:id/log', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const habitId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const log = await (0, foundation_js_1.logHabitCompletion)(req.user.id, habitId);
        res.status(201).json({ log, message: 'Habit logged! Keep it up! 💪' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to log habit' });
    }
});
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, foundation_js_1.getHabitInsights)(req.user.id);
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
        const habits = await (0, foundation_js_1.getHabits)(req.user.id);
        res.json({
            summary: { total: habits.length, active: habits.filter(h => h.status === 'active').length },
            habits: habits.slice(0, 10),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=foundation.js.map